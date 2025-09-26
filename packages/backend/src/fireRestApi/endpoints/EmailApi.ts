import { AbstractAPI } from "./AbstractApi";

const rootPath = "/customTokens";

type sendEmailVerificationParams = {
    idToken: string;
    requestType: 'VERIFY_EMAIL';
};

type ConfirmEmailVerificationParams = {
  oobCode: string;
};


export class EmailApi extends AbstractAPI {
  public async verifyEmailVerification(apiKey: string, params: sendEmailVerificationParams) {
    this.requireApiKey(apiKey);
    const { ...restParams } = params;
    return this.request({
      method: "POST",
      path: `${rootPath}`,
      bodyParams: restParams,
    });
  }

  public async confirmEmailVerification(apiKey: string, params: ConfirmEmailVerificationParams) {
    this.requireApiKey(apiKey);
    const { ...restParams } = params;
    return this.request({
      method: "POST",
      path: `${rootPath}`,
      bodyParams: restParams,
    });
  }
}