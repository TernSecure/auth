import { AsyncLocalStorage } from 'node:async_hooks';

import type { AuthenticateRequestOptions } from '@tern-secure/backend';

export const ternSecureProxyRequestDataStore = new Map<'requestData', AuthenticateRequestOptions>();
export const ternSecureProxyRequestDataStorage = new AsyncLocalStorage<typeof ternSecureProxyRequestDataStore>();