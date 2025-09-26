import { AbstractAPI } from "./AbstractApi";

const rootPath = "/customTokens";

type ConfirmPasswordResetParams = {
  oobCode: string;
  newPassword: string;
};

type VerifyPasswordResetCodeParams = {
  oobCode: string;
};

type ChangePasswordParams = {
  idToken: string;
  password: string;
  returnSecureToken?: boolean;
};

export class PasswordApi extends AbstractAPI {
  public async verifyPasswordResetCode(apiKey: string, params: VerifyPasswordResetCodeParams) {
    this.requireApiKey(apiKey);
    const { ...restParams } = params;
    return this.request({
      method: "POST",
      path: `${rootPath}`,
      bodyParams: restParams,
    });
  }

  public async confirmPasswordReset(apiKey: string, params: ConfirmPasswordResetParams) {
    this.requireApiKey(apiKey);
    const { ...restParams } = params;
    return this.request({
      method: "POST",
      path: `${rootPath}`,
      bodyParams: restParams,
    });
  }

    public async changePassword(apiKey: string, params: ChangePasswordParams) {
    this.requireApiKey(apiKey);
    const { ...restParams } = params;
    return this.request({
      method: "POST",
      path: `${rootPath}`,
      bodyParams: restParams,
    });
  }
}