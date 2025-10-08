export { TernSecureAuth } from './instance/TernAuth';
export type { TernAuth } from './instance/TernAuth';
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

export { SignIn, TernSecureBase, buildURL } from './resources/internal';

export type {
    AuthErrorTree,
    TernSecureConfig,
    SignInFormValues,
    SignInProps,
    SignUpProps,
    SignInResponse,
    SignInRedirectUrl,
    SignUpRedirectUrl,
    ResendEmailVerification,
    TernSecureUser,
    TernSecureState
} from '@tern-secure/types';