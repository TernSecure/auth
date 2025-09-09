'use server';

import { getAuthForTenant } from '../utils/gemini_admin-init';
import type {
  SessionParams,
  SessionResult,
  CookieStore,
} from '@tern-secure/types';
import { handleFirebaseAuthError } from '@tern-secure/shared/errors';
import type { RequestOptions } from '../tokens/types';
import { getCookieOptions, getSessionConfig } from '../tokens/sessionConfig';

const SESSION_CONSTANTS = {
  COOKIE_NAME: '_session_cookie',
  //DEFAULT_EXPIRES_IN_MS: 60 * 60 * 24 * 5 * 1000, // 5 days
  //DEFAULT_EXPIRES_IN_SECONDS: 60 * 60 * 24 * 5, // 5days
  DEFAULT_EXPIRES_IN_MS: 5 * 60 * 1000, // 5 minutes
  DEFAULT_EXPIRES_IN_SECONDS: 5 * 60,
  REVOKE_REFRESH_TOKENS_ON_SIGNOUT: true,
} as const;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
} as const;

export async function createSessionCookie(
  params: SessionParams | string,
  cookieStore: CookieStore,
  options?: RequestOptions
): Promise<SessionResult> {
  try {
    const adminAuth = getAuthForTenant(options?.tenantId);
    const sessionConfig = getSessionConfig(options);
    const cookieOptions = getCookieOptions(options);

    let decodedToken;
    let sessionCookie;

    const idToken = typeof params === 'string' ? params : params.idToken;

    if (!idToken) {
      const error = new Error('ID token is required for session creation');
      console.error('[createSessionCookie] Missing ID token:', error);
      return {
        success: false,
        message: 'ID token is required',
        error: 'INVALID_TOKEN',
        cookieSet: false,
      };
    }

    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (verifyError) {
      console.error(
        '[createSessionCookie] ID token verification failed:',
        verifyError
      );
      const authError = handleFirebaseAuthError(verifyError);
      return {
        success: false,
        message: authError.message,
        error: authError.code,
        cookieSet: false,
      };
    }

    if (!decodedToken) {
      const error = new Error('Invalid ID token - verification returned null');
      console.error(
        '[createSessionCookie] Token verification returned null:',
        error
      );
      return {
        success: false,
        message: 'Invalid ID token',
        error: 'INVALID_TOKEN',
        cookieSet: false,
      };
    }

    try {
      sessionCookie = await adminAuth.createSessionCookie(idToken, {
        expiresIn: SESSION_CONSTANTS.DEFAULT_EXPIRES_IN_MS,
      });
    } catch (sessionError) {
      console.error(
        '[createSessionCookie] Firebase session cookie creation failed:',
        sessionError
      );
      const authError = handleFirebaseAuthError(sessionError);
      return {
        success: false,
        message: authError.message,
        error: authError.code,
        cookieSet: false,
      };
    }

    // Set the cookie and verify it was set
    let cookieSetSuccessfully = false;
    try {
      //const cookieStore = await cookies();
      cookieStore.set(SESSION_CONSTANTS.COOKIE_NAME, sessionCookie, {
        maxAge: SESSION_CONSTANTS.DEFAULT_EXPIRES_IN_SECONDS,
        ...COOKIE_OPTIONS,
      });

      // Verify the cookie was actually set
      const verifySetCookie = await cookieStore.get(
        SESSION_CONSTANTS.COOKIE_NAME
      );
      cookieSetSuccessfully = !!verifySetCookie?.value;

      if (!cookieSetSuccessfully) {
        const error = new Error('Session cookie was not set successfully');
        console.error(
          '[createSessionCookie] Cookie verification failed:',
          error
        );
        throw error;
      }
    } catch (cookieError) {
      console.error(
        '[createSessionCookie] Failed to set session cookie:',
        cookieError
      );
      return {
        success: false,
        message: 'Failed to set session cookie',
        error: 'COOKIE_SET_FAILED',
        cookieSet: false,
      };
    }

    console.log(
      `[createSessionCookie] Session cookie created successfully for user: ${decodedToken.uid}`
    );
    return {
      success: true,
      message: 'Session created successfully',
      expiresIn: SESSION_CONSTANTS.DEFAULT_EXPIRES_IN_SECONDS,
      cookieSet: cookieSetSuccessfully,
    };
  } catch (error) {
    console.error('[createSessionCookie] Unexpected error:', error);
    const authError = handleFirebaseAuthError(error);
    return {
      success: false,
      message: authError.message || 'Failed to create session',
      error: authError.code || 'INTERNAL_ERROR',
      cookieSet: false,
    };
  }
}

export async function clearSessionCookie(
  cookieStore: CookieStore,
  options?: RequestOptions & { tenantId?: string }
): Promise<SessionResult> {
  try {
    const adminAuth = getAuthForTenant(options?.tenantId);
    const sessionCookie = await cookieStore.get(SESSION_CONSTANTS.COOKIE_NAME);

    await cookieStore.delete(SESSION_CONSTANTS.COOKIE_NAME);
    await cookieStore.delete('_session_token');
    await cookieStore.delete('_session');

    if (
      SESSION_CONSTANTS.REVOKE_REFRESH_TOKENS_ON_SIGNOUT &&
      sessionCookie?.value
    ) {
      try {
        const decodedClaims = await adminAuth.verifySessionCookie(
          sessionCookie.value
        );
        await adminAuth.revokeRefreshTokens(decodedClaims.sub);
        console.log(
          `[clearSessionCookie] Successfully revoked tokens for user: ${decodedClaims.sub}`
        );
      } catch (revokeError) {
        console.error(
          '[clearSessionCookie] Failed to revoke refresh tokens:',
          revokeError
        );
      }
    }

    console.log('[clearSessionCookie] Session cookies cleared successfully');
    return {
      success: true,
      message: 'Session cleared successfully',
      cookieSet: false,
    };
  } catch (error) {
    console.error('[clearSessionCookie] Unexpected error:', error);
    const authError = handleFirebaseAuthError(error);
    return {
      success: false,
      message: authError.message || 'Failed to clear session',
      error: authError.code || 'INTERNAL_ERROR',
      cookieSet: false,
    };
  }
}

export async function createCustomToken(
  uid: string,
  options?: RequestOptions & { tenantId?: string }
): Promise<string | null> {
  try {
    const adminAuth = getAuthForTenant(options?.tenantId);
    const customToken = await adminAuth.createCustomToken(uid);
    return customToken;
  } catch (error) {
    console.error('[createCustomToken] Error creating custom token:', error);
    return null;
  }
}
