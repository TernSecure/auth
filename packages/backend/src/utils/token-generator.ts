import type { Credential } from '../auth'
import { ServiceAccountManager } from '../auth'
import type { CryptoSigner } from '../jwt'
import { IAMSigner, ServiceAccountSigner } from '../jwt'

export function cryptoSignerFromCredential(
    credential: Credential,
    tenantId?: string,
    serviceAccountId?: string
): CryptoSigner {
    if (credential instanceof ServiceAccountManager) {
        return new ServiceAccountSigner(credential, tenantId);
    }

    return new IAMSigner(credential, tenantId, serviceAccountId);
}