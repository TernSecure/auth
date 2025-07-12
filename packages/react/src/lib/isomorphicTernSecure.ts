import type { 
  TernSecureInstance, 
  AuthErrorTree,
  TernSecureInstanceTreeStatus,
  TernSecureAuthProvider,
  TernSecureState,
  SignInRedirectOptions,
  SignUpRedirectOptions,
  RedirectOptions,
  SignOutOptions,
} from '@tern-secure/types';
import type { 
  TernSecureProps, 
  IsomorphicTernSecureOptions, 
} from '../types'
import { EventEmitter } from '@tern-secure/shared/eventBus'

const SDK_METADATA = {
  name: __PACKAGE_NAME__,
  version: __PACKAGE_VERSION__,
  environment: process.env.NODE_ENV,
}


export function inBrowser(): boolean {
  return typeof window !== 'undefined';
}


/**
 * IsomorphicTernSecure class manages the auth state and UI rendering
 * in both browser and server environments
 */
export class IsomorphicTernSecure implements TernSecureInstance {
  private readonly _mode:  'browser' | 'server';
  private readonly options: IsomorphicTernSecureOptions;
  private readonly TernSecure: TernSecureProps;
  private _authProvider?: TernSecureAuthProvider;
  #status: TernSecureInstanceTreeStatus = 'loading';
  #customDomain?: string;

  static #instance: IsomorphicTernSecure | null | undefined;
  #eventBus = new EventEmitter();

  get isReady(): boolean {
    return this.isReady || false;
  }


  get isLoading(): boolean {
    return this.isLoading || false;
  }

  get error(): Error | null {
    return this.error || null;
  }

  get requiresVerification(): boolean {
    return this.requiresVerification || true;
  }

  static getOrCreateInstance(options: IsomorphicTernSecureOptions) {
    if (
      !inBrowser() || 
      !this.#instance || 
      (options.TernSecure && this.#instance.TernSecure !== options.TernSecure)) {
      this.#instance = new IsomorphicTernSecure(options);
    }

    return this.#instance;
  }
  
  static clearInstance() {
    this.#instance = null;
  }

  // Configuration properties delegated to core instance
  get customDomain(): string  {
    if (typeof this.#customDomain === 'function') {
      throw new Error('Unsported customDomain type: function');
    }
    return this.#customDomain || '';
  }



  get apiKey(): string | undefined {
    return this.apiKey || this.options.apiKey;
  }


  get mode(): 'browser' | 'server' | undefined {
    return this._mode;
  }

  constructor(options: IsomorphicTernSecureOptions) {
    const { TernSecure = null, customDomain } = options || {};
    this.#customDomain = customDomain;
    this.options = options;
    this.TernSecure = TernSecure;
    this._mode = inBrowser() ? 'browser' : 'server';
    //this.#eventBus.emit('statusChange', this.status);

    if(!this.options.sdkMetadata) {
      this.options.sdkMetadata = SDK_METADATA;
    }
  }



  signOut = async (options?: SignOutOptions): Promise<void> => {
    if (this.isReady) {
      await this.signOut(options);
    }
  };

}


export function isConstructor<T>(f: any): f is T {
  return typeof f === 'function';
}

