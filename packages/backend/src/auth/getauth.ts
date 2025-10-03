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

type getAuthParams = AuthenticateRequestOptions["firebaseConfig"] & AuthenticateRequestOptions["apiClient"]

export function getAuth(options: AuthenticateRequestOptions) {
  const { apiKey, tenantId } = options.firebaseConfig || {};

  async function customForIdAndRefreshToken(
    customToken: string,
  ): Promise<IdAndRefreshTokens> {

    if (!apiKey) {
      throw new Error('API Key is required to create custom token');
    }
    const response = await options.apiClient?.tokens.exchangeCustomForIdAndRefreshTokens(apiKey, {
      token: customToken,
      returnSecureToken: true,
    });

    console.log('[getAuth]customForIdAndRefreshToken response', response); // Debug log --- IGNORE ---
    console.log('[getAuth]idToken:', response?.data?.idToken); // Debug log --- IGNORE ---
    console.log('[getAuth]refreshToken:', response?.data?.refreshToken); // Debug log --- IGNORE ---

    return {
      idToken: response?.data?.idToken || '',
      refreshToken: response?.data?.refreshToken || '',
    };
  }


  async function createCustomIdAndRefreshToken(idToken: string): Promise<CustomTokens> {
    const decoded = await verifyToken(idToken, options);
    const { data, errors } = decoded;
    if (errors) {
      console.error('Token Verification failed:', errors);
      throw errors[0];
    }

    const customToken = await createCustomTokenClaims(data.uid, {
      emailVerified: data.email_verified,
      source_sign_in_provider: data.firebase.sign_in_provider,
    });

    const idAndRefreshTokens = await customForIdAndRefreshToken(
      customToken,
    );
    
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
