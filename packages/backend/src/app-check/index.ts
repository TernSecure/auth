import type { ServiceAccount } from "../auth";
import { ServiceAccountTokenManager } from "../auth";
import { cryptoSignerFromCredential } from '../utils/token-generator';
import { AppCheckApi } from "./AppCheckApi";
import { AppCheckTokenGenerator } from "./generator";
import type { AppCheckToken, AppCheckTokenOptions } from "./types";

class AppCheck {
    private readonly client: AppCheckApi;
    private readonly tokenGenerator: AppCheckTokenGenerator;
    private readonly limitedUse?: boolean;

    constructor(credential: ServiceAccountTokenManager, tenantId?: string, limitedUse?: boolean) {
        this.client = new AppCheckApi();
        this.tokenGenerator = new AppCheckTokenGenerator(
            cryptoSignerFromCredential(credential, tenantId)
        );
        this.limitedUse = limitedUse;
    }

    public createToken = (appId: string, options?: AppCheckTokenOptions): Promise<AppCheckToken> => {
        return this.tokenGenerator
            .createCustomToken(appId, options)
            .then((customToken) => {
                return this.client.exchangeToken({ customToken, limitedUse: this.limitedUse });
            });
    };

}


function getAppCheck(serviceAccount: ServiceAccount, tenantId?: string, limitedUse?: boolean): AppCheck {
    return new AppCheck(new ServiceAccountTokenManager(serviceAccount), tenantId, limitedUse);
}

export { AppCheck, getAppCheck };