import type { IdTokenResult, TernSecureUser } from 'all';

export type SessionStatus = 'active' | 'expired' | 'revoked' | 'pending';

/**
 * Represents a session when the user is authenticated and the token is considered active.
 */
export interface ActiveSession extends IdTokenResult {
  status: 'active';
  user?: TernSecureUser;
}

/**
 * Represents a session when the user was authenticated, but the token has expired.
 */
export interface ExpiredSession extends IdTokenResult {
  status: 'expired';
  user?: TernSecureUser;
}

/**
 * Represents a session that is awaiting some action.
 */
export interface PendingSession extends IdTokenResult {
  status: 'pending';
  user?: TernSecureUser;
}

/**
 * Defines the possible states of a user's session within TernSecure.
 * This is a discriminated union based on the `status` property.
 * The actual `TernSecureUser` (Firebase User object) is typically stored separately,
 * for example, in `TernSecureInstanceTree.auth.user`.
 */
export type TernSecureSessionTree = ActiveSession | ExpiredSession;

export type SignedInSession = ActiveSession | PendingSession | ExpiredSession;

export interface SessionParams {
  idToken: string;
  csrfToken?: string;
}

export interface SessionResult {
  success: boolean;
  message: string;
  expiresIn?: number;
  error?: string;
  cookieSet?: boolean;
}

export interface SessionResource extends IdTokenResult {
  status: SessionStatus;
  user?: TernSecureUser;
}
