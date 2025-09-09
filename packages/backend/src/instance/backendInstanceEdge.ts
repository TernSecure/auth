import {
  TernSecureRequest,
} from "../tokens/ternSecureRequest";
import type { RequestState } from "../tokens/authstate";
import { createAuthenticateRequest } from "../tokens/request";
import type { CreateAuthenticateRequestOptions } from "../tokens/request";
import { createBackendApi } from "../api";
import type { CreateBackendApiOptions, ApiClient} from "../api";

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
