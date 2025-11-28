import { createCustomToken } from '../jwt/customJwt';
import type { AuthenticateRequestOptions, TernSecureUserData } from '../tokens/types';
import { verifyToken } from '../tokens/verify';
import { ServiceAccountTokenManager } from './credential';

export interface IdAndRefreshTokens {
  idToken: string;
  refreshToken: string;
}

export interface CustomTokens {
  auth_time: number;
  idToken: string;
  refreshToken: string;
  customToken: string;
}

interface CustomForIdAndRefreshTokenOptions {
  tenantId?: string;
  appCheckToken?: string;
  referer?: string;
}

interface FirebaseRefreshTokenResponse {
  kind: string;
  id_token: string;
  refresh_token: string;
  expires_in: string;
  isNewUser: boolean;
}

type AuthResult<T = any> = { data: T; error: null } | { data: null; error: any };

const API_KEY_ERROR = 'API Key is required';
const NO_DATA_ERROR = 'No token data received';

function parseFirebaseResponse<T>(data: unknown): T {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as T;
    } catch (error) {
      throw new Error(`Failed to parse Firebase response: ${error}`);
    }
  }
  return data as T;
}

export function getAuth(options: AuthenticateRequestOptions) {
  const { apiKey, firebaseAdminConfig } = options;
  const firebaseApiKey = options.firebaseConfig?.apiKey;
  const effectiveApiKey = apiKey || firebaseApiKey;

  let credential: ServiceAccountTokenManager | null = null;
  if (
    firebaseAdminConfig?.projectId &&
    firebaseAdminConfig?.privateKey &&
    firebaseAdminConfig?.clientEmail
  ) {
    credential = new ServiceAccountTokenManager({
      projectId: firebaseAdminConfig.projectId,
      privateKey: firebaseAdminConfig.privateKey,
      clientEmail: firebaseAdminConfig.clientEmail,
    });
  }

  async function getUserData(idToken?: string, localId?: string): Promise<TernSecureUserData> {
    if (!effectiveApiKey) {
      throw new Error(API_KEY_ERROR);
    }
    const response = await options.apiClient?.userData.getUserData(effectiveApiKey, {
      idToken,
      localId,
    });

    if (!response?.data) {
      throw new Error(NO_DATA_ERROR);
    }

    const parsedData = parseFirebaseResponse<TernSecureUserData>(response.data);
    return parsedData;
  }

  async function refreshExpiredIdToken(
    refreshToken: string,
    opts: CustomForIdAndRefreshTokenOptions,
  ): Promise<AuthResult> {
    if (!effectiveApiKey) {
      return { data: null, error: new Error(API_KEY_ERROR) };
    }
    const response = await options.apiClient?.tokens.refreshToken(effectiveApiKey, {
      refresh_token: refreshToken,
      request_origin: opts.referer,
    });

    if (!response?.data) {
      return {
        data: null,
        error: new Error(NO_DATA_ERROR),
      };
    }

    const parsedData = parseFirebaseResponse<FirebaseRefreshTokenResponse>(response.data);

    return {
      data: {
        idToken: parsedData.id_token,
        refreshToken: parsedData.refresh_token,
      },
      error: null,
    };
  }

  async function customForIdAndRefreshToken(
    customToken: string,
    opts: CustomForIdAndRefreshTokenOptions,
  ): Promise<IdAndRefreshTokens> {
    if (!effectiveApiKey) {
      throw new Error('API Key is required to create custom token');
    }
    const data = await options.apiClient?.tokens.exchangeCustomForIdAndRefreshTokens(
      effectiveApiKey,
      {
        token: customToken,
        returnSecureToken: true,
      },
      {
        referer: opts.referer,
        appCheckToken: opts.appCheckToken,
      },
    );

    if (!data) {
      throw new Error('No data received from Firebase token exchange');
    }

    return {
      idToken: data.idToken,
      refreshToken: data.refreshToken,
    };
  }

  async function createCustomIdAndRefreshToken(
    idToken: string,
    opts: CustomForIdAndRefreshTokenOptions,
  ): Promise<CustomTokens> {
    const decoded = await verifyToken(idToken, options);
    const { data, errors } = decoded;
    if (errors) {
      throw errors[0];
    }

    //todo:
    /**
     * For sensitive applications, the auth_time should be checked before issuing the session cookie, minimizing the window of attack in case an ID token is stolen:
    */
    //if (new Date().getTime() / 1000 - data.auth_time < 5 * 60) {
    //proceed
    //}

    const customToken = await createCustomToken(data.uid, {
      emailVerified: data.email_verified,
      source_sign_in_provider: data.firebase.sign_in_provider,
    });

    const idAndRefreshTokens = await customForIdAndRefreshToken(customToken, {
      referer: opts.referer,
      appCheckToken: opts.appCheckToken,
    });

    const decodedCustomIdToken = await verifyToken(idAndRefreshTokens.idToken, options);
    if (decodedCustomIdToken.errors) {
      throw decodedCustomIdToken.errors[0];
    }

    return {
      ...idAndRefreshTokens,
      customToken,
      auth_time: decodedCustomIdToken.data.auth_time,
    };
  }

  async function exchangeAppCheckToken(idToken: string): Promise<AuthResult> {
    if (!credential) {
      return {
        data: null,
        error: new Error(
          'Firebase Admin config must be provided to exchange App Check tokens.',
        ),
      };
    }

    try {
      const decoded = await verifyToken(idToken, options);
      if (decoded.errors) {
        return { data: null, error: decoded.errors[0] };
      }

      const projectId = options.firebaseConfig?.projectId;
      const appId = options.firebaseConfig?.appId;

      if (!projectId || !appId) {
        return { data: null, error: new Error('Project ID and App ID are required for App Check') };
      }

      const { accessToken } = await credential.getAccessToken();

      const appCheckResponse = await options.apiClient?.appCheck.exchangeCustomToken({
        accessToken,
        projectId,
        appId,
        customToken,
        limitedUse: false,
      });

      if (!appCheckResponse?.token) {
        return { data: null, error: new Error('Failed to exchange for App Check token') };
      }

      return {
        data: {
          token: appCheckResponse.token,
          ttl: appCheckResponse.ttl
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error };
    }
  }

  return {
    getUserData,
    customForIdAndRefreshToken,
    createCustomIdAndRefreshToken,
    refreshExpiredIdToken,
    exchangeAppCheckToken,
  };
}
