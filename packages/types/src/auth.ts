import { SignedInSession } from 'session';
import type { 
  TernSecureUser,
  TernSecureConfig
} from './all';
import type { 
    SignInResource
} from './signIn';
import { SignUpResource } from 'signUp';
import type {
  AfterSignOutUrl,
  SignInRedirectUrl,
  SignUpRedirectUrl
} from './redirect';

export interface InitialState {
  userId: string | null
  token: any | null
  email: string | null
  user?: TernSecureUser | null
}


export interface TernSecureState {
  userId: string | null
  isLoaded: boolean
  error: Error | null
  isValid: boolean
  isVerified: boolean
  isAuthenticated: boolean
  token: any | null
  email: string | null
  status: "loading" | "authenticated" | "unauthenticated" | "unverified"
  user?: TernSecureUser | null
}


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
  status: "loading",
  user: null
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

export type Persistence = 'local' | 'session' | 'none';



type Mode = 'browser' | 'server';

export type TernAuthSDK = {
  /** SDK package name (e.g., @tern-secure/ui) */
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
}

export interface TernSecureResources {
  user?: TernSecureUser | null;
  session?: SignedInSession | null;
}


export type TernSecureAuthOptions = {
  sdkMetadata?: TernAuthSDK;
  signInUrl?: string;
  signUpUrl?: string;
  mode?: Mode;
  requiresVerification?: boolean;
  isTernSecureDev?: boolean;
  ternSecureConfig?: TernSecureConfig;
  persistence?: Persistence;
  enableServiceWorker?: boolean;
} & SignInRedirectUrl & SignUpRedirectUrl & AfterSignOutUrl;

export type TernAuthListenerEventPayload = {
  authStateChanged: TernSecureState;
  userChanged: TernSecureUser;
  sessionChanged: SignedInSession | null;
  tokenRefreshed: string | null;
};

export type TernAuthListenerEvent = keyof TernAuthListenerEventPayload;

export type ListenerCallback = (emission: TernSecureResources)=> void;
type TernSecureEvent = keyof TernAuthEventPayload;
type EventHandler<Events extends TernSecureEvent> = (payload: TernAuthEventPayload[Events]) => void;
export type TernAuthEventPayload = {
  status: TernSecureAuthStatus;
};

export type UnsubscribeCallback = () => void;

export type TernSecureAuthStatus = 'error' | 'loading' | 'ready';

type onEventListener = <E extends TernSecureEvent>(event: E, handler: EventHandler<E>) => void;
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
  (options?: SignOutOptions): Promise<void>
}

export interface TernSecureAuth {
  /** Indicates if the TernSecureAuth instance is ready for use */
  isReady: boolean;

  /** Indicates if the TernSecureAuth instance is currently loading */
  isLoading: boolean;

  /** The current status of the TernSecureAuth instance */
  status: TernSecureAuthStatus; 
  
  /** Requires Verificatipn */
  requiresVerification: boolean;
  
  /** Initialize TernSecureAuth */
  initialize(options?: TernSecureAuthOptions): Promise<void>

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
  onAuthStateChanged(callback: (user: TernSecureUser | null | undefined) => void): () => void;

  /** Sign out the current user */
  signOut: SignOut;
  
  /** Subscribe to a single event */
  on: onEventListener;
  
  /** Remove event listener */
  off: OffEventListener;

  addListener: (callback: ListenerCallback ) => UnsubscribeCallback;
}

export interface TernSecureAuthFactory {
  create(options?: TernSecureAuthOptions): TernSecureAuth;
}