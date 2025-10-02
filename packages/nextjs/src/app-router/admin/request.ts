import type { AuthenticateRequestOptions } from '@tern-secure/backend';
import { constants } from '@tern-secure/backend';
import { getAuth } from '@tern-secure/backend/auth';
import { getCookieName, getCookiePrefix } from '@tern-secure/shared/cookie';

import { ternSecureBackendClient } from '../../server/ternsecureClient';
import type { NextCookieStore } from '../../utils/NextCookieAdapter';
import {
  FIREBASE_API_KEY,
  FIREBASE_APP_ID,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
} from './constants';
import type { TernSecureHandlerOptions } from './types';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
};

export async function refreshCookieWithIdToken(
  idToken: string,
  cookieStore: NextCookieStore,
  options?: TernSecureHandlerOptions,
): Promise<void> {
  const backendClient = await ternSecureBackendClient();
  const authOptions: AuthenticateRequestOptions = {
    firebaseConfig: {
      apiKey: FIREBASE_API_KEY,
      authDomain: FIREBASE_AUTH_DOMAIN,
      projectId: FIREBASE_PROJECT_ID,
      storageBucket: FIREBASE_STORAGE_BUCKET,
      messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
      appId: FIREBASE_APP_ID,
      tenantId: options?.tenantId || undefined,
    },
    apiClient: backendClient,
  };

  const { createCustomIdAndRefreshToken } = getAuth(authOptions);

  const customTokens = await createCustomIdAndRefreshToken(idToken);

  console.log('Custom idToken:', customTokens.idToken);
  console.log('Custom refreshToken:', customTokens.refreshToken);

  const cookiePrefix = getCookiePrefix();

  await Promise.all([
    cookieStore.set(
      getCookieName(constants.Cookies.IdToken, cookiePrefix),
      customTokens.idToken,
      COOKIE_OPTIONS,
    ),
    cookieStore.set(
      getCookieName(constants.Cookies.Refresh, cookiePrefix),
      customTokens.refreshToken,
      COOKIE_OPTIONS,
    ),
    cookieStore.set(constants.Cookies.Custom, customTokens.customToken, COOKIE_OPTIONS),
  ]);
}
