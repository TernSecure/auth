import { SignedInSession } from 'session';
import type { 
  TernSecureUser,
  TernSecureConfig
} from './all';
import type { 
    SignInResource
} from './signIn';
import { SignUpResource } from 'signUp';

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
};

type EventHandler<Events extends Record<string, unknown>, Event extends keyof Events> = (payload: Events[Event]) => void;
export type TernAuthEventPayload = {
  status: TernSecureAuthStatus;
};

export type TernSecureAuthStatus = 'error' | 'loading' | 'ready';

export interface TernSecureAuth {
  /** Indicates if the TernSecureAuth instance is ready for use */
  isReady: boolean;

  /** Indicates if the TernSecureAuth instance is currently loading */
  isLoading: boolean;

  /** The current status of the TernSecureAuth instance */
  status: TernSecureAuthStatus; 
  
  /** Requires Verificatipn */
  requiresVerification: boolean;
  
  /** Current auth state */
  internalAuthState: TernSecureState;

  /** Initialize TernSecureAuth */
  initialize(options?: TernSecureAuthOptions): Promise<void>

  /** Current user*/
  ternSecureUser(): TernSecureUser | null;

  /** AuthCookie Manager */
  authCookieManager(): void;

  /** Current session */
  currentSession: SignedInSession | null;

  /** Sign in resource for authentication operations */
  signIn: SignInResource | undefined | null;

  /** SignUp resource for authentication operations */
  signUp: SignUpResource | undefined | null;

  /** The Firebase configuration used by this TernAuth instance. */
  ternSecureConfig?: TernSecureConfig;

  /** Subscribe to auth state changes */
  onAuthStateChanged(callback: (user: TernSecureUser | null) => void): () => void;

  /** Sign out the current user */
  signOut(): Promise<void>;
  
  events: {
    /** Subscribe to TernSecureAuth status */
    onStatusChanged: (callback: (status: TernSecureAuthStatus) => void) => () => void;
    /** Subscribe to auth state changes */
    //onAuthStateChanged: (callback: (authState: TernSecureState) => void) => () => void;
  };
}

export interface TernSecureAuthFactory {
  create(options?: TernSecureAuthOptions): TernSecureAuth;
}