import {
  createBackendInstanceClient,
} from '@tern-secure/backend';

import { API_KEY, API_URL, API_VERSION } from './constant';

const backendClientDefaultOptions = {
  apiKey: API_KEY,
  apiUrl: API_URL,
  apiVersion: API_VERSION,
};

const ternSecureBackendClient = async () => {
  return createBackendClientWithOptions({});
};

const createBackendClientWithOptions: typeof createBackendInstanceClient = options => {
  return createBackendInstanceClient({
    ...backendClientDefaultOptions,
    ...options,
  });
};

export { ternSecureBackendClient };