import type {
    SignInFallbackRedirectUrl,
    SignInForceRedirectUrl,
    SignInProps,
    SignUpFallbackRedirectUrl,
    SignUpForceRedirectUrl,
    SignUpProps,
    UserButtonProps
} from '@tern-secure/types';

export type {
  SignInProps,
  SignUpProps,
  UserButtonProps
}

export type SignInCtx = SignInProps & {
  componentName: 'SignIn';
} & SignInFallbackRedirectUrl & SignInForceRedirectUrl

export type SignUpCtx = SignUpProps & {
  componentName: 'SignUp';
} & SignUpFallbackRedirectUrl &
  SignUpForceRedirectUrl;

  export type UserButtonCtx = UserButtonProps & {
    componentName: 'UserButton';
  };


export type AvailableComponentProps =
    | SignInProps
    | SignUpProps
    | UserButtonProps

export type AvailableComponentCtx =
    | SignInCtx
    | SignUpCtx
    | UserButtonCtx

export type AvailableComponentName = AvailableComponentCtx['componentName'];

