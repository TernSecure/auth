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
  SignedInAuthObject,
  SignedOutAuthObject,
  AuthObject,
  RequestState,
  BackendInstance,
} from "./instance/backendInstanceEdge";

export {
  enableDebugLogging,
  disableDebugLogging,
  setLogLevel,
} from "./utils/enableDebugLogging";

export { LogLevel } from "./utils/logger";

export {
  RedisAdapter,
  PostgresAdapter,
  createAdapter,
  validateCheckRevokedOptions,
} from "./adapters";

export type {
  DisabledUserAdapter,
  DisabledUserRecord,
  AdapterConfig,
  RedisConfig,
  PostgresConfig,
  AdapterType,
  AdapterConfiguration,
  CheckRevokedOptions,
} from "./adapters";
