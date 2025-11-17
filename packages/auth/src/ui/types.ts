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

type ComponentMode = 'modal' | 'mounted';

export type SignInCtx = SignInProps & {
  componentName: 'SignIn';
  mode?: ComponentMode;
} & SignInFallbackRedirectUrl & SignInForceRedirectUrl

export type SignUpCtx = SignUpProps & {
  componentName: 'SignUp';
  mode?: ComponentMode;
} & SignUpFallbackRedirectUrl &
  SignUpForceRedirectUrl;

  export type UserButtonCtx = UserButtonProps & {
    componentName: 'UserButton';
    mode?: ComponentMode;
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

