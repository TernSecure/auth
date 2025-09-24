import type { ApiClient, CreateFireApiOptions } from '../fireRestApi';
import { createFireApi } from '../fireRestApi';
import type { CreateFireAuthenticateRequestOptions } from '../tokens/requestFire';
import { createFireAuthenticateRequest } from '../tokens/requestFire';

export type TernSecureFireOptions = CreateFireApiOptions &
  CreateFireAuthenticateRequestOptions['options'];

export type TernSecureFireClient = ApiClient & ReturnType<typeof createFireAuthenticateRequest>;

export function createFireClient(options: TernSecureFireOptions): TernSecureFireClient {
  const opts = { ...options };
  const apiClient = createFireApi(opts);
  const requestState = createFireAuthenticateRequest({ options: opts });

  return {
    ...apiClient,
    ...requestState,
  };
}
