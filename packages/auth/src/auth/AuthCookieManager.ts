import type { CookieAttributes } from '@tern-secure/shared/cookie';
import { cookieHandler } from '@tern-secure/shared/cookie';

import { createTernAUT } from './cookies/authTime_cookie';

const CSRF_COOKIE_NAME = '__terncf';

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
 * AuthCookieManager class for managing authentication state and cookies
 */
export class AuthCookieManager {
  private readonly csrfCookieHandler = cookieHandler(CSRF_COOKIE_NAME);
  private readonly ternAutCookie = createTernAUT();

  constructor() {
    this.ensureCSRFToken();
    this.ensureAuthTimeCookie();
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
   * Ensures the tern_aut cookie exists with value 0 if not already set.
   * This is critical for SSR with browserCookie persistence so middleware
   * doesn't throw errors when the cookie is missing.
   */
  private ensureAuthTimeCookie(): void {
    this.ternAutCookie.initialize();
  }

  /**
   * Get auth_time value from cookie
   */
  getAuthTime(): number {
    return this.ternAutCookie.get();
  }

  /**
   * Set auth_time value in cookie
   * Only accepts non-zero values from server
   */
  setAuthTime(authTime: number): void {
    this.ternAutCookie.set(authTime);
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
