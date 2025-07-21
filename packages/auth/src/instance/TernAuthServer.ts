import { initializeServerApp, FirebaseServerApp, FirebaseServerAppSettings } from "firebase/app";
import { Auth, getAuth, getIdToken  } from "firebase/auth";
import type { TernSecureConfig, TernSecureUser } from '@tern-secure/types';

type TernSecureServerConfig = {
  apiKey: string;
}
export interface TernServerAuthOptions {
  firebaseConfig?: TernSecureServerConfig;
  authIdToken?: string;
}

export interface AuthenticatedApp {
  firebaseServerApp: FirebaseServerApp;
  auth: Auth;
  currentUser?: TernSecureUser | null;
}

export class TernServerAuth {
  private static instance: TernServerAuth | null = null;
  private auth!: Auth;
  #options: TernServerAuthOptions = {};

  public constructor() {}

  static getInstance(): TernServerAuth {
    if (!this.instance) {
      this.instance = new TernServerAuth();
    }
    return this.instance;
  }


  public static initialize(options: TernServerAuthOptions): TernServerAuth {
    const instance = this.getInstance();
    instance.#initialize(options);
    return instance;
  }

  #initialize(options: TernServerAuthOptions): void {
    this.#options = this.#initOptions(options);
  }

  static clearInstance(): void {
    this.instance = null;
  }

  getServerApp = async(appSettings?: FirebaseServerAppSettings): Promise<AuthenticatedApp> => {
    const firebaseConfig = this.#options.firebaseConfig;
    if (!firebaseConfig) {
      throw new Error("Firebase configuration is required to initialize the server app");
    }

    const firebaseServerApp = initializeServerApp(
        firebaseConfig,
        appSettings || {}
    );

    const auth = getAuth(firebaseServerApp);
    await auth.authStateReady();

    return {
      firebaseServerApp,
      currentUser: auth.currentUser,
      auth
    };
  }

  getAuthenticatedAppFromHeaders = async(headers: { get: (key: string) => string | null }): Promise<AuthenticatedApp> => {
    let authHeader = headers.get("Authorization");
    let idToken = authHeader?.split("Bearer ")[1];
    
    let appSettings: FirebaseServerAppSettings = {
      authIdToken: idToken,
      releaseOnDeref: headers
    };

    return this.getServerApp(appSettings);
  }


  getAuthIdToken = async(): Promise<string | undefined> => {
    await this.auth.authStateReady();
    if (!this.auth.currentUser) return;
    return await getIdToken(this.auth.currentUser);
  }


  #initOptions = (options?: TernServerAuthOptions): TernServerAuthOptions => {
    return {
      ...options,
    }
  }
  
}