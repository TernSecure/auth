export { constants } from './constants';

export type { TernSecureRequest } from './tokens/ternSecureRequest';
export { createTernSecureRequest } from './tokens/ternSecureRequest';

export type { AuthenticateRequestOptions, AuthenticateFireRequestOptions } from './tokens/types';

export type {
  AuthObject,
  RequestState,
  SignedInAuthObject,
  SignedOutAuthObject,
} from './tokens/authstate';
export { signedIn, signedInAuthObject, signedOutAuthObject, AuthStatus } from './tokens/authstate';

export { createBackendInstanceClient } from './instance/backendInstanceEdge';

export { createFireClient } from './instance/backendFireInstance';

export type { BackendInstance, TernSecureBackendOptions } from './instance/backendInstanceEdge';

export { enableDebugLogging, disableDebugLogging, setLogLevel } from './utils/enableDebugLogging';

export { LogLevel } from './utils/logger';

export {
  RedisAdapter,
  PostgresAdapter,
  createAdapter,
  validateCheckRevokedOptions,
} from './adapters';

export type {
  DisabledUserAdapter,
  DisabledUserRecord,
  AdapterConfig,
  RedisConfig,
  PostgresConfig,
  AdapterType,
  AdapterConfiguration,
  CheckRevokedOptions,
} from './adapters';
