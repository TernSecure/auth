
import { AbstractAPI } from "./AbstractApi";

const rootPath = "/sessions";


type RefreshTokenParams = {
  expired_token: string;
  refresh_token: string;
  request_origin: string;
  request_originating_ip?: string;
  request_headers?: Record<string, string[]>;
  suffixed_cookies?: boolean;
  format?: 'token' | 'cookie';
};

export class TokenApi extends AbstractAPI {
  public async refreshToken(apiKey: string, params: RefreshTokenParams) {
    this.requireApiKey(apiKey);
    const { ...restParams } = params;
    return this.request({
      method: "POST",
      path: `${rootPath}/refresh`,
      bodyParams: restParams,
    });
  }

}
