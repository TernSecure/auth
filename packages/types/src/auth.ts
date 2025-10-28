import type { SignedInSession } from 'session';
import type { SignUpResource } from 'signUp';

import type { InstanceType, TernSecureConfig, TernSecureUser } from './all';
import type { DecodedIdToken } from './jwt';
import type {
  AfterSignOutUrl,
  RedirectOptions,
  SignInFallbackRedirectUrl,
  SignInForceRedirectUrl,
  SignUpFallbackRedirectUrl,
  SignUpForceRedirectUrl,
} from './redirect';
import type { AuthErrorResponse, SignInInitialValue, SignInResource } from './signIn';
import type { SignUpFormValues, SignUpInitialValue } from './signUp';

export interface InitialState {
  userId: string | null;
  token: any | null;
  email: string | null;
  user?: TernSecureUser | null;
}

export interface TernSecureState {
  userId: string | null;
  isLoaded: boolean;
  error: Error | null;
  isValid: boolean;
  isVerified: boolean;
  isAuthenticated: boolean;
  token: any | null;
  email: string | null;
  status: 'loading' | 'authenticated' | 'unauthenticated' | 'unverified';
  user?: TernSecureUser | null;
}

export type TernSecureStateExtended = {
  sessionClaims: DecodedIdToken | null;
  userId: string | null;
  token: string | null;
  user?: TernSecureUser | null;
};

export type AuthProviderStatus = 'idle' | 'pending' | 'error' | 'success';

export const DEFAULT_TERN_SECURE_STATE: TernSecureState = {
  userId: null,
  isLoaded: false,
  error: null,
  isValid: false,
  isVerified: false,
  isAuthenticated: false,
  token: null,
  email: null,
  status: 'loading',
  user: null,
};

export interface TernSecureAuthProvider {
  /** Current auth state */
  internalAuthState: TernSecureState;

  /** Current user*/
  ternSecureUser(): TernSecureUser | null;

  /** AuthCookie Manager */
  authCookieManager(): void;

  /** Current session */
  currentSession: SignedInSession | null;

  /** Sign in resource for authentication operations */
  signIn: SignInResource | undefined;

  /** SignUp resource for authentication operations */
  signUp: SignUpResource | undefined;

  /** The Firebase configuration used by this TernAuth instance. */
  ternSecureConfig?: TernSecureConfig;

  /** Sign out the current user */
  signOut(): Promise<void>;
}

export type Persistence = 'local' | 'session' | 'browserCookie' | 'none';

type Mode = 'browser' | 'server';

export type TernAuthSDK = {
  /** SDK package name (e.g., @tern-secure/auth) */
  name: string;
  /** SDK version (e.g., 1.2.3) */
  version: string;
  /** Build environment (development, production, test) */
  environment?: string;
  /** Build date as ISO string */
  buildDate?: string;
  /** Additional build metadata */
  buildInfo?: {
    name: string;
    version: string;
    buildDate: string;
    buildEnv: string;
  };
};

export interface TernSecureResources {
  user?: TernSecureUser | null;
  session?: SignedInSession | null;
}

export type CreateActiveSessionParams = {
  session?: TernSecureUser | null;
  redirectUrl?: string;
};

export type CreateActiveSession = (params: CreateActiveSessionParams) => Promise<void>;

export type CustomNavigation = (to: string, options?: NavigateOptions) => Promise<unknown> | void;

/**
 * Navigation options used to replace or push history changes.
 * Both `routerPush` & `routerReplace` OR none options should be passed.
 */
type TernSecureOptionsNavigation =
  | {
      /**
       * A function which takes the destination path as an argument and performs a "push" navigation.
       */
      routerPush?: never;
      /**
       * A function which takes the destination path as an argument and performs a "replace" navigation.
       */
      routerReplace?: never;
      routerDebug?: boolean;
    }
  | {
      routerPush: RouterFn;
      routerReplace: RouterFn;
      routerDebug?: boolean;
    };

export type TernSecureAuthOptions = TernSecureOptionsNavigation &
  SignInForceRedirectUrl &
  SignInFallbackRedirectUrl &
  SignUpForceRedirectUrl &
  SignUpFallbackRedirectUrl &
  AfterSignOutUrl & {
    tenantId?: string;
    appName?: string;
    apiUrl?: string;
    sdkMetadata?: TernAuthSDK;
    signInUrl?: string;
    signUpUrl?: string;
    mode?: Mode;
    requiresVerification?: boolean;
    isTernSecureDev?: boolean;
    ternSecureConfig?: TernSecureConfig;
    persistence?: Persistence;
    enableServiceWorker?: boolean;
    /**
     * An optional array of domains to validate user-provided redirect URLs against. If no match is made, the redirect is considered unsafe and the default redirect will be used with a warning logged in the console.
     */
    allowedRedirectOrigins?: Array<string | RegExp>;
    /**
     * An optional array of protocols to validate user-provided redirect URLs against. If no match is made, the redirect is considered unsafe and the default redirect will be used with a warning logged in the console.
     */
    allowedRedirectProtocols?: Array<string>;
    experimental?: {
      /** rethrow network errors that occur while the offline */
      rethrowOfflineNetworkErrors?: boolean;
    };
  };

export type TernAuthListenerEventPayload = {
  authStateChanged: TernSecureState;
  userChanged: TernSecureUser;
  sessionChanged: SignedInSession | null;
  tokenRefreshed: string | null;
};

export interface NavigateOptions {
  replace?: boolean;
  metadata?: RouterMetadata;
}

export type TernAuthListenerEvent = keyof TernAuthListenerEventPayload;

export type ListenerCallback = (emission: TernSecureResources) => void;
export type UnsubscribeCallback = () => void;
type TernSecureEvent = keyof TernAuthEventPayload;
type EventHandler<Events extends TernSecureEvent> = (payload: TernAuthEventPayload[Events]) => void;
export type TernAuthEventPayload = {
  status: TernSecureAuthStatus;
};

export type TernSecureAuthStatus = 'error' | 'loading' | 'ready';

type onEventListener = <E extends TernSecureEvent>(
  event: E,
  handler: EventHandler<E>,
  opt?: { notify?: boolean },
) => void;
type OffEventListener = <E extends TernSecureEvent>(event: E, handler: EventHandler<E>) => void;

export type SignOutOptions = {
  /** URL to redirect to after sign out */
  redirectUrl?: string;
  /** Callback to perform consumer-specific cleanup (e.g., delete session cookies) */
  onBeforeSignOut?: () => Promise<void> | void;
  /** Callback executed after successful sign out */
  onAfterSignOut?: () => Promise<void> | void;
};

export interface SignOut {
  (options?: SignOutOptions): Promise<void>;
}

export interface TernSecureAuth {
  /** TernSecureAuth SDK version number */
  version: string | undefined;

  /** Metadata about the SDK instance */
  sdkMetadata: TernAuthSDK | undefined;

  /** Indicates if the TernSecureAuth instance is currently loading */
  isLoading: boolean;

  /** The current status of the TernSecureAuth instance */
  status: TernSecureAuthStatus;

  /** TernSecure API URL */
  apiUrl: string;

  /** TernSecure domain for API string */
  domain: string;

  /** TernSecure Proxy url */
  proxyUrl?: string;

  /** TernSecure Instance type */
  instanceType: InstanceType | undefined;

  /** Indicates if the TernSecureAuth instance is ready for use */
  isReady: boolean;

  /** Requires Verification */
  requiresVerification: boolean;

  /** Initialize TernSecureAuth */
  initialize: (options?: TernSecureAuthOptions) => Promise<void>;

  /**
   * @internal
   */
  _internal_getOption<K extends keyof TernSecureAuthOptions>(key: K): TernSecureAuthOptions[K];

  /**
   * @internal
   */
  _internal_getAllOptions(): Readonly<TernSecureAuthOptions>;

  /** Current user*/
  user: TernSecureUser | null | undefined;

  /** Current session */
  currentSession: SignedInSession | null;

  /** Sign in resource for authentication operations */
  signIn: SignInResource | undefined | null;

  /** SignUp resource for authentication operations */
  signUp: SignUpResource | undefined | null;

  /** The Firebase configuration used by this TernAuth instance. */
  ternSecureConfig?: TernSecureConfig;

  /** Subscribe to auth state changes */
  onAuthStateChanged(callback: (cb: any) => void): () => void;

  /** Sign out the current user */
  signOut: SignOut;

  /** Subscribe to a single event */
  on: onEventListener;

  /** Remove event listener */
  off: OffEventListener;

  /** Subscribe to all auth state changes */
  addListener: (callback: ListenerCallback) => UnsubscribeCallback;

  /** Get redirect result from OAuth flows */
  getRedirectResult: () => Promise<any>;

  /** Create an active session */
  createActiveSession: CreateActiveSession;

  /** Function used to navigate to certain steps and URLs */
  navigate: CustomNavigation;

  /**
   * @param {string} to
   */
  constructUrlWithAuthRedirect(to: string): string;

  /** Navigate to SignIn page */
  redirectToSignIn(options?: SignInRedirectOptions): Promise<unknown>;
  /** Navigate to SignUp page */
  redirectToSignUp(options?: SignUpRedirectOptions): Promise<unknown>;

  redirectAfterSignIn: () => void;

  redirectAfterSignUp: () => void;
}

export interface TernSecureAuthFactory {
  create(options?: TernSecureAuthOptions): TernSecureAuth;
}

export type SharedSignInAuthObjectProperties = {
  session: DecodedIdToken;
  userId: string;
};

export type CheckCustomClaims = {
  role?: string | string[];
  permissions?: string | string[];
  [key: string]: any;
};

export type CheckAuthorizationFromSessionClaims = (
  isAuthorizedParams: CheckCustomClaims,
) => boolean;

export type TernVerificationResult =
  | (DecodedIdToken & {
      valid: true;
      token?: string;
      error?: never;
    })
  | {
      valid: false;
      error: AuthErrorResponse;
    };

/**
 * Props for SignIn component focusing on UI concerns
 */
export type SignInProps = {
  /** Routing Path */
  path?: string;
  /** URL to navigate to after successfully sign-in
   * Use this prop to override the redirect URL when needed.
   * @default undefined
   */
  forceRedirectUrl?: string | null;
  /**
   * Full URL or path to navigate to after successful sign in.
   * This value is used when no other redirect props, environment variables or search params are present.
   * @default undefined
   */
  fallbackRedirectUrl?: string | null;
  /** Initial form values */
  initialValue?: SignInInitialValue;
  /**
   * @deprecated this prop will be removed in future releases. Use UI configuration options instead. use onSignInSuccess
   *
   */
  onSuccess?: (user: TernSecureUser | null) => void;
} & SignUpForceRedirectUrl &
  SignUpFallbackRedirectUrl &
  AfterSignOutUrl;

/**
 * Props for SignUp component focusing on UI concerns
 */
export type SignUpProps = {
  /** URL to navigate to after successfully sign-up
   * Use this prop to override the redirect URL when needed.
   * @default undefined
   */
  forceRedirectUrl?: string | null;
  /**
   * Full URL or path to navigate to after successful sign up.
   * This value is used when no other redirect props, environment variables or search params are present.
   * @default undefined
   */
  fallbackRedirectUrl?: string | null;
  /** Initial form values */
  initialValue?: SignUpInitialValue;
  /** Callbacks */
  onSubmit?: (values: SignUpFormValues) => Promise<void>;
  onSuccess?: (user: TernSecureUser | null) => void;
} & SignInFallbackRedirectUrl &
  SignInForceRedirectUrl &
  AfterSignOutUrl;

export type SignInRedirectOptions = RedirectOptions;
export type SignUpRedirectOptions = RedirectOptions;

export type RoutingStrategy = 'path' | 'hash' | 'virtual';

/**
 * Internal is a navigation type that affects the component
 *
 */
type NavigationType =
  /**
   * Internal navigations affect the components and alter the
   * part of the URL that comes after the `path` passed to the component.
   * eg  <SignIn path='sign-in'>
   * going from /sign-in to /sign-in/factor-one is an internal navigation
   */
  | 'internal'
  /**
   * Internal navigations affect the components and alter the
   * part of the URL that comes before the `path` passed to the component.
   * eg  <SignIn path='sign-in'>
   * going from /sign-in to / is an external navigation
   */
  | 'external'
  /**
   * Window navigations are navigations towards a different origin
   * and are not handled by the TernSecure component or the host app router.
   */
  | 'window';

type RouterMetadata = { routing?: RoutingStrategy; navigationType?: NavigationType };

/**
 * @inline
 */
type RouterFn = (
  /**
   * The destination path
   */
  to: string,
  /**
   * Optional metadata
   */
  metadata?: {
    /**
     * @internal
     */
    __internal_metadata?: RouterMetadata;
    /**
     * Provide a function to be used for navigation.
     */
    windowNavigate: (to: URL | string) => void;
  },
) => Promise<unknown> | unknown;
