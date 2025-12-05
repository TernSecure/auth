import type { SignedInSession } from 'session';
import type { SignUpResource } from 'signUp';

import type { AppCheckConfig, InstanceType, TernSecureConfig, TernSecureUser } from './all';
import type { DecodedIdToken } from './jwt';
import type {
  AfterSignOutUrl,
  RedirectOptions,
  SignInFallbackRedirectUrl,
  SignInForceRedirectUrl,
  SignUpFallbackRedirectUrl,
  SignUpForceRedirectUrl,
} from './redirect';
import type { AuthErrorResponse, SignInResource, SocialProvider } from './signIn';
import type { SignInTheme, SignUpTheme } from './theme';

/**
 * @deprecated will be removed in future releases.
*/
export interface InitialState {
  userId: string | null;
  token: any | null;
  email: string | null;
  user?: TernSecureUser | null;
}

/**
 * @deprecated will be removed in future releases.
*/
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

export type TernSecureInitialState = {
  user?: TernSecureUser | null;
  sessionClaims?: DecodedIdToken | null;
  userId?: string | null;
  token?: string | null;
};

export type TernSecureStateExtended = {
  sessionClaims: DecodedIdToken | null;
  userId: string | null;
  token: string | null;
  user?: TernSecureUser | null;
};

export type AuthProviderStatus = 'idle' | 'pending' | 'error' | 'success';


/**
 * @deprecated will be removed in future releases.
*/
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

/**
 * @deprecated will be removed in future releases.
*/
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
    signUpMode?: 'public' | 'restricted' | 'waitlist';
    passwordAuthentication?: boolean;
    mode?: Mode;
    requiresVerification?: boolean;
    /**
     * @deprecated will be removed in future releases. please use  ternUIUrl
     */
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
    /**
     * ReCaptcha V3 Site Key for Firebase App Check
     */
    appCheck?: AppCheckConfig;

    /**
     * Social providers configuration
     */
    socialProviders?: SocialProvider[];
  };

/**
 * @deprecated will be removed in future releases.
*/
export type TernAuthListenerEventPayload = {
  authStateChanged: TernSecureState;
  userChanged: TernSecureUser;
  sessionChanged: SignedInSession | null;
  tokenRefreshed: string | null;
};

/**
 * @deprecated will be removed in future releases.
*/
export type TernAuthListenerEvent = keyof TernAuthListenerEventPayload;

export interface NavigateOptions {
  replace?: boolean;
  metadata?: RouterMetadata;
}

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

  /** The Firebase App instance */
  firebaseApp?: any;

  /** The Firebase App Check instance */
  appCheck?: any;

  /** TernSecure API URL */
  apiUrl: string;

  /** TernSecure domain for API string */
  authDomain: string;

  /** TernSecure Frontend domain for TernSecure UI */
  frontEndDomain?: string;

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

  /** Mounts a sign-in component
   * @param targetNode HTMLDivElement where the component will be mounted
   * @param signInProps Configuration options for the sign-in component
   */
  showSignIn: (targetNode: HTMLDivElement, config?: SignInProps) => void;

  /** Unmount sign-in component
   * @param targetNode HTMLDivElement where the component is mounted
  */
  hideSignIn: (targetNode: HTMLDivElement) => void;

  /** Mounts a sign-up component
   * @param targetNode HTMLDivElement where the component will be mounted
   * @param signUpProps Configuration options for the sign-up component
  */
  showSignUp: (targetNode: HTMLDivElement, config?: SignUpProps) => void;

  /** Unmount sign-up component
   * @param targetNode HTMLDivElement where the component is mounted
  */
  hideSignUp: (targetNode: HTMLDivElement) => void;

  /** Mounts a user button component
   * @param targetNode HTMLDivElement where the component will be mounted
  */
  showUserButton: (targetNode: HTMLDivElement) => void;

  /** Unmount user button component
   * @param targetNode HTMLDivElement where the component is mounted
  */
  hideUserButton: (targetNode: HTMLDivElement) => void;

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

  constructAfterSignOutUrl(): string;

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

export type RoutingOptions =
  | { path: string | undefined; routing?: Extract<RoutingStrategy, 'path'> }
  | { path?: never; routing?: Extract<RoutingStrategy, 'hash' | 'virtual'> };

export type WithoutRouting<T> = Omit<T, 'path' | 'routing'>;

/**
 * Props for SignIn component focusing on UI concerns
 */
export type SignInProps = RoutingOptions & {
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
  /**
   * Full URL or path to for the sign in process.
   * Used to fill the "Sign in" link in the SignUp component.
   */
  signInUrl?: string;
  /**
   * Full URL or path to for the sign up process.
   * Used to fill the "Sign up" link in the SignUp component.
   */
  signUpUrl?: string;

  /**
   * Preferred strategy for sign-in when using email identifier.
   * Options: 'password' | 'email_code'
   * @default 'password'
   */
  preferredEmailStrategy?: 'password' | 'email_code';

  /**
   * Customize UI
   */
  appearance?: SignInTheme;

  /** Initial form values */
  initialValues?: SignInInitialValues & SignUpInitialValues;

  /**
   * Whether to show the combined email and password form.
   * If true, the email and password fields will be shown together.
   * If false, the email field will be shown first, followed by the password field.
   * @default true
   */
  showCombinedForm?: boolean;

  /**
   * Social providers configuration
   */
  socialProviders?: SocialProvider[];
} & SignUpForceRedirectUrl &
  SignUpFallbackRedirectUrl &
  AfterSignOutUrl;

/**
 * Props for SignUp component focusing on UI concerns
 */
export type SignUpProps = RoutingOptions & {
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
  /**
   * Full URL or path to for the sign in process.
   * Used to fill the "Sign in" link in the SignUp component.
   */
  signInUrl?: string;
  /**
   * Customize UI
   */
  appearance?: SignUpTheme;
  /**
   * Whether to show the sign up form.
   * @default true
   */
  shouldShowForm?: boolean;
  /** Initial form values */
  initialValues?: SignUpInitialValues ;

  /**
   * Social providers configuration
   */
  socialProviders?: SocialProvider[];
} & SignInFallbackRedirectUrl &
  SignInForceRedirectUrl &
  AfterSignOutUrl;



export type UserButtonProps = {
  /**
   * Controls if the username is displayed next to the trigger button
   */
  showName?: boolean;
  /**
   * Controls the default state of the UserButton
   */
  defaultOpen?: boolean;

  /**
   * Full URL or path to navigate to on "Add another account" action.
   * Multi-session mode only.
   */
  signInUrl?: string;
};

export type SignInModalProps = WithoutRouting<SignInProps>;
export type SignUpModalProps = WithoutRouting<SignUpProps>;

export type SignInRedirectOptions = RedirectOptions;
export type SignUpRedirectOptions = RedirectOptions;

export type RoutingStrategy = 'path' | 'hash' | 'virtual';


export type __internal_ComponentNavigationContext = {
  /**
   * The `navigate` reference within the component router context
   */
  navigate: (
    to: string,
    options?: {
      searchParams?: URLSearchParams;
    },
  ) => Promise<unknown>;
  /**
   * This path represents the root route for a specific component type and is used
   * for internal routing and navigation.
   *
   * @example
   * indexPath: '/sign-in'  // When <SignIn path='/sign-in' />
   * indexPath: '/sign-up'  // When <SignUp path='/sign-up' />
   */
  indexPath: string;
};

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



export type SignInInitialValues = {
  emailAddress?: string;
  phoneNumber?: string;
  username?: string;
};

export type SignUpInitialValues = {
  emailAddress?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  username?: string;
};