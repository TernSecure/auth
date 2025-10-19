import type { DecodedIdToken, SignedInSession, TernSecureUser } from '@tern-secure/types';

import type { AuthCookieManager } from '../auth/AuthCookieManager';
import { decode } from '../utils/jwt';

/**
 * Utility functions for loading user from JWT cookie and updating client state
 * This addresses the issue where user is undefined when client loads on page refresh
 */

export interface ClientUpdateOptions {
  authCookieManager: AuthCookieManager;
  onUserUpdate?: (user: TernSecureUser | null) => void;
  onSessionUpdate?: (session: SignedInSession | null) => void;
}

/**
 * Creates Firebase user from stored JWT token (ID token)
 * Since the token is already a Firebase ID token, we validate it and wait for auth state
 */
const createClientFromJwt = (jwtToken: string | null): DecodedIdToken | null => {
  if (!jwtToken) {
    return null;
  }

  const { decoded } = decode(jwtToken);

  console.log('[TernAuth] Loaded user from JWT:', decoded);

  return decoded;
};

/**
 * Updates client user state and triggers callbacks
 */
const updateClient = (
  user: TernSecureUser | null,
  options: Pick<ClientUpdateOptions, 'onUserUpdate' | 'onSessionUpdate'>,
): void => {
  try {
    // Update user
    if (options.onUserUpdate) {
      options.onUserUpdate(user);
    }

    // Update session if user exists
    if (user && options.onSessionUpdate) {
      user
        .getIdTokenResult()
        .then(tokenResult => {
          const session: SignedInSession = {
            status: 'active',
            token: tokenResult.token,
            claims: tokenResult.claims,
            issuedAtTime: tokenResult.issuedAtTime,
            expirationTime: tokenResult.expirationTime,
            authTime: tokenResult.authTime,
            signInProvider: tokenResult.signInProvider || 'unknown',
            signInSecondFactor: tokenResult.signInSecondFactor,
          };
          if (options.onSessionUpdate) {
            options.onSessionUpdate(session);
          }
        })
        .catch(error => {
          console.error('[TernAuth] Error getting token result for session:', error);
          if (options.onSessionUpdate) {
            options.onSessionUpdate(null);
          }
        });
    } else if (options.onSessionUpdate) {
      options.onSessionUpdate(null);
    }
  } catch (error) {
    console.error('[TernAuth] Error updating client:', error);
  }
};

export { createClientFromJwt, updateClient };
