import { SessionApi } from "./endpoints";
import { createRequest } from './request'

export type CreateBackendApiOptions = Parameters<typeof createRequest>[0];
export type ApiClient = ReturnType<typeof createBackendApi>;

export function createBackendApi(options: CreateBackendApiOptions) {
  const request = createRequest(options);
  return {
    sessions: new SessionApi(request),
  };
}