import { handleFirebaseAuthError } from '@tern-secure/shared/errors';
import type {
  ResendEmailVerification,
  SignInFormValues,
  SignInResource,
  SignInResponse as SignInResponseFromTypes,
  SignInStatus,
  TernSecureUser,
} from '@tern-secure/types';
import type { Auth, UserCredential } from 'firebase/auth';
import {
  getRedirectResult,
  GoogleAuthProvider,
  OAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';

import { TernSecureBase } from './Base';

type SignInResponse = SignInResponseFromTypes;

interface ProviderConfig {
  provider: GoogleAuthProvider | OAuthProvider;
  customParameters: Record<string, string>;
}

export type TernRequestInit = RequestInit;

export type SignInParams = {
  idToken: string;
  csrfToken: string | undefined;
};

type FirebaseAuthResult = UserCredential | void;

type AuthMethodFunction = (
  auth: Auth,
  provider: GoogleAuthProvider | OAuthProvider,
) => Promise<FirebaseAuthResult>;

export class SignIn extends TernSecureBase implements SignInResource {
  pathRoot = '/sessions/createsession';

  status?: SignInStatus | undefined;
  private auth: Auth;
  private csrfToken: string | undefined;
  private _currentUser: TernSecureUser | null = null;

  constructor(auth: Auth, csrfToken: string | undefined) {
    super();
    this.auth = auth;
    this.csrfToken = csrfToken;
  }

  signInWithCredential = async (credential: UserCredential) => {
    const idToken = await credential.user.getIdToken();
    const params = {
      idToken: idToken,
      csrfToken: this.csrfToken,
    };

    return this._post({
      path: this.pathRoot,
      body: params,
    });
  };

  withEmailAndPassword = async (params: SignInFormValues): Promise<SignInResponse> => {
    try {
      const { email, password } = params;
      const { user, providerId, operationType } = await signInWithEmailAndPassword(
        this.auth,
        email,
        password,
      );
      return {
        status: 'success',
        user,
        providerId,
        operationType,
        message: 'Authentication successful',
        error: !user.emailVerified ? 'REQUIRES_VERIFICATION' : 'AUTHENTICATED',
      };
    } catch (error) {
      const authError = handleFirebaseAuthError(error);
      return {
        status: 'error',
        message: authError.message,
        error: authError.code,
      };
    }
  };

  withCredential = async (params: SignInFormValues): Promise<void> => {
    try {
      const { email, password } = params;
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      await this.signInWithCredential(userCredential);
    } catch (error) {
      const authError = handleFirebaseAuthError(error);
      console.error(authError);
    }
  };

  withSocialProvider = async (
    provider: string,
    options?: {
      mode?: 'popup' | 'redirect';
    },
  ): Promise<SignInResponse | void> => {
    try {
      if (options?.mode === 'redirect') {
        const redirectResult = await this.authRedirectResult();

        if (redirectResult) {
          return redirectResult;
        }

        await this._signInWithRedirect(provider);
        return;
      } else {
        return await this._signInWithPopUp(provider);
      }
    } catch (error: any) {
      return {
        status: 'error',
        message: error.message || `Sign in with ${provider} failed`,
        error,
      };
    }
  };

  completeMfaSignIn = async (_mfaToken: string, _mfaContext?: any): Promise<SignInResponse> => {
    throw new Error('Method not implemented.');
  };

  sendPasswordResetEmail = async (email: string): Promise<void> => {
    console.log(`Sending password reset email to ${email}`);
  };

  resendEmailVerification = async (): Promise<ResendEmailVerification> => {
    const user = this._currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    await user.reload();

    if (user.emailVerified) {
      return {
        isVerified: true,
      };
    }

    const actionCodeSettings = {
      url: '/sign-in', // TODO: Make this configurable
      handleCodeInApp: true,
    };

    await sendEmailVerification(user, actionCodeSettings);
    return {
      isVerified: false,
    };
  };

  private getProviderConfig(providerName: string): ProviderConfig {
    switch (providerName.toLowerCase()) {
      case 'google': {
        const googleProvider = new GoogleAuthProvider();
        return {
          provider: googleProvider,
          customParameters: {
            access_type: 'offline',
            login_hint: 'user@example.com',
            prompt: 'select_account',
          },
        };
      }
      case 'apple': {
        const appleProvider = new OAuthProvider('apple.com');
        return {
          provider: appleProvider,
          customParameters: {
            locale: 'en',
          },
        };
      }
      case 'microsoft': {
        const microsoftProvider = new OAuthProvider('microsoft.com');
        return {
          provider: microsoftProvider,
          customParameters: {
            prompt: 'consent',
          },
        };
      }
      default:
        throw new Error(`Unsupported provider: ${providerName}`);
    }
  }

  private async authRedirectResult(): Promise<SignInResponse | null> {
    try {
      const result = await getRedirectResult(this.auth);

      if (result) {
        const { user, providerId, operationType } = result;
        return {
          status: 'success',
          user,
          providerId,
          operationType,
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

  private executeAuthMethod = async (
    authMethod: AuthMethodFunction,
    providerName: string,
  ): Promise<SignInResponse> => {
    try {
      const config = this.getProviderConfig(providerName);
      config.provider.setCustomParameters(config.customParameters);

      const credential = await authMethod(this.auth, config.provider);

      if (credential) {
        return {
          status: 'success',
          message: 'Authentication successful',
          user: credential.user,
          providerId: credential.providerId,
          operationType: credential.operationType,
        };
      }

      return {
        status: 'success',
        message: 'Redirect initiated',
      };
    } catch (error) {
      const authError = handleFirebaseAuthError(error);
      return {
        status: 'error',
        message: authError.message,
        error: authError.code,
      };
    }
  };

  private async _signInWithRedirect(providerName: string): Promise<SignInResponse> {
    return this.executeAuthMethod(signInWithRedirect, providerName);
  }

  private async _signInWithPopUp(providerName: string): Promise<SignInResponse> {
    return this.executeAuthMethod(signInWithPopup, providerName);
  }

  public async checkRedirectResult(): Promise<SignInResponse | null> {
    return this.authRedirectResult();
  }
}
