import { handleFirebaseAuthError } from '@tern-secure/shared/errors';
import type {
  ResendEmailVerification,
  SignInFormValues,
  SignInResource,
  SignInResponse,
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
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);

      await this.signInWithCredential(userCredential);

      const { user } = userCredential;
      return {
        success: true,
        message: 'Authentication successful',
        user,
        error: !user.emailVerified ? 'REQUIRES_VERIFICATION' : 'AUTHENTICATED',
      };
    } catch (error) {
      const authError = handleFirebaseAuthError(error);
      return {
        success: false,
        message: authError.message,
        error: authError.code,
        user: null,
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
          if (redirectResult.success) {
            console.log('Redirect after sign in');
          }
          return redirectResult;
        }

        await this._signInWithRedirect(provider);
        return;
      } else {
        await this._signInWithPopUp(provider);
        return {
          success: true,
          message: 'Sign in successful',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || `Sign in with ${provider} failed`,
        error,
        user: null,
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
        success: true,
        message: 'Email is already verified. You can sign in.',
        isVerified: true,
      };
    }

    const actionCodeSettings = {
      url: '/sign-in', // TODO: Make this configurable
      handleCodeInApp: true,
    };

    await sendEmailVerification(user, actionCodeSettings);
    return {
      success: true,
      message: 'Verification email sent. Please check your inbox.',
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
            login_hint: 'user@example.com',
            prompt: 'select_account',
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
        const user = result.user;
        return {
          success: true,
          user,
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

  private async executeAuthMethod(
    authMethod: AuthMethodFunction,
    providerName: string,
  ): Promise<SignInResponse> {
    const config = this.getProviderConfig(providerName);
    config.provider.setCustomParameters(config.customParameters);
    try {
      await authMethod(this.auth, config.provider);
      return { success: true, message: 'Authentication initiated' };
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
