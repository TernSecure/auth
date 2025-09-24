import { AbstractAPI } from "./AbstractApi";

const rootPath = "/customTokens";

type CreateSignInTokenParams = {
  email: string;
  password: string;
  returnSecureToken?: boolean;
};


export class SignInTokenApi extends AbstractAPI {
  public async createCustomToken(apiKey: string, params: CreateSignInTokenParams) {
    this.requireApiKey(apiKey);
    const { ...restParams } = params;
    return this.request({
      method: "POST",
      path: `${rootPath}`,
      bodyParams: restParams,
    });
  }

}
