import {
  TernSecureRequest,
  createTernSecureRequest,
} from "../tokens/ternSecureRequest";
import type { RequestState } from "../tokens/authstate";
import { authenticateRequestEdge } from "../tokens/requestEdge";
import { type CheckRevokedOptions } from "../adapters";
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

export const createBackendInstanceEdge = async (
  request: Request,
  checkRevoked?: CheckRevokedOptions
): Promise<BackendInstance> => {
  const ternSecureRequest = createTernSecureRequest(request);
  const requestState = await authenticateRequestEdge(
    ternSecureRequest,
    checkRevoked
  );

  return {
    ternSecureRequest,
    requestState,
  };
};


export function createBackendInstanceClient(options: TernSecureBackendOptions): TernSecureBackendClient {
  const opts = { ...options };
  const apiClient = createBackendApi(opts);
  const requestState = createAuthenticateRequest({options: opts, apiClient});

  return {
    ...apiClient,
    ...requestState,
  };
}
