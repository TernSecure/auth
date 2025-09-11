import { createTernAuthEventBus, ternEvents } from '@tern-secure/shared/ternStatusEvent';
import type {
  DomainOrProxyUrl,
  InstanceType,
  TernSecureAuth as TernSecureAuthInterface,
  TernSecureAuthOptions,
  TernSecureUser,
  TernSecureSDK,
  SignInResponseTree,
  SignedInSession,
  TernSecureConfig,
  TernSecureAuthStatus,
  SignInResource,
  SignUpResource,
  ListenerCallback,
  UnsubscribeCallback,
  SignOut,
  SignOutOptions,
  SignInRedirectOptions,
  SignUpRedirectOptions,
  TernSecureResources,
  RedirectOptions,
} from '@tern-secure/types';
import { handleFirebaseAuthError } from '@tern-secure/shared/errors';
import { stripScheme } from '@tern-secure/shared/url';
import { handleValueOrFn } from '@tern-secure/shared/utils';
import {
  Auth,
  browserSessionPersistence,
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged,
  onIdTokenChanged,
  getRedirectResult,
  inMemoryPersistence,
  initializeAuth,
  setPersistence,
} from 'firebase/auth';
import { browserCookiePersistence } from 'firebase/auth/web-extension';
import { getInstallations } from 'firebase/installations';
import { FirebaseApp, initializeApp, getApps } from 'firebase/app';
import { TernSecureBase, SignIn, SignUp, AuthCookieManager } from '../resources/internal';
import { eventBus, events } from './events';
import { buildURL } from '../utils/construct';

export function inBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Firebase implementation of the TernSecureAuth interface
 */
export class TernSecureAuth implements TernSecureAuthInterface {
  public static version: string = PACKAGE_VERSION;
  public static sdkMetadata: TernSecureSDK = {
    name: PACKAGE_NAME,
    version: PACKAGE_VERSION,
    environment: process.env.NODE_ENV || 'production',
  };
  private static instance: TernSecureAuth | null = null;
  private _currentUser: TernSecureUser | null = null;
  private signedInSession: SignedInSession | null = null;
  private firebaseClientApp: FirebaseApp | undefined;
  private authStateUnsubscribe: (() => void) | null = null;
  private auth!: Auth;
  private csrfToken: string | undefined;
  public isLoading = false;
  public error: Error | null = null;
  public user: TernSecureUser | null | undefined = null;
  public __internal_country?: string | null;
  #proxyUrl: DomainOrProxyUrl['proxyUrl'];
  #domain: DomainOrProxyUrl['domain'];
  #apiUrl!: string;
  #instanceType?: InstanceType;
  #status: TernSecureAuthInterface['status'] = 'loading';
  #listeners: Array<(emission: TernSecureResources) => void> = [];
  #options: TernSecureAuthOptions = {} as TernSecureAuthOptions;
  #authCookieManager?: AuthCookieManager;
  #publicEventBus = createTernAuthEventBus();

  signIn!: SignInResource;
  signUp!: SignUpResource;

  get isReady(): boolean {
    return this.status === 'ready';
  }

  get status(): TernSecureAuthInterface['status'] {
    return this.#status;
  }

  get version(): string {
    return TernSecureAuth.version;
  }

  set sdkMetadata(metadata: TernSecureSDK) {
    TernSecureAuth.sdkMetadata = metadata;
  }

  get sdkMetadata(): TernSecureSDK {
    return TernSecureAuth.sdkMetadata;
  }

  get requiresVerification(): boolean {
    return this.#options.requiresVerification ?? true;
  }

  get apiUrl(): string {
    return this.#apiUrl;
  }

  public getApiUrl = (): string => this.#apiUrl;

  get domain(): string {
    if (inBrowser()) {
      const strippedDomainString = stripScheme(
        handleValueOrFn(this.#domain, new URL(window.location.href)),
      );
      if (this.#instanceType === 'production') {
        return strippedDomainString;
      }
      return strippedDomainString;
    }
    return '';
  }

  get instanceType() {
    return this.#instanceType;
  }

  public constructor() {
    this.#instanceType = (process.env.NODE_ENV as InstanceType) || 'production';
    this.#publicEventBus.emit(ternEvents.Status, 'loading');
    TernSecureBase.ternsecure = this;
  }

  public setLoading(isLoading: boolean): void {
    this.isLoading = isLoading;
  }

  public authCookieManager(): AuthCookieManager | undefined {
    return this.#authCookieManager;
  }

  static getorCreateInstance(): TernSecureAuth {
    if (!this.instance) {
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

  #initialize = (options: TernSecureAuthOptions): TernSecureAuth => {
    this.#options = this.#initOptions(options);

    try {
      if (!this.#options.ternSecureConfig) {
        throw new Error('TernSecureConfig is required to initialize TernSecureAuth');
      }

      if (!this.#options.apiUrl) {
        throw new Error('apiUrl is required to initialize TernSecureAuth');
      }

      this.#apiUrl = this.#options.apiUrl;

      this.initializeFirebaseApp(this.#options.ternSecureConfig);
      this.authStateUnsubscribe = this.initAuthStateListener();

      this.#authCookieManager = new AuthCookieManager();
      this.csrfToken = this.#authCookieManager.getCSRFToken();

      this.signIn = new SignIn(this.auth, this.csrfToken);
      this.signUp = new SignUp(this.auth);

      this.#setStatus('ready');
      this.#publicEventBus.emit(ternEvents.Status, 'ready');

      return this;
    } catch (error) {
      this.error = error as Error;
      this.#setStatus('error');
      this.#publicEventBus.emit(ternEvents.Status, 'error');
      throw error;
    }
  };

  private initializeFirebaseApp(config: TernSecureConfig) {
    const appName = config.appName || '[DEFAULT]';
    this.firebaseClientApp = getApps().length === 0 ? initializeApp(config, appName) : getApps()[0];
    const auth = initializeAuth(this.firebaseClientApp, {
      persistence: browserCookiePersistence,
    });

    //this.auth = getAuth(this.firebaseClientApp);
    this.auth = auth;

    if (config.tenantId) {
      this.auth.tenantId = config.tenantId;
    }

    this.#configureEmulator();
    getInstallations(this.firebaseClientApp);
    //const persistence = this.#setPersistence();
    //console.log('TernAuth: Setting auth persistence to', persistence);

    //setPersistence(this.auth, browserCookiePersistence).catch(error =>
    //  console.error('TernAuth: Error setting auth persistence:', error),
    //);
  }

  public signOut: SignOut = async (options?: SignOutOptions) => {
    const redirectUrl = options?.redirectUrl || this.#constructAfterSignOutUrl();
    if (options?.onBeforeSignOut) {
      await options.onBeforeSignOut();
    }

    await this.auth.signOut();

    if (options?.onAfterSignOut) {
      await options.onAfterSignOut();
    }
    if (inBrowser()) {
      window.location.href = redirectUrl;
    }
    eventBus.emit(events.UserSignOut, null);
  };

  currentSession = async (): Promise<SignedInSession | null> => {
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
      signInProvider: res.signInProvider || 'unknown',
    };
    return this.signedInSession;
  };

  private initAuthStateListener(): () => void {
    return onAuthStateChanged(this.auth, async (user: TernSecureUser | null) => {
      await this.auth.authStateReady();
      this._currentUser = user;

      eventBus.emit(events.UserChanged, this._currentUser);
      this.#emit();
    });
  }

  public onAuthStateChanged(callback: (cb: any) => void): () => void {
    return onAuthStateChanged(this.auth, callback);
  }

  public onIdTokenChanged(callback: (cb: any) => void): () => void {
    return onIdTokenChanged(this.auth, callback);
  }

  public async checkRedirectResult(): Promise<SignInResponseTree | null> {
    try {
      const result = await getRedirectResult(this.auth);
      if (result) {
        return {
          success: true,
          user: result.user as TernSecureUser,
        };
      }
      return null;
    } catch (error) {
      const authError = handleFirebaseAuthError(error);
      return {
        success: false,
        message: authError.message,
        error: authError.code,
        user: null,
      };
    }
  }

  public addListener = (listener: ListenerCallback): UnsubscribeCallback => {
    this.#listeners.push(listener);
    if (this._currentUser) {
      listener({
        user: this._currentUser,
      });
    }

    const unsubscribe = () => {
      this.#listeners = this.#listeners.filter(l => l !== listener);
    };
    return unsubscribe;
  };

  public on: TernSecureAuthInterface['on'] = (...args) => {
    this.#publicEventBus.on(...args);
  };

  public off: TernSecureAuthInterface['off'] = (...args) => {
    this.#publicEventBus.off(...args);
  };

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

      if (!this.#options.apiUrl) {
        throw new Error('apiUrl is required to initialize TernSecureAuth');
      }

      this.#apiUrl = this.#options.apiUrl;

      this.initializeFirebaseApp(this.#options.ternSecureConfig);

      this.signIn = new SignIn(this.auth, this.csrfToken);
      this.signUp = new SignUp(this.auth);

      this.#setStatus('ready');
    } catch (error) {
      this.error = error as Error;
      this.#setStatus('error');
      throw error;
    }
  };

  public constructUrlWithAuthRedirect = (to: string): string => {
    const baseUrl = window.location.origin;
    const url = new URL(to, baseUrl);

    if (url.origin === window.location.origin) {
      return url.href;
    }

    return url.toString();
  };

  #buildUrl = (key: 'signInUrl' | 'signUpUrl', options: RedirectOptions): string => {
    if (!key || !this.isReady) {
      return '';
    }

    const baseUrlConfig = key === 'signInUrl' ? this.#options.signInUrl : this.#options.signUpUrl;
    const defaultPagePath = key === 'signInUrl' ? '/sign-in' : '/sign-up';
    const base = baseUrlConfig || defaultPagePath;

    let effectiveRedirectUrl: string | null | undefined = undefined;

    // Priority 1: Get redirect URL from options (signInForceRedirectUrl or signUpForceRedirectUrl)
    if (key === 'signInUrl' && 'signInForceRedirectUrl' in options) {
      effectiveRedirectUrl = options.signInForceRedirectUrl;
    } else if (key === 'signUpUrl' && 'signUpForceRedirectUrl' in options) {
      effectiveRedirectUrl = options.signUpForceRedirectUrl;
    }

    // Priority 2: If no force redirect from options, check 'redirect' param in current URL (only in browser)
    if (!effectiveRedirectUrl && inBrowser()) {
      const currentUrlParams = new URLSearchParams(window.location.search);
      const existingRedirectParam = currentUrlParams.get('redirect_url');
      if (existingRedirectParam) {
        effectiveRedirectUrl = existingRedirectParam;
      }
    }

    // Priority 3: If still no redirect URL, fallback to current page's full path (only in browser)
    // This ensures that if the call originates from a page, it attempts to redirect back there by default.
    if (!effectiveRedirectUrl && inBrowser()) {
      effectiveRedirectUrl =
        window.location.pathname + window.location.search + window.location.hash;
    }

    if (effectiveRedirectUrl && inBrowser()) {
      let signInPagePath: string | undefined;
      try {
        signInPagePath = this.#options.signInUrl
          ? new URL(this.#options.signInUrl, window.location.origin).pathname
          : defaultPagePath;
      } catch {
        signInPagePath = defaultPagePath;
      }

      let signUpPagePath: string | undefined;
      try {
        signUpPagePath = this.#options.signUpUrl
          ? new URL(this.#options.signUpUrl, window.location.origin).pathname
          : key === 'signUpUrl'
            ? defaultPagePath
            : '/sign-in';
      } catch {
        signUpPagePath = key === 'signUpUrl' ? defaultPagePath : '/sign-in';
      }

      const redirectTargetObj = new URL(effectiveRedirectUrl, window.location.origin);

      if (
        redirectTargetObj.pathname === signInPagePath ||
        redirectTargetObj.pathname === signUpPagePath
      ) {
        // If the intended redirect path is the sign-in or sign-up page itself,
        // change the redirect target to the application root ('/').
        effectiveRedirectUrl = '/';
      }
    }

    const paramsForBuildUrl: Parameters<typeof buildURL>[0] = {
      base,
      searchParams: new URLSearchParams(),
    };

    if (effectiveRedirectUrl) {
      // Check if a redirect URL was determined
      if (inBrowser()) {
        const absoluteRedirectUrl = new URL(effectiveRedirectUrl, window.location.origin).href;
        paramsForBuildUrl.searchParams!.set('redirect', absoluteRedirectUrl);
      } else {
        // If not in browser, use the effectiveRedirectUrl as is.
        // This assumes it's either absolute or a path the server can interpret.
        paramsForBuildUrl.searchParams!.set('redirect', effectiveRedirectUrl);
      }
    }

    const constructedUrl = buildURL(paramsForBuildUrl, {
      stringify: true,
      skipOrigin: false,
    });

    if (typeof constructedUrl !== 'string') {
      console.error(
        '[TernSecure] Error: buildURL did not return a string as expected. Falling back to base URL.',
      );
      if (inBrowser()) {
        try {
          return new URL(base, window.location.origin).href;
        } catch {
          return base;
        }
      }
      return base;
    }

    return this.constructUrlWithAuthRedirect(constructedUrl);
  };

  #constructAfterSignOutUrl = (): string => {
    if (!this.#options.afterSignOutUrl) {
      return '/';
    }
    return this.constructUrlWithAuthRedirect(this.#options.afterSignOutUrl);
  };

  public constructSignInUrl = (options?: SignInRedirectOptions): string => {
    return this.#buildUrl('signInUrl', { ...options });
  };

  public constructSignUpUrl = (options?: SignUpRedirectOptions): string => {
    return this.#buildUrl('signUpUrl', { ...options });
  };

  __internal_setCountry = (country: string | null) => {
    if (!this.__internal_country) {
      this.__internal_country = country;
    }
  };

  #initOptions = (options: TernSecureAuthOptions): TernSecureAuthOptions => {
    return {
      ...options,
    };
  };

  #emit = (): void => {
    if (this._currentUser) {
      for (const listener of this.#listeners) {
        listener({
          user: this._currentUser,
        });
      }
    }
  };

  #setStatus(newStatus: TernSecureAuthStatus): void {
    if (this.#status !== newStatus) {
      this.#status = newStatus;
      this.#publicEventBus.emit(ternEvents.Status, this.#status);

      if (newStatus === 'ready') {
        this.#publicEventBus.emit(ternEvents.Status, 'ready');
      }
    }
  }

  #setPersistence = async () => {
    const persistenceType = this.#options.persistence || 'none';

    switch (persistenceType) {
      case 'browserCookie':
        return browserCookiePersistence;
      case 'session':
        return browserSessionPersistence;
      case 'local':
        return browserLocalPersistence;
      case 'none':
      default:
        return inMemoryPersistence;
    }
  };

  #emulatorHost = (): string | undefined => {
    if (typeof process === 'undefined') return undefined;
    return process.env.FIREBASE_AUTH_EMULATOR_HOSTT;
  };

  #configureEmulator = (): void => {
    const { useEmulator = false } = this.#options;
    const host = this.#emulatorHost();
    const isDev = this.#instanceType === 'development';
    const shouldUseEmulator = useEmulator || (isDev && !!host);
    if (!shouldUseEmulator || !host) {
      return;
    }

    const emulatorUrl = host.startsWith('http') ? host : `http://${host}`;

    try {
      (this.auth as unknown as any)._canInitEmulator = true;
      connectAuthEmulator(this.auth, emulatorUrl, { disableWarnings: true });
      console.warn(`[TernSecure] Firebase Auth Emulator connected at ${emulatorUrl}`);
    } catch (error) {
      console.error('[TernSecure] Error connecting to Firebase Auth Emulator:', error);
    }
  };
}
