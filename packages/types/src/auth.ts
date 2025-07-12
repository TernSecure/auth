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
  signIn: SignInResource;

  /** SignUp resource for authentication operations */
  signUp: SignUpResource;

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



export interface TernSecureAuth {
  /** Requires Verificatipn */
  requiresVerification: boolean;
  
  /** Current auth state */
  internalAuthState: TernSecureState;

  /** Current user*/
  ternSecureUser(): TernSecureUser | null;

  /** AuthCookie Manager */
  authCookieManager(): void;

  /** Current session */
  currentSession: SignedInSession | null;

  /** Sign in resource for authentication operations */
  signIn: SignInResource;

  /** SignUp resource for authentication operations */
  signUp: SignUpResource;

  /** The Firebase configuration used by this TernAuth instance. */
  ternSecureConfig?: TernSecureConfig;

  /** Sign out the current user */
  signOut(): Promise<void>;
}