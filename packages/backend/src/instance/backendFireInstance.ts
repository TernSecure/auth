
import { createFireAuthenticateRequest } from "../tokens/requestFire";
import type { CreateFireAuthenticateRequestOptions } from "../tokens/requestFire";
import { createBackendApi } from "../api";
import type { CreateBackendApiOptions, ApiClient} from "../api";

export type TernSecureFireOptions = CreateBackendApiOptions & CreateFireAuthenticateRequestOptions['options']

export type TernSecureFireClient = ApiClient & ReturnType<typeof createFireAuthenticateRequest>;

export function createFireClient(options: TernSecureFireOptions): TernSecureFireClient {
  const opts = { ...options };
  const apiClient = createBackendApi(opts);
  const requestState = createFireAuthenticateRequest({options: opts});

  return {
    ...apiClient,
    ...requestState,
  };
}
