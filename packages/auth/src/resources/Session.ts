import type { IdTokenResult, SessionResource, SessionStatus, TernSecureUser } from '@tern-secure/types';

import { eventBus, events } from '../instance/events';
import { TernSecureBase } from './Base';

/**
 * Enhanced Session class that handles custom token authentication for client-server sync.
 *
 * Key Features:
 * - Manages custom tokens for server-side verification
 * - Uses TernSecureUser object directly (no Firebase Auth instance needed)
 * - Provides seamless client-server session synchronization
 * - Works with in-memory persistence by using custom tokens to restore auth state
 */
export class Session extends TernSecureBase implements SessionResource {
  pathRoot = '/sessions/createsession';

  status!: SessionStatus;
  token!: string;
  claims!: IdTokenResult['claims'];
  authTime!: string;
  expirationTime!: string;
  issuedAtTime!: string;
  signInProvider!: string | null;
  signInSecondFactor!: string | null;
  user?: TernSecureUser;

  constructor(sessionData?: Partial<SessionResource>) {
    super();
    if (sessionData) {
      this.initializeFromSessionData(sessionData);
    }
  }

  /**
   * Initialize session from existing session data
   */
  private initializeFromSessionData(sessionData: Partial<SessionResource>): void {
    this.status = sessionData.status || 'pending';
    this.token = sessionData.token || '';
    this.claims = sessionData.claims || {};
    this.authTime = sessionData.authTime || '';
    this.expirationTime = sessionData.expirationTime || '';
    this.issuedAtTime = sessionData.issuedAtTime || '';
    this.signInProvider = sessionData.signInProvider || null;
    this.signInSecondFactor = sessionData.signInSecondFactor || null;
    this.user = sessionData.user;
  }


  /**
   * Create custom token from current session for server-side sync
   * This calls the backend API to create a custom token from the current ID token
   */
  private createCustomTokenFromIdToken = (idToken: string, csrfToken: string) => {
    return this._post({
      path: this.pathRoot,
      body: {
        idToken,
        csrfToken,
      },
    });
  };

  /**
   * Create session from user after successful authentication
   * This is called from createActiveSession in TernAuth.ts
   */
  static async fromUser(user: TernSecureUser, csrfToken: string): Promise<Session> {
    const session = new Session();

    try {
      // Get ID token result from the user
      const idTokenResult = await user.getIdTokenResult();

      // Initialize session with user data
      session.status = 'active';
      session.token = idTokenResult.token;
      session.claims = idTokenResult.claims;
      session.authTime = idTokenResult.authTime;
      session.expirationTime = idTokenResult.expirationTime;
      session.issuedAtTime = idTokenResult.issuedAtTime;
      session.signInProvider = idTokenResult.signInProvider;
      session.signInSecondFactor = idTokenResult.signInSecondFactor;
      session.user = user;

      // Create custom token for server-side sync
      const customToken = await session.createCustomTokenFromIdToken(
        idTokenResult.token,
        csrfToken,
      );
      if (customToken) {
        eventBus.emit(events.SessionChanged, null);
      }

      return session;
    } catch (error) {
      console.error('[Session] Error creating session from user:', error);
      session.status = 'expired';
      throw error;
    }
  }

  /**
   * Convert session to plain object for serialization
   */
  toJSON(): SessionResource {
    return {
      status: this.status,
      token: this.token,
      claims: this.claims,
      authTime: this.authTime,
      expirationTime: this.expirationTime,
      issuedAtTime: this.issuedAtTime,
      signInProvider: this.signInProvider,
      signInSecondFactor: this.signInSecondFactor,
      user: this.user,
    };
  }
}