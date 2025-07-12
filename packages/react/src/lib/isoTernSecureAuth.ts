import type { 
  TernSecureAuth,
  SignOutOptions,
  TernSecureAuthOptions,
  TernSecureUser,
  TernSecureState,
  SignInResponseTree,
  SignedInSession,
  SignInResource,
  SignUpResource
} from '@tern-secure/types';
import { EventEmitter } from '@tern-secure/shared/eventBus';
import { TernSecureAuth as BaseTernSecureAuth } from '@tern-secure/auth';

const SDK_METADATA = {
  name: __PACKAGE_NAME__,
  version: __PACKAGE_VERSION__,
  environment: process.env.NODE_ENV,
};

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

export function inBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * IsomorphicTernSecure class manages the auth state and UI rendering
 * in both browser and server environments, acting as a proxy for TernSecureAuth
 */
export class IsoTernSecureAuth implements TernSecureAuth {
  private readonly _mode: 'browser' | 'server';
  private readonly options: TernSecureAuthOptions;
  private _ternSecureAuth: BaseTernSecureAuth | null = null;

  static #instance: IsoTernSecureAuth | null | undefined;
  #eventBus = new EventEmitter();

  get isReady(): boolean {
    return this._ternSecureAuth?.internalAuthState.isLoaded ?? false;
  }

  get isLoading(): boolean {
    return !this._ternSecureAuth?.internalAuthState.isLoaded;
  }

  get error(): Error | null {
    return this._ternSecureAuth?.internalAuthState.error || null;
  }

  get requiresVerification(): boolean {
    return this.options.requiresVerification ?? true;
  }

  get signIn(): SignInResource {
    if (!this._ternSecureAuth) {
      throw new Error('TernSecureAuth not initialized');
    }
    return this._ternSecureAuth.signIn;
  }

  get signUp(): SignUpResource {
    if (!this._ternSecureAuth) {
      throw new Error('TernSecureAuth not initialized');
    }
    return this._ternSecureAuth.signUp;
  }


  static initialize(options: TernSecureAuthOptions): IsoTernSecureAuth {
    if (!this.#instance) {
      this.#instance = new IsoTernSecureAuth(options);
    }
    return this.#instance;
  }
  
  static clearInstance() {
    if (this.#instance) {
      this.#instance._ternSecureAuth = null;
      this.#instance = null;
    }
  }

  get mode(): 'browser' | 'server' {
    return this._mode;
  }

  constructor(options: TernSecureAuthOptions) {
    this.options = { ...options };
    this._mode = inBrowser() ? 'browser' : 'server';

    if (inBrowser()) {
      this._initTernSecureAuth();
    }

    if (!this.options.sdkMetadata) {
      this.options.sdkMetadata = SDK_METADATA;
    }

    console.log('[IsoTernSecureAuth] Initialized with options:', this.options);

    this.#eventBus.on('statusChange', (status) => {
      console.log('Auth status changed:', status);
    });
  }

  private async _initTernSecureAuth() {
    if (!this._ternSecureAuth && inBrowser()) {
      this._ternSecureAuth = await BaseTernSecureAuth.initialize(this.options);
    }
  }

  signOut = async (options?: SignOutOptions): Promise<void> => {
    if (!this._ternSecureAuth) {
      throw new Error('TernSecureAuth not initialized');
    }
    await this._ternSecureAuth.signOut();
  };

  currentSession = async (): Promise<SignedInSession | null> => {
    if (!this._ternSecureAuth) {
      return null;
    }
    return this._ternSecureAuth.currentSession();
  };

  get internalAuthState(): TernSecureState {
    return this._ternSecureAuth?.internalAuthState || {
      ...DEFAULT_TERN_SECURE_STATE,
      isLoaded: true,
      status: "unauthenticated"
    };
  }

  ternSecureUser(): TernSecureUser | null {
    return this._ternSecureAuth?.ternSecureUser() || null;
  }

  async checkRedirectResult(): Promise<SignInResponseTree | null> {
    if (!this._ternSecureAuth) {
      return null;
    }
    return this._ternSecureAuth.checkRedirectResult();
  }

  authCookieManager(): void {
    this._ternSecureAuth?.authCookieManager();
  }
}

