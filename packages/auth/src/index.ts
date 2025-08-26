export { TernSecureAuth } from './instance/TernAuth';
export { TernServerAuth } from './instance/TernAuthServer';
export type { TernServerAuthOptions, AuthenticatedApp } from './instance/TernAuthServer';

export { CoreApiClient, coreApiClient } from './instance/coreApiClient';
export type { 
    ApiResponse, 
    ApiResponseJSON, 
    RequestOptions,
    BeforeRequestHook,
    AfterResponseHook
} from './instance/coreApiClient';

export { SignIn, TernSecureBase } from './resources/internal';

export type {
    TernSecureConfig,
    SignInFormValuesTree,
    SignInResponseTree,
    ResendEmailVerification,
    TernSecureUser,
    TernSecureState
} from '@tern-secure/types';