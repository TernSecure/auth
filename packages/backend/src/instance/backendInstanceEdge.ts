import type { ApiClient,CreateBackendApiOptions} from "../api";
import { createBackendApi } from "../api";
import type { RequestState } from "../tokens/authstate";
import type { CreateAuthenticateRequestOptions } from "../tokens/request";
import { createAuthenticateRequest } from "../tokens/request";
import type {
  TernSecureRequest,
} from "../tokens/ternSecureRequest";

export type TernSecureBackendOptions = CreateBackendApiOptions & CreateAuthenticateRequestOptions['options']

export type TernSecureBackendClient = ApiClient & ReturnType<typeof createAuthenticateRequest>;

export interface BackendInstance {
  ternSecureRequest: TernSecureRequest;
  requestState: RequestState;
}

export function createBackendInstanceClient(options: TernSecureBackendOptions): TernSecureBackendClient {
  const opts = { ...options };
  const apiClient = createBackendApi(opts);
  const requestState = createAuthenticateRequest({options: opts, apiClient});

  return {
    ...apiClient,
    ...requestState,
  };
}
