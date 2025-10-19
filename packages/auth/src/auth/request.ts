import type { TernSecureUserData } from '@tern-secure/types';

import type { TokenResult } from '../resources/cookie';
import { Cookie } from '../resources/cookie';
import { UserData } from '../resources/UserData';

export interface UserDataParams {
  idToken: string;
}

/**
 * Client-side authentication request functionality
 * Uses backend API calls through the configured apiUrl
 */
export class ClientAuthRequest {
  private cookie: Cookie;
  private userData: UserData;

  constructor() {
    this.cookie = new Cookie();
    this.userData = new UserData();
  }

  /**
   * Get UserData
   */
  async getUserData(): Promise<TernSecureUserData | null> {
    try {
      const response = await this.userData.get();

      if (response?.response) {
        return response.response as TernSecureUserData;
      }

      return null;
    } catch (error) {
      console.error('[ClientAuthRequest] Failed to get user data:', error);
      throw error;
    }
  }

  /**
   * Get ID token from httpOnly cookies
   */
  async getIdTokenFromCookie(): Promise<TokenResult> {
    try {
      return await this.cookie.getIdToken();
    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve ID token from cookies: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Get session token from httpOnly cookies
   */
  async getSessionTokenFromCookie(): Promise<TokenResult> {
    try {
      return await this.cookie.getSessionToken();
    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve session token from cookies: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Get refresh token from httpOnly cookies
   */
  async getRefreshTokenFromCookie(): Promise<TokenResult> {
    try {
      return await this.cookie.getRefreshToken();
    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve refresh token from cookies: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Get custom token from httpOnly cookies
   */
  async getCustomTokenFromCookie(): Promise<TokenResult> {
    try {
      return await this.cookie.getCustomToken();
    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve custom token from cookies: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Get all tokens from httpOnly cookies
   */
  async getAllTokensFromCookies(): Promise<Record<string, TokenResult>> {
    try {
      return await this.cookie.getAllTokens();
    } catch (error) {
      const errorMessage = `Failed to retrieve tokens from cookies: ${error instanceof Error ? error.message : String(error)}`;
      return {
        idToken: { success: false, error: errorMessage },
        sessionToken: { success: false, error: errorMessage },
        refreshToken: { success: false, error: errorMessage },
        customToken: { success: false, error: errorMessage },
      };
    }
  }

  /**
   * Check if a specific token exists in cookies
   */
  async hasTokenInCookie(
    tokenType: 'idToken' | 'sessionToken' | 'refreshToken' | 'customToken',
  ): Promise<boolean> {
    try {
      return await this.cookie.hasToken(tokenType);
    } catch (error) {
      console.error(`[ClientAuthRequest] Failed to check ${tokenType} existence:`, error);
      return false;
    }
  }

  /**
   * Get user data using token from cookies
   * First tries to get ID token from cookies, then uses it for user data request
   */
  async getUserDataWithCookieToken(): Promise<TernSecureUserData | null> {
    try {
      const idTokenResult = await this.getIdTokenFromCookie();

      if (!idTokenResult.success || !idTokenResult.token) {
        console.warn('[ClientAuthRequest] No ID token available in cookies for user data request');
        return null;
      }

      const userData = new UserData();
      const response = await userData.get();

      if (response?.response) {
        return response.response as TernSecureUserData;
      }

      return null;
    } catch (error) {
      console.error('[ClientAuthRequest] Failed to get user data with cookie token:', error);
      throw error;
    }
  }
}

export function createClientAuthRequest(): ClientAuthRequest {
  return new ClientAuthRequest();
}
