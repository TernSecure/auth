import { 
  cookieHandler, 
  serverCookieHandler,
  type CookieAttributes
} from '@tern-secure/shared/cookie';
import type { SessionResult, CookieStore } from '@tern-secure/types';
import { clearSessionCookieServer } from '../admin/sessionHandler';


const SESSION_COOKIE_NAME = '_session_cookie';
const CSRF_COOKIE_NAME = '_session_terncf';


type AuthToken = {
  idToken: string | null;
}

type CSRFToken = {
  token: string | null;
}

const cookieOptions = {
  maxAge: 60 * 60, // 1 hour in seconds
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  path: '/'
};

type CookieOptions = CookieAttributes


const CSRF_COOKIE_OPTIONS: CookieOptions = {
  secure: true,
  sameSite: 'strict',
  expires: 1 / 24 //1 hour
};

/**
 * AuthCookieManger class for managing authentication state and cookies
 */
export class AuthCookieManager {
  private readonly csrfCookieHandler = cookieHandler(CSRF_COOKIE_NAME);
  private readonly sessionCookieHandler = cookieHandler(SESSION_COOKIE_NAME);
  private serverCookie: CookieStore | null = null;

  constructor() {
    this.ensureCSRFToken();
  }
  
  private generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  private ensureCSRFToken(): string {
    let ctoken = this.getCSRFToken();
    if (!ctoken) {
      ctoken = this.generateCSRFToken();
      this.setCSRFToken({ token: ctoken });
    }
    return ctoken;
  }

  createSessionCookie = async(token: string): Promise<SessionResult> => {
    try {
      await this.serverCookie!.set(SESSION_COOKIE_NAME, token, cookieOptions);
      return {
        success: true,
        message: 'Session cookie created successfully',
        cookieSet: true
      };
    } catch (error) {
      console.error('[AuthCookieManager] Failed to create session cookie:', error);
      throw error
    }
  }


  clearServerCookie = async(): Promise<SessionResult> => {
    try {
      await clearSessionCookieServer(this.serverCookie!);
      return {
        success: true,
        message: 'Session cookie cleared successfully',
        cookieSet: false
      };
    } catch (error) {
      console.error('[AuthCookieManager] Failed to clear session cookie:', error);
      throw error;
    }
  };


  /**
   * Set authentication tokens in cookies
   */
  setSessionCookie(token: AuthToken): void {
    try {
      if (token.idToken) {
        this.sessionCookieHandler.set(token.idToken, CSRF_COOKIE_OPTIONS);
      }
    } catch (error) {
      console.error('Failed to set auth tokens:', error);
      throw new Error('Unable to store authentication tokens');
    }
  }

  /**
   * Get authentication tokens from cookies
   */
  getSessionCookie(): string | undefined {
    try {
      return this.sessionCookieHandler.get();
    } catch (error) {
      console.error('Failed to get auth tokens:', error);
      return undefined
    }
  }

  /**
   * Set CSRFcookie
   */

  setCSRFToken(token: CSRFToken): void {
    try {
      if (token.token) {
        this.csrfCookieHandler.set(token.token, CSRF_COOKIE_OPTIONS);
      }
    } catch (error) {
      console.error('Failed to set CSRF token:', error);
      throw new Error('Unable to store CSRF token');
    }
  }
  
  setServerResponse(response: Response): void {
    if (!response || !response.headers) {
      console.error('[AuthCookieManager] Invalid response object provided to setServerResponse');
      return;
    }
    
    this.serverCookie = serverCookieHandler(response);
    console.log('[AuthCookieManager] Server response configured for cookie operations');
  }

  /**
   * Get CSRF token from cookies
   */
  getCSRFToken(): string | undefined {
    try {
      return this.csrfCookieHandler.get();
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
      return undefined;
    }
  }


  /**
   * Clear all authentication cookies
   */
  clearAuth(): void {
    try {
      this.sessionCookieHandler.remove();
      this.csrfCookieHandler.remove();
    } catch (error) {
      console.error('Failed to clear auth cookies:', error);
    }
  }

  /**
   * Check if user has valid session cookie
   */
  hasValidSession(): boolean {
    const sessionToken = this.getSessionCookie();
    return !!sessionToken;
  }
}