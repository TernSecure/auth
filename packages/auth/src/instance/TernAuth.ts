import { createTernAuthEventBus, ternEvents } from '@tern-secure/shared/eventBus';
import {
  type TernSecureAuth as TernSecureAuthInterface,
  type TernSecureAuthOptions,
  type TernSecureUser,
  type TernSecureState,
  type SignInResponseTree,
  type SignedInSession,
  type TernSecureConfig,
  type TernSecureAuthStatus,
  type SignInResource,
  type SignUpResource,
  DEFAULT_TERN_SECURE_STATE,
} from '@tern-secure/types';
import { handleFirebaseAuthError } from '@tern-secure/shared/errors';
import {
  Auth,
  getAuth,
  getIdToken,
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
import { getInstallations } from "firebase/installations";
import { 
  FirebaseApp,
  initializeApp,
  getApps,
} from 'firebase/app';
import {
  TernSecureBase,
  SignIn, 
  SignUp 
} from './resources/internal';


/**
 * Firebase implementation of the TernSecureAuth interface
 */
export class TernSecureAuth implements TernSecureAuthInterface {
  private static instance: TernSecureAuth | null = null;
  private _currentUser: TernSecureUser | null = null;
  private signedInSession: SignedInSession | null = null;
  private firebaseClientApp: FirebaseApp | undefined;
  private _authState: TernSecureState = { ...DEFAULT_TERN_SECURE_STATE };
  private auth!: Auth;
  private authStateUnsubscribe: (() => void) | null = null;
  private tokenRefreshUnsubscribe: (() => void) | null = null;
  public isLoading = false;
  public error: Error | null = null;
  #status: TernSecureAuthInterface['status'] = 'loading';
  #options: TernSecureAuthOptions = {};
  #eventBus = createTernAuthEventBus();

  signIn!: SignInResource;
  signUp!: SignUpResource;


  private constructor() {
    this.#eventBus.emit(ternEvents.Status, 'loading');
    TernSecureBase.ternsecure = this;
  }

  get isReady(): boolean {
    return this.status === 'ready';
  }
  
  get status(): TernSecureAuthInterface['status'] {
    return this.#status;
  }

  get requiresVerification(): boolean {
    return this.#options.requiresVerification ?? true;
  }
  
  public setLoading(isLoading: boolean): void {
    this.isLoading = isLoading;
  }

  static getorCreateInstance(): TernSecureAuth {
    if (!this.instance) {
      console.log('[TernSecureAuth] - Creating new TernSecureAuth instance');
      this.instance = new TernSecureAuth();
    }
    return this.instance;
  }

  static clearInstance() {
    if (TernSecureAuth.instance) {
      if (TernSecureAuth.instance.authStateUnsubscribe) {
        TernSecureAuth.instance.authStateUnsubscribe();
        TernSecureAuth.instance.authStateUnsubscribe = null;
      }
      TernSecureAuth.instance = null;
    }
  }
  
  public static initialize(options: TernSecureAuthOptions): TernSecureAuth {
    const instance = this.getorCreateInstance();
    instance.#initialize(options);
    return instance;
  }

  #initialize = (options?: TernSecureAuthOptions): TernSecureAuth => {
    this.#options = this.#initOptions(options);

    try {

      if (!this.#options.ternSecureConfig) {
        throw new Error('TernSecureConfig is required to initialize TernSecureAuth');
      }

      this.initializeFirebaseApp(this.#options.ternSecureConfig);
      this.authStateUnsubscribe = this.initAuthStateListener();

      this.signIn = new SignIn(this.auth);
      this.signUp = new SignUp(this.auth);

      this.#setStatus('ready');
      this.#eventBus.emit(ternEvents.Status, 'ready');

      return this;

    } catch (error) {
      this.error = error as Error;
      this.#setStatus('error');
      this.#eventBus.emit(ternEvents.Status, 'error');
      throw error;
    }
  }


  private async waitForInitialization(): Promise<void> {
    try {
      await this.auth.authStateReady();
    } catch (error) {
      console.error("TernAuth: Error initializing auth state:", error);
      this._authState = {
        ...DEFAULT_TERN_SECURE_STATE,
        isLoaded: true,
        error: error as Error,
        status: "unauthenticated"
      };
    }
  }

  private initializeFirebaseApp(config: TernSecureConfig) {
    const appName = config.appName || '[DEFAULT]';
      this.firebaseClientApp = getApps().length === 0 
      ? initializeApp(config, appName) 
      : getApps()[0];
      
      this.auth = getAuth(this.firebaseClientApp);
      getInstallations(this.firebaseClientApp);

    setPersistence(this.auth, browserLocalPersistence)
      .catch(error => console.error("TernAuth: Error setting auth persistence:", error));
      
  }

  signOut = async(): Promise<void> => {
    await Promise.all([
      this.auth.signOut(),
      this.updateInternalAuthState(null)
    ]);
    this.#eventBus.emit(ternEvents.Status, 'error');
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
          token: user.getIdToken(),
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
        //this.#eventBus.emit('statusChanged', this._authState);
      }
    } catch (error) {
      console.error("TernAuth: Error updating internal auth state:", error);
      this.#status = 'error';
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

  public onAuthStateChanged(callback: (user: TernSecureUser | null) => void): () => void {
    return onAuthStateChanged(this.auth, callback);
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
  
  public get events(): TernSecureAuthInterface['events'] {
    return {
      onStatusChanged: (callback) => {
        this.#eventBus.on(ternEvents.Status, callback);
        return () => {
          this.#eventBus.off(ternEvents.Status, callback);
        };
      }
    };
  }

  public initialize(options: TernSecureAuthOptions): Promise<void> {
    this._initialize(options);
    return Promise.resolve();
  }

  public static create(options: TernSecureAuthOptions): TernSecureAuth {
    const instance = this.getorCreateInstance();
    instance.initialize(options);
    return instance;
  }

  _initialize = (options: TernSecureAuthOptions): void => {
    this.#options = this.#initOptions(options);

    try {

      if (!this.#options.ternSecureConfig) {
        throw new Error('TernSecureConfig is required to initialize TernSecureAuth');
      }

      this.initializeFirebaseApp(this.#options.ternSecureConfig);

      this.signIn = new SignIn(this.auth);
      this.signUp = new SignUp(this.auth);

      this.#setStatus('ready');

    } catch (error) {
      this.error = error as Error;
      this.#setStatus('error');
      throw error;
    }
  }
  
  #initOptions = (options?: TernSecureAuthOptions): TernSecureAuthOptions => {
    return {
      ...options,
    }
  }
  
  #setStatus(newStatus: TernSecureAuthStatus): void {
    if (this.#status !== newStatus) {
      this.#status = newStatus;
      this.#eventBus.emit(ternEvents.Status, this.#status);

      if (newStatus === 'ready') {
        this.#eventBus.emit(ternEvents.Status, 'ready');
      }
    }
  }
}