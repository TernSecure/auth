import type { VerifyAppCheckTokenResponse } from "@tern-secure/types";

import type { Credential, ServiceAccount } from "../auth";
import { ServiceAccountManager } from "../auth";
import { cryptoSignerFromCredential } from '../utils/token-generator';
import { AppCheckApi } from "./AppCheckApi";
import { AppCheckTokenGenerator } from "./generator";
import { ServerAppCheckManager } from "./serverAppCheck";
import type { AppCheckToken, AppCheckTokenOptions } from "./types";
import { AppcheckTokenVerifier, type VerifyAppcheckOptions } from "./verifier";


const JWKS_URL = 'https://firebaseappcheck.googleapis.com/v1/jwks';

class AppCheck {
    private readonly client: AppCheckApi;
    private readonly tokenGenerator: AppCheckTokenGenerator;
    private readonly appCheckTokenVerifier: AppcheckTokenVerifier;
    private readonly limitedUse?: boolean;

    constructor(credential: Credential, tenantId?: string, limitedUse?: boolean) {
        this.client = new AppCheckApi(credential);
        this.tokenGenerator = new AppCheckTokenGenerator(
            cryptoSignerFromCredential(credential, tenantId)
        );
        this.appCheckTokenVerifier = new AppcheckTokenVerifier(credential);
        this.limitedUse = limitedUse;
    }

    public createToken = (projectId: string, appId: string, options?: AppCheckTokenOptions): Promise<AppCheckToken> => {
        return this.tokenGenerator
            .createCustomToken(appId, options)
            .then((customToken) => {
                return this.client.exchangeToken({ customToken, projectId, appId });
            });
    };

    public verifyToken = async (appCheckToken: string, projectId: string, options: VerifyAppcheckOptions): Promise<VerifyAppCheckTokenResponse> => {
        return this.appCheckTokenVerifier
            .verifyToken(appCheckToken, projectId, { keyURL: JWKS_URL, ...options })
            .then((decodedToken) => {
                return {
                    appId: decodedToken.app_id,
                    token: decodedToken,
                };
            });

    }

}


function getAppCheck(serviceAccount: ServiceAccount, tenantId?: string, limitedUse?: boolean): AppCheck {
    return new AppCheck(new ServiceAccountManager(serviceAccount), tenantId, limitedUse);
}

export { AppCheck, getAppCheck };
export { ServerAppCheckManager };