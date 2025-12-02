import type { JWTPayload } from '@tern-secure/types';

import type { Credential, ServiceAccountManager } from '../auth';
import { fetchText } from '../utils/fetcher'
import { ternSignBlob, ternSignJwt } from './signJwt';
import { ALGORITHM_RS256, type CryptoSigner } from './types';


class ServiceAccountSigner implements CryptoSigner {

    constructor(
        private readonly credential: ServiceAccountManager,
        private tenantId?: string
    ) { }

    public async getAccountId(): Promise<string> {
        return Promise.resolve(this.credential.clientEmail);
    }

    public async sign(payload: JWTPayload): Promise<string> {
        if (this.tenantId) {
            payload.tenant_id = this.tenantId;
        }

        return ternSignJwt({ payload, privateKey: this.credential.privateKey });
    }
}

class IAMSigner implements CryptoSigner {
    algorithm = ALGORITHM_RS256;

    private credential: Credential;
    private tenantId?: string;
    private serviceAccountId?: string;

    constructor(
        credential: Credential,
        tenantId?: string,
        serviceAccountId?: string
    ) {
        this.credential = credential;
        this.tenantId = tenantId;
        this.serviceAccountId = serviceAccountId;
    }

    public async sign(payload: JWTPayload): Promise<string> {
        if (this.tenantId) {
            payload.tenant_id = this.tenantId;
        }

        const serviceAccount = await this.getAccountId();
        const accessToken = await this.credential.getAccessToken();

        return ternSignBlob({
            accessToken: accessToken.accessToken,
            serviceAccountId: serviceAccount,
            payload
        });
    }

    public async getAccountId(): Promise<string> {
        if (this.serviceAccountId) {
            return this.serviceAccountId;
        }

        const token = await this.credential.getAccessToken();
        const url =
            'http://metadata/computeMetadata/v1/instance/service-accounts/default/email';
        const request: RequestInit = {
            method: 'GET',
            headers: {
                'Metadata-Flavor': 'Google',
                Authorization: `Bearer ${token.accessToken}`
            }
        };

        return (this.serviceAccountId = await fetchText(url, request));
    }
}


export { ServiceAccountSigner, IAMSigner };

