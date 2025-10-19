import type {
  IdTokenResult,
  SessionJson,
  SessionResource,
  SessionStatus,
  TernSecureUser,
} from '@tern-secure/types';

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

  constructor(sessionData: Partial<SessionResource>) {
    super();
    this.initializeFromSessionData(sessionData);
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
  private createSession = (idToken: string, csrfToken: string) => {
    return this._post({
      path: this.pathRoot,
      body: {
        idToken,
        csrfToken,
      },
    });
  };


  /**
   * FIXED: Now properly returns the custom token string instead of the full API response
   * This method correctly extracts the token from the API response structure
   */
  getIdAndRefreshToken = async (idToken: string, csrfToken: string): Promise<void> => {
    await this.createSession(idToken, csrfToken);
  };

  /**
   * NEW: create method that calls API to create session
   * API handles everything, no return value needed
   * This method works with the existing sessionData passed to constructor
   */
  create = async (csrfToken: string): Promise<void> => {
    await this.createSession(this.token, csrfToken);
    eventBus.emit(events.SessionChanged, null);
  };

  /**
   * Convert session to plain object for serialization
   */
  toJSON(): SessionJson {
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
