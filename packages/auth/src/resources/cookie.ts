import type { CookieResource } from '@tern-secure/types';

//import { eventBus, events } from '../instance/events';
import { TernSecureBase } from './Base';

export type TokenResult = {
  success: boolean;
  token?: string;
  error?: string;
};

type CookieTokenResponse = {
  success: boolean;
  token?: string;
  error?: string;
};

export class Cookie extends TernSecureBase implements CookieResource {
  pathroot = 'cookies';

  idToken?: string;
  sessionToken?: string;
  refreshToken?: string;
  customToken?: string;

  constructor() {
    super();
  }

  private getTokenInCookie = (tokenName: string) => {
    return this.baseGet({
      path: `${this.pathroot}/get`,
      search: { tokenName },
    });
  };


  private parseTokenResponse = (
    apiResponse: any,
    tokenType: string,
  ): TokenResult => {
    if (!apiResponse) {
      return {
        success: false,
        error: `${tokenType} not found in httpOnly cookies`,
      };
    }

    const { success, token, error } = apiResponse as CookieTokenResponse;

    return {
      success,
      token,
      error,
    };
  };

  getIdToken = async (): Promise<TokenResult> => {
    const res = await this.getTokenInCookie('idToken');
    //eventBus.emit(events.TokenJwt, { tokenType: 'idToken', response: res });
    return this.parseTokenResponse(res, 'idToken');
  };

  getSessionToken = async (): Promise<TokenResult> => {
    try {
      const response = await this.getTokenInCookie('sessionToken');

      if (!response || !response.response?.token) {
        return {
          success: false,
          error: 'Session token not found in httpOnly cookies',
        };
      }

      return {
        success: true,
        token: response.response.token,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve session token: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  };

  getRefreshToken = async (): Promise<TokenResult> => {
    try {
      const response = await this.getTokenInCookie('refreshToken');

      if (!response || !response.response?.token) {
        return {
          success: false,
          error: 'Refresh token not found in httpOnly cookies',
        };
      }

      return {
        success: true,
        token: response.response.token,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve refresh token: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  };

  getCustomToken = async (): Promise<TokenResult> => {
    try {
      const response = await this.getTokenInCookie('customToken');

      if (!response || !response.response?.token) {
        return {
          success: false,
          error: 'Custom token not found in httpOnly cookies',
        };
      }

      return {
        success: true,
        token: response.response.token,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve custom token: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  };

  getAllTokens = async (): Promise<Record<string, TokenResult>> => {
    const [idToken, sessionToken, refreshToken, customToken] = await Promise.all([
      this.getIdToken(),
      this.getSessionToken(),
      this.getRefreshToken(),
      this.getCustomToken(),
    ]);

    return {
      idToken,
      sessionToken,
      refreshToken,
      customToken,
    };
  };

  hasToken = async (tokenType: keyof CookieResource): Promise<boolean> => {
    switch (tokenType) {
      case 'idToken':
        return (await this.getIdToken()).success;
      case 'sessionToken':
        return (await this.getSessionToken()).success;
      case 'refreshToken':
        return (await this.getRefreshToken()).success;
      case 'customToken':
        return (await this.getCustomToken()).success;
      default:
        return false;
    }
  };
}
