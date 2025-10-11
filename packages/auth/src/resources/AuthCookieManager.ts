import { type CookieAttributes, cookieHandler } from '@tern-secure/shared/cookie';

const CSRF_COOKIE_NAME = '_session_terncf';

type CSRFToken = {
  token: string | null;
};

type CookieOptions = CookieAttributes;

const CSRF_COOKIE_OPTIONS: CookieOptions = {
  secure: true,
  sameSite: 'strict',
  expires: 1 / 24, //1 hour
};

/**
 * AuthCookieManger class for managing authentication state and cookies
 */
export class AuthCookieManager {
  private readonly csrfCookieHandler = cookieHandler(CSRF_COOKIE_NAME);

  constructor() {
    this.ensureCSRFToken();
  }

  private generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private ensureCSRFToken(): string {
    let ctoken = this.getCSRFToken();
    if (!ctoken) {
      ctoken = this.generateCSRFToken();
      this.setCSRFToken({ token: ctoken });
    }
    return ctoken;
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
      this.csrfCookieHandler.remove();
    } catch (error) {
      console.error('Failed to clear auth cookies:', error);
    }
  }
}
