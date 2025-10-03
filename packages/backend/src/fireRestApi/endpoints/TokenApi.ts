import type { IdAndRefreshTokens } from '../resources/Token';
import { AbstractAPI } from './AbstractApi';

const rootPath = '/sessions';
const base = 'accounts:signInWithCustomToken';

type RefreshTokenParams = {
  expired_token: string;
  refresh_token: string;
  request_origin: string;
  request_originating_ip?: string;
  request_headers?: Record<string, string[]>;
  suffixed_cookies?: boolean;
  format?: 'token' | 'cookie';
};

type IdAndRefreshTokensParams = {
  token: string;
  returnSecureToken?: boolean;
};

export class TokenApi extends AbstractAPI {
  public async refreshToken(apiKey: string, params: RefreshTokenParams) {
    this.requireApiKey(apiKey);
    const { ...restParams } = params;
    return this.request({
      endpoint: 'refreshToken',
      method: 'POST',
      bodyParams: restParams,
    });
  }

  public async exchangeCustomForIdAndRefreshTokens(
    apiKey: string,
    params: IdAndRefreshTokensParams,
  ) {
    this.requireApiKey(apiKey);

    return this.request<IdAndRefreshTokens>({
      endpoint: 'signInWithCustomToken',
      method: 'POST',
      apiKey,
      bodyParams: params,
    });
  }
}
