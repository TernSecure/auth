import type { IdAndRefreshTokens } from '../resources/Token';
import { AbstractAPI } from './AbstractApi';

type RefreshTokenParams = {
  expired_token?: string;
  refresh_token: string;
  request_origin?: string;
  request_originating_ip?: string;
  request_headers?: Record<string, string[]>;
  suffixed_cookies?: boolean;
  app_check_token?: string;
  format?: 'token' | 'cookie';
};

type IdAndRefreshTokensParams = {
  token: string;
  returnSecureToken?: boolean;
};

type IdAndRefreshTokensOptions = {
  referer?: string;
  appCheckToken?: string;
};

export class TokenApi extends AbstractAPI {
  public async refreshToken(apiKey: string, params: RefreshTokenParams) {
    this.requireApiKey(apiKey);
    const { refresh_token, request_origin, app_check_token, ...restParams } = params;

    const headers: Record<string, string> = {};
    if (request_origin) {
      headers['Referer'] = request_origin;
    }

    if (app_check_token) {
      headers['X-Firebase-AppCheck'] = app_check_token;
    }


    const bodyParams = {
      grant_type: 'refresh_token',
      refresh_token,
      ...restParams,
    };

    return this.request({
      endpoint: 'refreshToken',
      method: 'POST',
      apiKey,
      bodyParams,
      headerParams: headers,
    });
  }

  public async exchangeCustomForIdAndRefreshTokens(
    apiKey: string,
    params: IdAndRefreshTokensParams,
    options?: IdAndRefreshTokensOptions,
  ): Promise<IdAndRefreshTokens> {
    this.requireApiKey(apiKey);

    const headers: Record<string, string> = {};
    if (options?.referer) {
      headers['Referer'] = options.referer;
    }
    if (options?.appCheckToken) {
      headers['X-Firebase-AppCheck'] = options.appCheckToken;
    }

    const response = await this.request<IdAndRefreshTokens>({
      endpoint: 'signInWithCustomToken',
      method: 'POST',
      apiKey,
      bodyParams: params,
      headerParams: headers,
    });

    if (response.errors) {
      throw new Error(response.errors[0].message);
    }

    if (!response.data) {
      throw new Error('No data received from Firebase token exchange');
    }

    return response.data;
  }
}
