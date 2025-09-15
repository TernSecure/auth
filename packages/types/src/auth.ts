import type { SignedInSession } from "session";
import type { SignUpResource } from "signUp";

import type { InstanceType,TernSecureConfig, TernSecureUser } from "./all";
import type { DecodedIdToken } from "./jwt";
import type {
  AfterSignOutUrl,
  SignInRedirectUrl,
  SignUpRedirectUrl,
} from "./redirect";
import type { AuthErrorResponse,SignInResource } from "./signIn";

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
  status: "loading" | "authenticated" | "unauthenticated" | "unverified";
  user?: TernSecureUser | null;
}

export type AuthProviderStatus = "idle" | "pending" | "error" | "success";

export const DEFAULT_TERN_SECURE_STATE: TernSecureState = {
  userId: null,
  isLoaded: false,
  error: null,
  isValid: false,
  isVerified: false,
  isAuthenticated: false,
  token: null,
  email: null,
  status: "loading",
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

export type Persistence = "local" | "session" | "browserCookie" | "none";

type Mode = "browser" | "server";

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

export type TernSecureAuthOptions = {
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
} & SignInRedirectUrl &
  SignUpRedirectUrl &
  AfterSignOutUrl;

export type TernAuthListenerEventPayload = {
  authStateChanged: TernSecureState;
  userChanged: TernSecureUser;
  sessionChanged: SignedInSession | null;
  tokenRefreshed: string | null;
};

export type TernAuthListenerEvent = keyof TernAuthListenerEventPayload;

export type ListenerCallback = (emission: TernSecureResources) => void;
export type UnsubscribeCallback = () => void;
type TernSecureEvent = keyof TernAuthEventPayload;
type EventHandler<Events extends TernSecureEvent> = (
  payload: TernAuthEventPayload[Events]
) => void;
export type TernAuthEventPayload = {
  status: TernSecureAuthStatus;
};

export type TernSecureAuthStatus = "error" | "loading" | "ready";

type onEventListener = <E extends TernSecureEvent>(
  event: E,
  handler: EventHandler<E>, opt?: { notify?: boolean }
) => void;
type OffEventListener = <E extends TernSecureEvent>(
  event: E,
  handler: EventHandler<E>
) => void;

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
  initialize(options?: TernSecureAuthOptions): Promise<void>;

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

  addListener: (callback: ListenerCallback) => UnsubscribeCallback;
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
