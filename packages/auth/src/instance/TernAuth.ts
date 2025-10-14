import { handleFirebaseAuthError } from '@tern-secure/shared/errors';
import { createTernAuthEventBus, ternEvents } from '@tern-secure/shared/ternStatusEvent';
import { stripScheme } from '@tern-secure/shared/url';
import { handleValueOrFn } from '@tern-secure/shared/utils';
import type {
  CreateActiveSession,
  DomainOrProxyUrl,
  InstanceType,
  ListenerCallback,
  RedirectOptions,
  SessionResource,
  SignedInSession,
  SignInRedirectOptions,
  SignInResource,
  SignInResponse,
  SignOut,
  SignOutOptions,
  SignUpRedirectOptions,
  SignUpResource,
  TernAuthSDK,
  TernSecureAuth as TernSecureAuthInterface,
  TernSecureAuthOptions,
  TernSecureAuthStatus,
  TernSecureConfig,
  TernSecureResources,
  TernSecureUser,
  TernSecureUserData,
  UnsubscribeCallback,
} from '@tern-secure/types';
import type { FirebaseApp } from 'firebase/app';
import { getApps, initializeApp } from 'firebase/app';
import type { Auth, Auth as TernAuth } from 'firebase/auth';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  connectAuthEmulator,
  getIdToken,
  getRedirectResult,
  initializeAuth,
  inMemoryPersistence,
  onAuthStateChanged,
  onIdTokenChanged,
} from 'firebase/auth';
import { getInstallations } from 'firebase/installations';

import { type ClientAuthRequest, createClientAuthRequest } from '../auth/request';
import { AuthCookieManager, Session, SignIn, SignUp, TernSecureBase } from '../resources/internal';
import { buildURL, hasRedirectLoop } from '../utils/construct';
import { type ApiClient, createCoreApiClient } from './c_coreApiClient';
import { eventBus, events } from './events';
import { createClientFromJwt } from './jwtClient';

export function inBrowser(): boolean {
  return typeof window !== 'undefined';
}

export { TernAuth };

/**
 * Firebase implementation of the TernSecureAuth interface
 */
export class TernSecureAuth implements TernSecureAuthInterface {
  public static version: string = PACKAGE_VERSION;
  public static sdkMetadata: TernAuthSDK = {
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
  #domain: DomainOrProxyUrl['domain'];
  #apiClient: ApiClient;
  #apiUrl: string;
  #instanceType?: InstanceType;
  #status: TernSecureAuthInterface['status'] = 'loading';
  #listeners: Array<(emission: TernSecureResources) => void> = [];
  #options: TernSecureAuthOptions = {};
  #authCookieManager?: AuthCookieManager;
  #clientAuthRequest?: ClientAuthRequest;
  #publicEventBus = createTernAuthEventBus();

  signIn!: SignInResource;
  signUp!: SignUpResource;
  session!: SessionResource;

  get isReady(): boolean {
    return this.status === 'ready';
  }

  get status(): TernSecureAuthInterface['status'] {
    return this.#status;
  }

  get version(): string {
    return TernSecureAuth.version;
  }

  set sdkMetadata(metadata: TernAuthSDK) {
    TernSecureAuth.sdkMetadata = metadata;
  }

  get sdkMetadata(): TernAuthSDK {
    return TernSecureAuth.sdkMetadata;
  }

  get requiresVerification(): boolean {
    return this.#options.requiresVerification ?? true;
  }

  get apiUrl(): string {
    return this.#apiUrl;
  }

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

  public constructor(options?: TernSecureAuthOptions) {
    this.#domain = options?.ternSecureConfig?.authDomain;
    this.#apiUrl = options?.apiUrl || '';
    this.#instanceType = (process.env.NODE_ENV as InstanceType) || 'production';

    this.#apiClient = createCoreApiClient({
      domain: this.#domain,
      apiUrl: options?.apiUrl,
      instanceType: this.instanceType as InstanceType,
    });

    this.#publicEventBus.emit(ternEvents.Status, 'loading');
    TernSecureBase.ternsecure = this;
  }

  public getApiClient = (): ApiClient => this.#apiClient;

  /**
   * Get user data for the provided ID token via backend API
   */
  public async getUserData(): Promise<TernSecureUserData | null> {
    if (!this.#clientAuthRequest) {
      throw new Error('Client auth request not initialized');
    }

    return this.#clientAuthRequest.getUserData();
  }

  public setLoading(isLoading: boolean): void {
    this.isLoading = isLoading;
  }

  public authCookieManager(): AuthCookieManager | undefined {
    return this.#authCookieManager;
  }

  public _internal_getOption<K extends keyof TernSecureAuthOptions>(
    key: K,
  ): TernSecureAuthOptions[K] {
    return this.#options[key];
  }

  public _internal_getAllOptions(): Readonly<TernSecureAuthOptions> {
    return Object.freeze({ ...this.#options });
  }

  static getorCreateInstance(options?: TernSecureAuthOptions): TernSecureAuth {
    if (!this.instance) {
      this.instance = new TernSecureAuth(options);
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
    const instance = this.getorCreateInstance(options);
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

      this.initializeFirebaseApp(this.#options.ternSecureConfig);
      //this.authStateUnsubscribe = this.initAuthStateListener();

      this.#authCookieManager = new AuthCookieManager();
      this.csrfToken = this.#authCookieManager.getCSRFToken();

      this.#clientAuthRequest = createClientAuthRequest(this.#apiClient);
      this.initClient();

      this.signIn = new SignIn(this.auth, this.csrfToken);
      this.signUp = new SignUp(this.auth);

      eventBus.on(events.SessionChanged, () => {
        this.#setCreatedActiveSession(this.user || null);
        this.#emit();
      });

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

    const persistence = this.#setPersistence();
    const auth = initializeAuth(this.firebaseClientApp, {
      persistence,
    });

    this.auth = auth;

    if (config.tenantId) {
      this.auth.tenantId = config.tenantId;
    }

    this.#configureEmulator();

    getInstallations(this.firebaseClientApp);
  }

  initClient = () => {
    const idTokenInCookie = this.#authCookieManager?.getIdTokenCookie();
    const jwtClient = createClientFromJwt(idTokenInCookie || null);
    this.user = jwtClient as TernSecureUser | null;
    this.#emit();
  };

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
    eventBus.emit(events.TokenUpdate, { token: null });
    this.#emit();
  };

  get currentSession(): SignedInSession | null {
    return this.signedInSession;
  }

  private initAuthListener(): () => void {
    (async () => {
      await this.auth.authStateReady();
      const user = this.auth.currentUser as TernSecureUser | null;
      this._currentUser = user;
      this.user = user;
      await this.updateCurrentSession();
      this.#emit();
    })();

    // Return a no-op unsubscribe function since we're not setting up a listener
    return () => {
      // No-op: nothing to unsubscribe from
    };
  }

  private initAuthStateListener(): () => void {
    return onAuthStateChanged(this.auth, async (user: TernSecureUser | null) => {
      await this.auth.authStateReady();
      this._currentUser = user;
      this.user = user;
      await this.updateCurrentSession();

      this.#emit();
    });
  }

  private _onIdTokenChanged(): () => void {
    return onIdTokenChanged(this.auth, async (user: TernSecureUser | null) => {
      await this.auth.authStateReady();
      this._currentUser = user;
      this.user = user;
      await this.updateCurrentSession();

      this.#emit();
    });
  }

  private async getIdToken(): Promise<string | null> {
    await this.auth.authStateReady();
    if (!this.auth.currentUser) {
      return null;
    }
    return getIdToken(this.auth.currentUser);
  }

  public onAuthStateChanged(callback: (cb: any) => void): () => void {
    return onAuthStateChanged(this.auth, callback);
  }

  public onIdTokenChanged(callback: (cb: any) => void): () => void {
    return onIdTokenChanged(this.auth, callback);
  }

  private async updateCurrentSession(): Promise<void> {
    if (!this._currentUser) {
      this.signedInSession = null;
      return;
    }

    try {
      const res = await this._currentUser.getIdTokenResult();
      this.signedInSession = {
        status: 'active',
        token: res.token,
        claims: res.claims,
        issuedAtTime: res.issuedAtTime,
        expirationTime: res.expirationTime,
        authTime: res.authTime,
        signInProvider: res.signInProvider || 'unknown',
        signInSecondFactor: res.signInSecondFactor,
      };
    } catch (error) {
      console.error('[TernSecureAuth] Error updating session:', error);
      this.signedInSession = null;
    }
  }

  public async checkRedirectResult(): Promise<SignInResponse | null> {
    try {
      const result = await getRedirectResult(this.auth);
      if (result) {
        return {
          status: 'success',
          user: result.user as TernSecureUser,
        };
      }
      return null;
    } catch (error) {
      const authError = handleFirebaseAuthError(error);
      return {
        status: 'error',
        message: authError.message,
        error: authError.code,
      };
    }
  }

  public getRedirectResult = async (): Promise<any> => {
    throw new Error('getRedirectResult not implemented');
  };

  public addListener = (listener: ListenerCallback): UnsubscribeCallback => {
    this.#listeners.push(listener);
    if (this._currentUser) {
      listener({
        user: this._currentUser,
        session: this.signedInSession,
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

  public createActiveSession: CreateActiveSession = async ({
    session,
    redirectUrl,
  }): Promise<void> => {
    try {
      if (!session) {
        throw new Error('No session provided to createActiveSession');
      }
      const sessionResult = await session.getIdTokenResult();
      const sessionData = new Session(sessionResult);
      await sessionData.create(this.csrfToken || '');
      await this.redirectAfterSignIn();
      this.#setCreatedActiveSession(session);
      this.#emit();
    } catch (error) {
      console.error('[TernSecureAuth] Error creating active session:', error);
    }
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

    let effectiveRedirectUrl: string | null | undefined;

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
        paramsForBuildUrl.searchParams?.set('redirect_url', absoluteRedirectUrl);
      } else {
        // If not in browser, use the effectiveRedirectUrl as is.
        // This assumes it's either absolute or a path the server can interpret.
        paramsForBuildUrl.searchParams?.set('redirect_url', effectiveRedirectUrl);
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

  #constructAfterSignInUrl = (): string => {
    if (!inBrowser()) {
      return '/';
    }

    let redirectPath: string | null | undefined = undefined;
    const defaultRedirectPath = '/';

    // Priority 1: Check for signInForceRedirectUrl from instance options
    if (this.#options.signInForceRedirectUrl) {
      redirectPath = this.#options.signInForceRedirectUrl;
    }

    // Priority 2: If no force redirect, check 'redirect' param in current URL
    if (!redirectPath) {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectPathFromParams = urlParams.get('redirect_url');
      if (redirectPathFromParams) {
        redirectPath = redirectPathFromParams;
      }
    }

    // Priority 3: Fallback to default path
    if (!redirectPath) {
      redirectPath = defaultRedirectPath;
    }

    const currentPath = window.location.pathname;

    if (hasRedirectLoop(currentPath, redirectPath)) {
      //console.warn('[TernSecure] Redirect loop detected. Redirecting to default path.');
      return defaultRedirectPath;
    }

    return this.constructUrlWithAuthRedirect(redirectPath);
  };

  #constructAfterSignOutUrl = (): string => {
    if (!this.#options.afterSignOutUrl) {
      return '/';
    }
    return this.constructUrlWithAuthRedirect(this.#options.afterSignOutUrl);
  };

  public redirectToSignIn = async (options?: SignInRedirectOptions): Promise<unknown> => {
    if (inBrowser()) {
      const url = this.constructSignInUrl(options);
      window.location.href = url;
    }
    return;
  };

  public redirectToSignUp = async (options?: SignUpRedirectOptions): Promise<unknown> => {
    if (inBrowser()) {
      const redirectUrl = this.constructSignUpUrl();
      window.location.href = redirectUrl;
    }
    return;
  };

  redirectAfterSignIn = async (): Promise<void> => {
    if (inBrowser()) {
      const destinationUrl = this.#constructAfterSignInUrl();
      window.location.href = destinationUrl;
    }
  };

  redirectAfterSignUp = (): void => {
    throw new Error('redirectAfterSignUp is not implemented yet');
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
    for (const listener of this.#listeners) {
      listener({
        user: this.user,
        session: this.signedInSession,
      });
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

  #setCreatedActiveSession = (session: TernSecureUser | null) => {
    this.user = session;
  };

  #setPersistence = () => {
    const persistenceType = this.#options.persistence || 'none';

    switch (persistenceType) {
      case 'browserCookie':
        return inMemoryPersistence;
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
    return process.env.FIREBASE_AUTH_EMULATOR_HOST;
  };

  #configureEmulator = (): void => {
    const host = this.#emulatorHost();
    const isDev = this.#instanceType === 'development';
    const shouldUseEmulator = isDev && !!host;
    if (!shouldUseEmulator || !host) {
      return;
    }

    const emulatorUrl = host.startsWith('http') ? host : `http://${host}`;

    try {
      //(this.auth as unknown as any)._canInitEmulator = true;
      connectAuthEmulator(this.auth, emulatorUrl, { disableWarnings: true });
      console.warn(`[TernSecure] Firebase Auth Emulator connected at ${emulatorUrl}`);
    } catch (error) {
      console.error('[TernSecure] Error connecting to Firebase Auth Emulator:', error);
    }
  };
}
