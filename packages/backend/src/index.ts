export { constants } from "./constants";

export type { TernSecureRequest } from "./instance/ternSecureRequest";
export { createTernSecureRequest } from "./instance/ternSecureRequest";

export {
  createBackendInstanceEdge,
  authenticateRequestEdge,
  signInAuthObject,
  signedIn,
} from "./instance/backendInstanceEdge";

export type {
  SignInAuthObject,
  SignedOutAuthObject,
  AuthObject,
  RequestState,
  BackendInstance,
} from "./instance/backendInstanceEdge";
