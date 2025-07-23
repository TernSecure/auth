import {
  DEFAULT_TERN_SECURE_STATE,
  type TernSecureAuth,
  type SignOutOptions,
  type TernSecureAuthOptions,
  type TernSecureUser,
  type TernSecureState,
  type SignedInSession,
  type SignInResource,
  type SignUpResource,
  type TernSecureAuthStatus,
  type ListenerCallback, 
  type UnsubscribeCallback
} from '@tern-secure/types';
import { createTernAuthEventBus, ternEvents } from '@tern-secure/shared/ternStatusEvent';
import {  TernSecureAuth as TernSecureAuthImpl } from '@tern-secure/auth';


const SDK_METADATA = {
  name: __PACKAGE_NAME__,
  version: __PACKAGE_VERSION__,
  environment: process.env.NODE_ENV,
};

export function inBrowser(): boolean {
  return typeof window !== 'undefined';
}

export type TernSecureAuthPropsimport = TernSecureAuthImpl | undefined | null;


export type TernSecureAuthProps = TernSecureAuth | undefined | null;


export type IsoTernSecureAuthOptions = TernSecureAuthOptions & {
  TernSecureAuth?: TernSecureAuthProps;
}

/**
 * IsomorphicTernSecure class manages the auth state and UI rendering
 * in both browser and server environments, acting as a proxy for TernSecureAuth
 */
export class IsoTernSecureAuth implements TernSecureAuth {
  private readonly _mode: 'browser' | 'server';
  private readonly options: TernSecureAuthOptions;
  private ternauth: TernSecureAuthProps | null = null;
  #status: TernSecureAuthStatus = 'loading';

  static #instance: IsoTernSecureAuth | null | undefined;
  #listeners: Array<ListenerCallback> = [];
  #eventBus = createTernAuthEventBus();

  get status(): TernSecureAuthStatus {
    if (!this.ternauth) {
      return this.#status;
    }
    return (
      this.ternauth.status ||
      (this.ternauth.isReady ? 'ready' : 'loading')
    )
  }

  get isReady(): boolean {
    return this.ternauth?.isReady || false;
  }

  get isLoading(): boolean {
    return this.ternauth?.isLoading || false;
  }

  get requiresVerification(): boolean {
    return this.options.requiresVerification ?? true;
  }

  get signIn(): SignInResource | undefined | null {
    if (this.ternauth) {
      return this.ternauth.signIn;
    }
    return undefined
  }

  get signUp(): SignUpResource | undefined | null {
    if (this.ternauth) {
      return this.ternauth.signUp;
    }
    return undefined
  }

  get user() {
    if (this.ternauth) {
      return this.ternauth.user
    } else {
      undefined
    }
  }


  static getOrCreateInstance(options: IsoTernSecureAuthOptions) {
    if (!inBrowser() || !this.#instance) {
      this.#instance = new IsoTernSecureAuth(options);
    }
    return this.#instance;
  }
  
  static clearInstance() {
    if (this.#instance) {
      this.#instance.ternauth = null;
      this.#instance = null;
    }
  }

  get mode(): 'browser' | 'server' {
    return this._mode;
  }

  constructor(options: IsoTernSecureAuthOptions) {
    this.options = { ...options };
    this._mode = inBrowser() ? 'browser' : 'server';

    if (!this.options.sdkMetadata) {
      this.options.sdkMetadata = SDK_METADATA;
    }
    
    this.initTernSecureAuth();

  }
  
  async initTernSecureAuth() {
    if (this._mode !== 'browser' && this.isReady) {
      return
    }
    
    const tern = TernSecureAuthImpl.initialize(this.options);
    this.loadTernSecureAuth(tern);
  }

  private loadTernSecureAuth = (ternauth: TernSecureAuthProps |  undefined) => {
    if (!ternauth) {
      throw new Error('TernAuth instance is not initialized');
    }

    this.ternauth = ternauth;

    this.subscribeToTernAuthEvents();

    this.#eventBus.getListeners('status').forEach(listener => {
      listener('ready');
    });

    if (typeof this.ternauth.status === 'undefined') {
      console.log('[IsoTernSecureAuth] TernSecureAuth has no status, setting internal status to ready');
      this.#status = 'ready';
      this.#eventBus.emit(ternEvents.Status, 'ready');
    }

    return this.ternauth;
    
  };

  private subscribeToTernAuthEvents = () => {
    if (!this.ternauth?.events) {
      console.warn('[IsoTernSecureAuth] TernAuth instance has no events system');
      return;
    }

    const { events } = this.ternauth;

  
    events.onStatusChanged((newStatus: TernSecureAuthStatus) => {
      this.#status = newStatus;
      this.#eventBus.emit(ternEvents.Status, newStatus);
    });

    events.addListener((event) => {
      this.#listeners.forEach(listener => listener(event));
    });
  };

  public on: TernSecureAuth['on'] = (...args) => {
    if (this.ternauth?.on) {
      return this.ternauth.on(...args);
    } else {
      return this.#eventBus.on(...args);
    }
  };

  public off: TernSecureAuth['off'] = (...args) => {
    if (this.ternauth?.off) {
      return this.ternauth.off(...args);
    } else {
      return this.#eventBus.off(...args);
    }
  };

  signOut = async (options?: SignOutOptions): Promise<void> => {
    if (!this.ternauth) {
      throw new Error('TernSecureAuth not initialized');
    }
    await this.ternauth.signOut();
  };

  currentSession = async (): Promise<SignedInSession | null> => {
    if (!this.ternauth) {
      return null;
    }
    return this.ternauth.currentSession();
  };


  onAuthStateChanged(callback: (user: TernSecureUser | null | undefined) => void): () => void {
    if (!this.ternauth) {
      console.warn('[IsoTernSecureAuth] TernAuth not initialized, cannot set up auth state listener');
      return () => {};
    }
    return this.ternauth.onAuthStateChanged(callback);
  }


  authCookieManager(): void {
    this.ternauth?.authCookieManager();
  }

  #awaitForTernSecureAuth(): Promise<TernSecureAuthProps> {
    return new Promise<TernSecureAuthProps>(resolve => {
      resolve(this.ternauth!);
    });
  }
  
  initialize = async (): Promise<void> => {
    try {
      await this.#awaitForTernSecureAuth();
    } catch (error) {
      console.error('[IsomorphicTernSecure] Failed to initialize TernSecureAuth:', error);
      throw error;
    }
  }
  
  get events(): TernSecureAuth['events'] {
    return {
      onStatusChanged: (callback: (status: TernSecureAuthStatus) => void) => {
        if (this.ternauth?.events?.onStatusChanged) {
          return this.ternauth.events.onStatusChanged(callback);
        }
        this.#eventBus.on(ternEvents.Status, callback);
        return () => {
          this.#eventBus.off(ternEvents.Status, callback);
        };
      }, 
      addListener: (listener: ListenerCallback): UnsubscribeCallback  => {
        if (this.ternauth?.events?.addListener) {
          return this.ternauth.events.addListener(listener);
        }
        this.#listeners.push(listener);
        const unsubscribe = () => {
          const index = this.#listeners.indexOf(listener);
          if (index > -1) {
            this.#listeners.splice(index, 1);
          }
        };
        return unsubscribe;
      }
    };
  }

}

