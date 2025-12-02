import type { ResetPasswordEmail } from '../resources/EmailAddress';
import { AbstractAPI } from './AbstractApi';

type ResetPasswordEmailParams = {
    email: string;
    requestType: 'PASSWORD_RESET';
};

type opts = {
    appCheckToken?: string;
}

export class SignInApi extends AbstractAPI {
    public async resetPasswordEmail(
        apiKey: string,
        params: ResetPasswordEmailParams,
        options?: opts,
    ): Promise<ResetPasswordEmail> {
        try {
            this.requireApiKey(apiKey);
            const headers: Record<string, string> = {};
            if (options?.appCheckToken) {
                headers['X-Firebase-AppCheck'] = options.appCheckToken;
            }
            const { ...restParams } = params;

            const response = await this.request<ResetPasswordEmail>({
                endpoint: 'sendOobCode',
                method: 'POST',
                apiKey,
                bodyParams: restParams,
                headerParams: headers,
            });

            if (response.errors) {
                const errorMessage = response.errors[0]?.message || 'Failed to send reset password email';
                throw new Error(errorMessage);
            }
            return response.data;
        } catch (error) {
            const contextualMessage = `Failed to send reset password email: ${error instanceof Error ? error.message : 'Unknown error'}`;
            throw new Error(contextualMessage);
        }
    }
}