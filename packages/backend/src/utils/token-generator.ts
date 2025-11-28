import { ServiceAccountTokenManager } from '../auth'
import type { CryptoSigner } from '../jwt'
import { IAMSigner, ServiceAccountSigner } from '../jwt'

export function cryptoSignerFromCredential(
    credential: ServiceAccountTokenManager,
    tenantId?: string,
    serviceAccountId?: string
): CryptoSigner {
    if (credential instanceof ServiceAccountTokenManager) {
        return new ServiceAccountSigner(credential, tenantId);
    }

    return new IAMSigner(credential, tenantId, serviceAccountId);
}