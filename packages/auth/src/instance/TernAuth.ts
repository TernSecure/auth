import {
  createTernAuthEventBus,
  ternEvents,
} from "@tern-secure/shared/ternStatusEvent";
import {
  type TernSecureAuth as TernSecureAuthInterface,
  type TernSecureAuthOptions,
  type TernSecureUser,
  type SignInResponseTree,
  type SignedInSession,
  type TernSecureConfig,
  type TernSecureAuthStatus,
  type SignInResource,
  type SignUpResource,
  ListenerCallback,
  UnsubscribeCallback,
  SignOut,
  type SignOutOptions,
} from "@tern-secure/types";
import { handleFirebaseAuthError } from "@tern-secure/shared/errors";
import {
  Auth,
  getAuth,
  onAuthStateChanged,
  getRedirectResult,
  browserLocalPersistence,
  inMemoryPersistence,
  setPersistence,
} from "firebase/auth";
import { getInstallations } from "firebase/installations";
import { FirebaseApp, initializeApp, getApps } from "firebase/app";
import { TernSecureBase, SignIn, SignUp } from "./resources/internal";
import { eventBus, events } from "./events";

export function inBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Firebase implementation of the TernSecureAuth interface
 */
export class TernSecureAuth implements TernSecureAuthInterface {
  private static instance: TernSecureAuth | null = null;
  private _currentUser: TernSecureUser | null = null;
  private signedInSession: SignedInSession | null = null;
  private firebaseClientApp: FirebaseApp | undefined;
  private auth!: Auth;
  private authStateUnsubscribe: (() => void) | null = null;
  private tokenRefreshUnsubscribe: (() => void) | null = null;
  public isLoading = false;
  public error: Error | null = null;
  public user: TernSecureUser | null | undefined = null;
  #status: TernSecureAuthInterface["status"] = "loading";
  #listeners: Array<ListenerCallback> = [];
  #options: TernSecureAuthOptions = {};
  #eventBus = createTernAuthEventBus();

  signIn!: SignInResource;
  signUp!: SignUpResource;

  private constructor() {
    this.#eventBus.emit(ternEvents.Status, "loading");
    TernSecureBase.ternsecure = this;
  }

  get isReady(): boolean {
    return this.status === "ready";
  }

  get status(): TernSecureAuthInterface["status"] {
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
      console.log("[TernSecureAuth] - Creating new TernSecureAuth instance");
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
        throw new Error(
          "TernSecureConfig is required to initialize TernSecureAuth"
        );
      }

      this.initializeFirebaseApp(this.#options.ternSecureConfig);
      this.authStateUnsubscribe = this.initAuthStateListener();

      this.signIn = new SignIn(this.auth);
      this.signUp = new SignUp(this.auth);

      this.#setStatus("ready");
      this.#eventBus.emit(ternEvents.Status, "ready");

      return this;
    } catch (error) {
      this.error = error as Error;
      this.#setStatus("error");
      this.#eventBus.emit(ternEvents.Status, "error");
      throw error;
    }
  };

  private initializeFirebaseApp(config: TernSecureConfig) {
    const appName = config.appName || "[DEFAULT]";
    this.firebaseClientApp =
      getApps().length === 0 ? initializeApp(config, appName) : getApps()[0];

    this.auth = getAuth(this.firebaseClientApp);
    getInstallations(this.firebaseClientApp);

    setPersistence(this.auth, browserLocalPersistence).catch((error) =>
      console.error("TernAuth: Error setting auth persistence:", error)
    );
  }

  signOut: SignOut = async (options?: SignOutOptions) => {
    const redirectUrl =
      options?.redirectUrl || this.#constructAfterSignOutUrl();
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
      status: "active",
      token: res.token,
      claims: res.claims,
      issuedAtTime: res.issuedAtTime,
      expirationTime: res.expirationTime,
      authTime: res.authTime,
      signInProvider: res.signInProvider || "unknown",
    };
    return this.signedInSession;
  };

  private initAuthStateListener(): () => void {
    return onAuthStateChanged(
      this.auth,
      async (user: TernSecureUser | null) => {
        this._currentUser = user;
        eventBus.emit(events.UserChanged, user);
      }
    );
  }

  public onAuthStateChanged(
    callback: (user: TernSecureUser | null | undefined) => void
  ): () => void {
    return onAuthStateChanged(this.auth, callback);
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
    listener({
      user: this._currentUser,
    });

    const unsubscribe = () => {
      this.#listeners = this.#listeners.filter((l) => l !== listener);
    };
    return () => {
      unsubscribe();
    };
  };

  public on: TernSecureAuthInterface["on"] = (...args) => {
    this.#eventBus.on(...args);
  };

  public off: TernSecureAuthInterface["off"] = (...args) => {
    this.#eventBus.off(...args);
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
        throw new Error(
          "TernSecureConfig is required to initialize TernSecureAuth"
        );
      }

      this.initializeFirebaseApp(this.#options.ternSecureConfig);

      this.signIn = new SignIn(this.auth);
      this.signUp = new SignUp(this.auth);

      this.#setStatus("ready");
    } catch (error) {
      this.error = error as Error;
      this.#setStatus("error");
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

  #constructAfterSignOutUrl = (): string => {
    if (!this.#options.afterSignOutUrl) {
      return "/";
    }
    return this.constructUrlWithAuthRedirect(this.#options.afterSignOutUrl);
  };

  #initOptions = (options?: TernSecureAuthOptions): TernSecureAuthOptions => {
    return {
      ...options,
    };
  };

  #setStatus(newStatus: TernSecureAuthStatus): void {
    if (this.#status !== newStatus) {
      this.#status = newStatus;
      this.#eventBus.emit(ternEvents.Status, this.#status);

      if (newStatus === "ready") {
        this.#eventBus.emit(ternEvents.Status, "ready");
      }
    }
  }
}
