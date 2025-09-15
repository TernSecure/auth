
import type { ApiClient,CreateBackendApiOptions} from "../api";
import { createBackendApi } from "../api";
import type { CreateFireAuthenticateRequestOptions } from "../tokens/requestFire";
import { createFireAuthenticateRequest } from "../tokens/requestFire";

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
