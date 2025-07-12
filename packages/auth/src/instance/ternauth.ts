import { EventEmitter } from '@tern-secure/shared/eventBus';
import type {
  TernSecureAuth as TernSecureAuthInterface,
  TernSecureAuthOptions,
  TernSecureUser,
  TernSecureState,
  SignInResponseTree,
  SignedInSession,
  TernSecureConfig
} from '@tern-secure/types';
import {
  Auth,
  getAuth,
  initializeAuth,
  onAuthStateChanged,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  GoogleAuthProvider,
  OAuthProvider,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { 
  SignIn, 
  SignUp 
} from './resources/internal';
import { FirebaseError } from 'firebase/app';

const DEFAULT_TERN_SECURE_STATE: TernSecureState = {
  isLoaded: false,
  error: null,
  status: "unauthenticated",
  isValid: false,
  isVerified: false,
  isAuthenticated: false,
  user: null,
  userId: null,
  email: null,
  token: null
};

function handleFirebaseAuthError(error: unknown) {
  if (error instanceof FirebaseError) {
    return {
      code: error.code,
      message: error.message
    };
  }
  return {
    code: 'auth/unknown',
    message: 'An unknown error occurred'
  };
}

/**
 * Firebase implementation of the TernSecureAuth interface
 */
export class TernSecureAuth implements TernSecureAuthInterface {
  private static instance: TernSecureAuth | null = null;
  private _currentUser: TernSecureUser | null = null;
  private signedInSession: SignedInSession | null = null;
  private firebaseClientApp;
  private _authState: TernSecureState = { ...DEFAULT_TERN_SECURE_STATE };
  private auth: Auth;
  public ternSecureConfig?: TernSecureConfig;
  private authStateUnsubscribe: (() => void) | null = null;
  private tokenRefreshUnsubscribe: (() => void) | null = null;
  private isInitialized = false;
  #options: TernSecureAuthOptions = {};
  #eventBus = new EventEmitter();

  signIn: SignIn;
  signUp: SignUp;

  private constructor(options: TernSecureAuthOptions) {
    this.#options = options;
    const config = options.ternSecureConfig;
    
    if (!config) {
      throw new Error('TernSecureConfig is required to initialize TernSecureAuth');
    }

    const appName = config.appName || '[DEFAULT]';
    this.firebaseClientApp = initializeApp(config, appName);

    this.ternSecureConfig = config;
    this.auth = initializeAuth(this.firebaseClientApp);

    setPersistence(this.auth, browserLocalPersistence)
      .catch(error => console.error("TernAuth: Error setting auth persistence:", error));

    this.authStateUnsubscribe = this.initAuthStateListener();
    this.tokenRefreshUnsubscribe = this.setupTokenRefreshListener();

    this.signIn = new SignIn(this.auth, this.ternSecureConfig);
    this.signUp = new SignUp(this.auth, this.ternSecureConfig);
  }

  get requiresVerification(): boolean {
    return this.#options.requiresVerification ?? true;
  }

  static async initialize(options: TernSecureAuthOptions): Promise<TernSecureAuth> {
    if (!options?.ternSecureConfig) {
      throw new Error('TernSecureConfig is required to initialize TernSecureAuth');
    }
    
    if (!this.instance) {
      console.log('[TernSecureAuth] Initialize - Initializing TernSecureAuth instance');
      this.instance = new TernSecureAuth(options);
      await this.instance.waitForInitialization();
    }
    console.log('[TernSecureAuth] Initialize - Returning existing instance');
    return this.instance;
  }

  private async waitForInitialization(): Promise<void> {
    console.log('[TernSecureAuth] waitforInitialization - Waiting for initialization');
    if (this.isInitialized) return;
    console.log('[TernSecureAuth] waitforInitialization - Initializing auth state');
    
    try {
      await this.auth.authStateReady();
      await this.updateInternalAuthState(this.auth.currentUser as TernSecureUser);
      this.isInitialized = true;
    } catch (error) {
      console.error("TernAuth: Error initializing auth state:", error);
      this._authState = {
        ...DEFAULT_TERN_SECURE_STATE,
        isLoaded: true,
        error: error as Error,
        status: "unauthenticated",
        user: null
      };
      this.isInitialized = true;
    }
  }

  static clearInstance() {
    if (TernSecureAuth.instance) {
      if (TernSecureAuth.instance.authStateUnsubscribe) {
        TernSecureAuth.instance.authStateUnsubscribe();
      }
      if (TernSecureAuth.instance.tokenRefreshUnsubscribe) {
        TernSecureAuth.instance.tokenRefreshUnsubscribe();
      }
      TernSecureAuth.instance = null;
    }
  }

  signOut = async(): Promise<void> => {
    await Promise.all([
      this.auth.signOut(),
      this.updateInternalAuthState(null)
    ]);
    this.#eventBus.emit('signOut');
  }

  currentSession = async(): Promise<SignedInSession | null> => {
    if (!this._currentUser) {
      return null;
    }

    const res = await this._currentUser.getIdTokenResult();
    this.signedInSession = {
      status: 'active',
      token: res.token,
      claims: res.claims,
      issuedAtTime: res.issuedAtTime,
      expirationTime: res.expirationTime,
      authTime: res.authTime,
      signInProvider: res.signInProvider || 'unknown'
    };
    return this.signedInSession;
  }

  private initAuthStateListener(): () => void {
    return onAuthStateChanged(this.auth, async (user: TernSecureUser | null) => {
      this._currentUser = user;
      await this.updateInternalAuthState(user);
    });
  }
  
  private setupTokenRefreshListener(): () => void {
    return this.auth.onIdTokenChanged(async (user) => {
      if (user) {
        await this.updateInternalAuthState(user as TernSecureUser);
      }
    });
  }

  private async updateInternalAuthState(user: TernSecureUser | null): Promise<void> {
    const previousState = { ...this._authState };
    try {
      if (user) {
        const isValid = !!user.uid;
        const isVerified = user.emailVerified;
        const requiresVerification = this.requiresVerification;
        const isAuthenticated = isValid && (!requiresVerification || isVerified);

        this._authState = {
          userId: user.uid,
          isLoaded: true,
          error: null,
          isValid,
          isVerified,
          isAuthenticated,
          token: await user.getIdToken(),
          email: user.email || null,
          status: this.determineAuthStatus(user, requiresVerification),
          user
        };
      } else {
        this._authState = {
          ...DEFAULT_TERN_SECURE_STATE,
          isLoaded: true,
          status: "unauthenticated",
          user: null
        };
      }

      if (this.hasAuthStateChanged(previousState, this._authState)) {
        this.#eventBus.emit('authStateChange', this._authState);
      }
    } catch (error) {
      console.error("TernAuth: Error updating internal auth state:", error);
      this._authState = {
        ...DEFAULT_TERN_SECURE_STATE,
        isLoaded: true,
        error: error as Error,
        status: "unauthenticated",
        user: null
      };
      await this.signOut();
    }
  }

  public ternSecureUser(): TernSecureUser | null {
    return this._currentUser;
  }
  
  public get internalAuthState(): TernSecureState {
    return this._authState;
  }

  public async checkRedirectResult(): Promise<SignInResponseTree | null> {
    try {
      const result = await getRedirectResult(this.auth);
      if (result) {
        return {
          success: true,
          user: result.user as TernSecureUser
        };
      }
      return null;
    } catch (error) {
      const authError = handleFirebaseAuthError(error);
      return {
        success: false,
        message: authError.message,
        error: authError.code,
        user: null
      };
    }
  }

  private determineAuthStatus(
    user: TernSecureUser, 
    requiresVerification: boolean
  ): "authenticated" | "unauthenticated" | "unverified" {
    if (!user.uid) return "unauthenticated";
    if (requiresVerification && !user.emailVerified) {
      return "unverified";
    }
    return "authenticated";
  }

  private hasAuthStateChanged(previous: TernSecureState, current: TernSecureState): boolean {
    return (
      previous.userId !== current.userId ||
      previous.isAuthenticated !== current.isAuthenticated ||
      previous.status !== current.status ||
      previous.isLoaded !== current.isLoaded ||
      previous.user?.uid !== current.user?.uid
    );
  }

  public authCookieManager(): void {
    console.warn('AuthCookieManager is not implemented in this version.');
  }
}