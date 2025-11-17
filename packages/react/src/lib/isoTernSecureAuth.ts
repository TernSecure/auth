import { loadTernUIScript } from '@tern-secure/shared/loadTernUIScript';
import { createTernAuthEventBus, ternEvents } from '@tern-secure/shared/ternStatusEvent';
import { handleValueOrFn } from '@tern-secure/shared/utils';
import type {
  AuthErrorTree,
  CreateActiveSessionParams,
  DomainOrProxyUrl,
  ListenerCallback,
  SignedInSession,
  SignInProps,
  SignInRedirectOptions,
  SignInResource,
  SignOutOptions,
  SignUpProps,
  SignUpRedirectOptions,
  SignUpResource,
  TernSecureAuth,
  TernSecureAuthOptions,
  TernSecureAuthStatus,
  UnsubscribeCallback,
} from '@tern-secure/types';

import type {
  Browser,
  BrowserConstructor,
  HeadlessUIBrowser,
  HeadlessUIBrowserConstructor,
  IsoTernSecureAuthOptions,
  TernSecureAuthProps,
  TernSecureProps
} from '../types';
import { isConstructor } from '../utils/isConstructor';

const SDK_METADATA = {
  name: __PACKAGE_NAME__,
  version: __PACKAGE_VERSION__,
  environment: process.env.NODE_ENV,
};

export interface Global {
  TernSecure?: HeadlessUIBrowser | Browser;
}

declare const global: Global;

type GenericFunction<TArgs = never> = (...args: TArgs[]) => unknown;

type MethodName<T> = {
  [P in keyof T]: T[P] extends GenericFunction ? P : never;
}[keyof T];

type MethodCallback = () => Promise<unknown> | unknown;

type WithVoidReturn<F extends (...args: any) => any> = (
  ...args: Parameters<F>
) => ReturnType<F> extends Promise<infer T> ? Promise<T | void> : ReturnType<F> | void;
type WithVoidReturnFunctions<T> = {
  [K in keyof T]: K extends 'constructAfterSignOutUrl' 
    ? T[K] 
    : T[K] extends (...args: any) => any 
    ? WithVoidReturn<T[K]> 
    : T[K];
};

type IsoTernAuth = WithVoidReturnFunctions<TernSecureAuth>;

export function inBrowser(): boolean {
  return typeof window !== 'undefined';
}

interface PreMountState {
  signInNodes: Map<HTMLDivElement, SignInProps | undefined>;
  signUpNodes: Map<HTMLDivElement, SignUpProps | undefined>;
  userButttonNodes: Map<HTMLDivElement, SignInProps | undefined>;
  verifyNodes: Set<HTMLDivElement>;
  methodCalls: Map<MethodName<Browser>, MethodCallback>;
  errorListeners: Set<(error: AuthErrorTree) => void>;
}

/**
 * IsomorphicTernSecure class manages the auth state and UI rendering
 * in both browser and server environments, acting as a proxy for TernSecureAuth
 */
export class IsoTernSecureAuth implements TernSecureAuth {
  private readonly _mode: 'browser' | 'server';
  private readonly options: IsoTernSecureAuthOptions;
  private readonly TernSecureAuth: TernSecureAuthProps;
  private readonly TernSecure: TernSecureProps;
  private ternauth: TernSecureAuthProps | null = null;
  private ternui: Browser | HeadlessUIBrowser | null = null;
  private preAddListener = new Map<ListenerCallback, { unsubscribe: UnsubscribeCallback }>();
  private premountState: PreMountState = {
    signInNodes: new Map(),
    signUpNodes: new Map(),
    userButttonNodes: new Map(),
    verifyNodes: new Set(),
    methodCalls: new Map(),
    errorListeners: new Set(),
  };

  #status: TernSecureAuthStatus = 'loading';
  #apiUrl: string | undefined;
  #authDomain: DomainOrProxyUrl['domain'];
  #proxyUrl: DomainOrProxyUrl['proxyUrl'];
  #eventBus = createTernAuthEventBus();

  static #instance: IsoTernSecureAuth | null | undefined;

  get status(): TernSecureAuthStatus {
    if (!this.ternui) {
      return this.#status;
    }
    return this.ternui.status || (this.ternui.isReady ? 'ready' : 'loading');
  }

  get isReady(): boolean {
    return this.ternui?.isReady || false;
  }

  get isLoading(): boolean {
    return this.ternui?.isLoading || false;
  }

  get requiresVerification(): boolean {
    return this.options.requiresVerification ?? true;
  }

  get signIn(): SignInResource | undefined {
    if (this.ternui) {
      return this.ternui.signIn || undefined;
    }
    return undefined;
  }

  get signUp(): SignUpResource | undefined {
    if (this.ternui) {
      return this.ternui.signUp || undefined;
    }
    return undefined;
  }

  get user() {
    if (this.ternui) {
      return this.ternui.user;
    }
    return null;
  }

  static getOrCreateInstance(options: IsoTernSecureAuthOptions) {
    if (
      !inBrowser() ||
      !this.#instance ||
      (options.TernSecureAuth && this.#instance.TernSecureAuth !== options.TernSecureAuth)
    ) {
      this.#instance = new IsoTernSecureAuth(options);
    }
    return this.#instance;
  }

  static clearInstances() {
    if (this.#instance) {
      this.#instance.ternui = null;
      this.#instance = null;
    }
  }

  static clearInstance() {
    this.#instance = null;
  }

  get authDomain(): string {
    if (typeof window !== 'undefined' && window.location) {
      return handleValueOrFn(this.#authDomain, new URL(window.location.href), '');
    }
    if (typeof this.#authDomain === 'function') {
      throw new Error('Unsupported customDomain type: function');
    }
    return this.#authDomain || '';
  }

  get proxyUrl(): string {
    if (typeof window !== 'undefined' && window.location) {
      return handleValueOrFn(this.#proxyUrl, new URL(window.location.href), '');
    }
    if (typeof this.#proxyUrl === 'function') {
      throw new Error('Unsupported customProxyUrl type: function');
    }
    return this.#proxyUrl || '';
  }

  get mode(): 'browser' | 'server' {
    return this._mode;
  }

  /**
   * @internal
   */
  public _internal_getOption<K extends keyof TernSecureAuthOptions>(
    key: K,
  ): TernSecureAuthOptions[K] | undefined {
    return this.ternui?._internal_getOption
      ? this.ternui?._internal_getOption(key)
      : this.options[key];
  }

  /**
   * @internal
   */
  public _internal_getAllOptions(): Readonly<TernSecureAuthOptions> {
    return Object.freeze({ ...this.options });
  }

  constructor(options: IsoTernSecureAuthOptions) {
    const { TernSecureAuth = null, TernSecure = null } = options || {};
    this.#authDomain = options.ternSecureConfig?.authDomain;
    this.options = { ...options };
    this._mode = inBrowser() ? 'browser' : 'server';
    this.#apiUrl = this.options.apiUrl;
    this.#proxyUrl = this.options.proxyUrl;
    this.TernSecureAuth = TernSecureAuth;
    this.TernSecure = TernSecure;

    if (!this.options.sdkMetadata) {
      this.options.sdkMetadata = SDK_METADATA;
    }

    if (this.#apiUrl) {
      void this.loadTernUI();
    }
  }

  get sdkMetadata() {
    return this.ternui?.sdkMetadata || this.options.sdkMetadata;
  }

  get version() {
    return this.ternui?.version;
  }

  get instanceType() {
    return this.ternui?.instanceType;
  }

  get apiUrl() {
    return this.#apiUrl || '';
  }

  #awaitForTernUI(): Promise<HeadlessUIBrowser | Browser> {
    return new Promise<HeadlessUIBrowser | Browser>(resolve => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      resolve(this.ternui!);
    });
  }

  async loadTernUI(): Promise<HeadlessUIBrowser | Browser | undefined> {
    if (this._mode !== 'browser' || this.isReady) {
      return;
    }

    if (typeof window !== 'undefined') {
      window._TernSecure_authDomain = this.authDomain;
      window._TernSecure_proxyUrl = this.proxyUrl;
      window._TernSecure_apiUrl = this.apiUrl;
    }

    try {
      if (this.TernSecure) {
        let coreInstance: TernSecureProps;
        //console.log('[IsomorphicTernSecure] this.TernSecure: defined, checking readiness...');
        //const TernSecureHasLoadMethod = typeof this.TernSecure.load === 'function';
        if (isConstructor<BrowserConstructor | HeadlessUIBrowserConstructor>(this.TernSecure)) {
          coreInstance = new this.TernSecure(this.#apiUrl, {
            proxyUrl: this.proxyUrl,
            authDomain: this.authDomain,
          } as any);
          this.beforeLoad(coreInstance);
          await coreInstance.load(this.options);
        } else {
          //console.log('[IsomorphicTernSecure] this.TernSecure: does not have load method.');
          coreInstance = this.TernSecure;
          if (!coreInstance.isReady) {
            this.beforeLoad(coreInstance);
            await coreInstance.load(this.options);
          }
        }
        global.TernSecure = coreInstance;
      } else {
        //console.log('[IsomorphicTernSecure] Loading TernSecure from script is called...');
        if (!global.TernSecure) {
          //console.log('[IsomorphicTernSecure] Loading TernSecure from script...');
          await loadTernUIScript({
            ...this.options,
            authDomain: this.authDomain,
            nonce: this.options.nonce,

          })
        }

        if (!global.TernSecure) {
          throw new Error('TernSecure instance is not available globally');
        }

        this.beforeLoad(global.TernSecure);
        await global.TernSecure.load(this.options);
      }

      if (global.TernSecure?.isReady) {
        console.log('[IsomorphicTernSecure] global.TernSecure.ready: Injecting TernUI...');
        return this.injectTernUI(global.TernSecure);
      }
      return;
    } catch (err) {
      const error = err as Error;
      //this.#eventBus.emit(TernSecureEvents.Error, error);
      console.error(error.stack || error.message || error);
      return;
    }
  }

  private beforeLoad = (ternui: Browser | HeadlessUIBrowser | undefined) => {
    if (!ternui) {
      throw new Error('Failed to inject TernUI');
    }
  };


  private injectTernUI = (ternui: Browser | HeadlessUIBrowser | undefined) => {
    if (!ternui) {
      throw new Error('TernUI instance is not initialized');
    }

    this.ternui = ternui;

    this.premountState.methodCalls.forEach(cb => cb());

    this.preAddListener.forEach((listenerHandlers, listener) => {
      listenerHandlers.unsubscribe = ternui.addListener(listener);
    });


    this.#eventBus.getListeners('status').forEach(listener => {
      this.on('status', listener, { notify: true });
    });

    this.premountState.signInNodes.forEach((props, node) => {
      ternui.showSignIn(node, props);
    });

    this.premountState.signUpNodes.forEach((props, node) => {
      ternui.showSignUp(node, props);
    });

    if (typeof this.ternui.status === 'undefined') {
      console.log('[IsomorphicTernSecure] TernUI has no status, setting internal status to ready');
      this.#status = 'ready';
      this.#eventBus.emit('status', 'ready');
      console.log('[IsomorphicTernSecure] Set internal status to ready (ternui has no status)');
    }

    return this.ternui;

  };

  /**
   * 
   * @deprecated will be moved to import package
   */
  initTernSecureAuth() {
    if (this._mode !== 'browser' || this.isReady) {
      return;
    }

    // @ts-ignore - Deprecated method, TernSecureAuthImpl will be moved to import package
    const tern = TernSecureAuthImpl.initialize(this.options);
    this.loadTernSecureAuth(tern);
  }

  private loadTernSecureAuth = (ternauth: TernSecureAuthProps | undefined) => {
    if (!ternauth) {
      throw new Error('TernAuth instance is not initialized');
    }

    this.ternauth = ternauth;
    this.preAddListener.forEach((listenerHandlers, listener) => {
      listenerHandlers.unsubscribe = ternauth.addListener(listener);
    });

    this.#eventBus.getListeners('status').forEach(listener => {
      this.on('status', listener, { notify: true });
    });

    if (typeof this.ternauth.status === 'undefined') {
      console.log(
        '[IsoTernSecureAuth] TernSecureAuth has no status, setting internal status to ready',
      );
      this.#status = 'ready';
      this.#eventBus.emit(ternEvents.Status, 'ready');
    }

    return this.ternauth;
  };

  public on: TernSecureAuth['on'] = (...args) => {
    if (this.ternui?.on) {
      return this.ternui.on(...args);
    } else {
      return this.#eventBus.on(...args);
    }
  };

  public off: TernSecureAuth['off'] = (...args) => {
    if (this.ternui?.off) {
      return this.ternui.off(...args);
    } else {
      return this.#eventBus.off(...args);
    }
  };

  addListener = (listener: ListenerCallback): UnsubscribeCallback => {
    if (this.ternui) {
      return this.ternui.addListener(listener);
    } else {
      const unsubscribe = () => {
        const listenerHandlers = this.preAddListener.get(listener);
        if (listenerHandlers) {
          listenerHandlers.unsubscribe();
          this.preAddListener.delete(listener);
        }
      };
      this.preAddListener.set(listener, { unsubscribe });
      return unsubscribe;
    }
  };

  createActiveSession = (params: CreateActiveSessionParams): Promise<void> => {
    if (this.ternui) {
      return this.ternui.createActiveSession(params);
    } else {
      return Promise.reject(new Error('TernSecureAuth not initialized'));
    }
  };

  signOut = async (options?: SignOutOptions): Promise<void> => {
    if (!this.ternui) {
      throw new Error('TernSecureAuth not initialized');
    }
    await this.ternui.signOut();
  };

  get currentSession(): SignedInSession | null {
    if (!this.ternui) {
      return null;
    }
    return this.ternui.currentSession;
  }

  onAuthStateChanged(callback: (user: any) => void): () => void {
    if (!this.ternui) {
      console.warn(
        '[IsoTernSecureAuth] TernAuth not initialized, cannot set up auth state listener',
      );
      return () => { };
    }
    return this.ternui.onAuthStateChanged(callback);
  }

  getRedirectResult = async (): Promise<any> => {
    if (!this.ternui?.getRedirectResult) {
      throw new Error('TernSecure instance not initialized');
    }
    return this.ternui.getRedirectResult();
  };

  constructUrlWithAuthRedirect = (to: string): string => {
    if (this.ternui && this.isReady) {
      return this.ternui.constructUrlWithAuthRedirect(to);
    }
    return '';
  };

  constructAfterSignOutUrl = (): string => {
    if (this.ternui && this.isReady) {
      return this.ternui.constructAfterSignOutUrl() || '';
    } else {
      const callback = () => this.ternui?.constructAfterSignOutUrl() || '';
      this.premountState.methodCalls.set('constructAfterSignOutUrl', callback);
      return '';
    }
  }

  navigate = (to: string) => {
    if (this.ternui && this.isReady) {
      this.ternui.navigate(to);
    }
  };


  initialize = async (): Promise<void> => {
    try {
      await this.#awaitForTernUI();
    } catch (error) {
      console.error('[IsomorphicTernSecure] Failed to initialize TernUI:', error);
      throw error;
    }
  }


  showSignIn = (node: HTMLDivElement, config?: SignInProps): void => {
    if (this.ternui && this.isReady) {
      this.ternui.showSignIn(node, config);
    } else {
      this.premountState.signInNodes.set(node, config);
    }
  };

  hideSignIn = (node: HTMLDivElement): void => {
    if (this.ternui && this.isReady) {
      this.ternui.hideSignIn(node);
    } else {
      this.premountState.signInNodes.delete(node);
    }
  };

  showSignUp = (node: HTMLDivElement, config?: SignUpProps): void => {
    if (this.ternui && this.isReady) {
      this.ternui.showSignUp(node, config);
    } else {
      this.premountState.signUpNodes.set(node, config);
    }
  };

  hideSignUp = (node: HTMLDivElement): void => {
    if (this.ternui && this.isReady) {
      this.ternui.hideSignUp(node);
    } else {
      this.premountState.signUpNodes.delete(node);
    }
  };

  showUserButton = (node: HTMLDivElement): void => {
    if (this.ternui && this.isReady) {
      this.ternui.showUserButton(node);
    } else {
      this.premountState.userButttonNodes.set(node, undefined);
    }
  }

  hideUserButton = (node: HTMLDivElement): void => {
    if (this.ternui && this.isReady) {
      this.ternui.hideUserButton(node);
    } else {
      this.premountState.userButttonNodes.delete(node);
    }
  };

  redirectToSignIn = async (options?: SignInRedirectOptions) => {
    if (this.ternui?.redirectToSignIn) {
      this.ternui.redirectToSignIn(options);
    }
  };

  redirectToSignUp = async (options?: SignUpRedirectOptions) => {
    if (this.ternui?.redirectToSignUp) {
      this.ternui.redirectToSignUp();
    }
  };

  redirectAfterSignIn = (redirectUrl?: string): void => {
    if (this.ternui?.redirectAfterSignIn) {
      this.ternui.redirectAfterSignIn();
    }
  };

  redirectAfterSignUp = (redirectUrl?: string): void => {
    if (this.ternui?.redirectAfterSignUp) {
      this.ternui.redirectAfterSignUp();
    }
  };

  /**
   * 
   * @deprecated will be moved to import package
   */
  #awaitForTernSecureAuth(): Promise<TernSecureAuthProps> {
    return new Promise<TernSecureAuthProps>(resolve => {
      resolve(this.ternauth);
    });
  }

  /**
   * @deprecated will be moved to import package
   */
  initializeAuth = async (): Promise<void> => {
    this.initTernSecureAuth();
    try {
      await this.#awaitForTernSecureAuth();
    } catch (error) {
      console.error('[IsomorphicTernSecure] Failed to initialize TernSecureAuth:', error);
      throw error;
    }
  };
}
