import { createCustomTokenClaims } from '../admin';
import type { AuthenticateRequestOptions } from '../tokens/types';
import { verifyToken } from '../tokens/verify';

export interface IdAndRefreshTokens {
  idToken: string;
  refreshToken: string;
}

export interface CustomTokens {
  idToken: string;
  refreshToken: string;
  customToken: string;
}

interface CustomForIdAndRefreshTokenOptions {
  tenantId?: string;
  appCheckToken?: string;
  referer?: string;
}

interface FirebaseCustomTokenResponse {
  kind: string;
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  isNewUser: boolean;
}

type getAuthParams = AuthenticateRequestOptions['firebaseConfig'] &
  AuthenticateRequestOptions['apiClient'];

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
  const { apiKey } = options.firebaseConfig || {};

  async function customForIdAndRefreshToken(
    customToken: string,
    opts: CustomForIdAndRefreshTokenOptions,
  ): Promise<IdAndRefreshTokens> {
    if (!apiKey) {
      throw new Error('API Key is required to create custom token');
    }
    const response = await options.apiClient?.tokens.exchangeCustomForIdAndRefreshTokens(
      apiKey,
      {
        token: customToken,
        returnSecureToken: true,
      },
      {
        referer: opts.referer,
      },
    );

    if (!response?.data) {
      throw new Error('No data received from Firebase token exchange');
    }

    const parsedData = parseFirebaseResponse<FirebaseCustomTokenResponse>(response.data);

    return {
      idToken: parsedData.idToken,
      refreshToken: parsedData.refreshToken,
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

    const customToken = await createCustomTokenClaims(data.uid, {
      emailVerified: data.email_verified,
      source_sign_in_provider: data.firebase.sign_in_provider,
    });

    const idAndRefreshTokens = await customForIdAndRefreshToken(customToken, {
      referer: opts.referer,
    });

    return {
      ...idAndRefreshTokens,
      customToken,
    };
  }

  return {
    customForIdAndRefreshToken,
    createCustomIdAndRefreshToken,
  };
}
