import { AbstractAPI } from './AbstractApi';

type ResetPasswordEmailParams = {
    email: string;
    requestType: 'PASSWORD_RESET';
};

export class SignInApi extends AbstractAPI {
    public async resetPasswordEmail(
        apiKey: string,
        params: ResetPasswordEmailParams,
    ) {
        try {
            this.requireApiKey(apiKey);
            const { ...restParams } = params;

            return this.request({
                endpoint: 'sendOobCode',
                method: 'POST',
                bodyParams: restParams,
            });

        } catch (error) {
            const contextualMessage = `Failed to create custom token: ${error instanceof Error ? error.message : 'Unknown error'}`;
            throw new Error(contextualMessage);
        }

    }
}