import { handleFirebaseAuthError } from '@tern-secure/shared/errors';
import type {
  AttemptFirstFactorParams,
  ResendEmailVerification,
  SignInCreateParams,
  SignInJson,
  SignInPasswordParams,
  SignInPhoneParams,
  SignInResource,
  SignInResponse as SignInResponseFromTypes,
  SignInStatus,
  SocialProviderOptions,
  TernSecureUser
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
  //customParameters: Record<string, string>;
}

export type TernRequestInit = RequestInit;

export type SignInParams = {
  idToken: string;
  csrfToken: string | undefined;
};

type FirebaseAuthResult = UserCredential;

type AuthMethodFunction = (
  auth: Auth,
  provider: GoogleAuthProvider | OAuthProvider,
) => Promise<FirebaseAuthResult>;

/**
 * Supported OAuth providers
 */
export type SupportedProvider =
  | 'google'
  | 'apple'
  | 'microsoft'
  | 'github'
  | 'twitter'
  | 'facebook'
  | string; // Allow custom providers like 'custom.provider.com'

export class SignIn extends TernSecureBase implements SignInResource {
  pathRoot = '/sign_ins';
  pathSessionRoot = '/sessions/createsession';

  id?: string;
  status: SignInStatus | null = null;
  private auth: Auth;
  private csrfToken: string | undefined;
  private _currentUser: TernSecureUser | null = null;

  constructor(data: SignInJson | null = null, auth: Auth, csrfToken: string | undefined) {
    super();
    this.auth = auth;
    this.csrfToken = csrfToken;
    this.fromJSON(data);
  }

  create = (params: SignInCreateParams): Promise<this> => {
    return this._basePost({
      path: this.pathRoot,
      body: params
    });
  };

  attemptFirstFactor = (params: AttemptFirstFactorParams): Promise<SignInResource> => {
    const config = { ...params }
    return this._basePost({
      body: { config, strategy: params.strategy, },
      action: 'attempt_first_factor',
    });
  };

  signInWithCredential = async (credential: UserCredential) => {
    const idToken = await credential.user.getIdToken();
    const params = {
      idToken: idToken,
      csrfToken: this.csrfToken,
    };

    return this._post({
      path: this.pathSessionRoot,
      body: params,
    });
  };

  authenticateWithPassword = async (params: SignInPasswordParams): Promise<SignInResponse> => {
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

  authenticateWithPhoneNumber = async (params: SignInPhoneParams): Promise<SignInResponse> => {
    throw new Error('Method not implemented.');
  };

  withCredential = async (params: SignInPasswordParams): Promise<void> => {
    try {
      const { email, password } = params;
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      await this.signInWithCredential(userCredential);
    } catch (error) {
      const authError = handleFirebaseAuthError(error);
      console.error(authError);
    }
  };

  authenticateWithSocialProvider = async (
    provider: SupportedProvider,
    options: SocialProviderOptions = {},
  ): Promise<SignInResponse> => {
    try {
      const { mode = 'popup' } = options;
      if (mode === 'redirect') {
        const redirectResult = await this.authRedirectResult();

        if (redirectResult) {
          return redirectResult;
        }

        return await this._signInWithRedirect(provider, options);
      } else {
        return await this._signInWithPopUp(provider, options);
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

  sendPasswordResetEmail = async (email: string) => {
    return this._post({
      path: '/sign_ins/resetPasswordEmail',
      body: {
        email,
      },
    })
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

  private getProviderConfig(providerName: SupportedProvider): ProviderConfig {
    switch (providerName.toLowerCase()) {
      case 'google': {
        const googleProvider = new GoogleAuthProvider();
        return { provider: googleProvider };
      }
      case 'apple': {
        const appleProvider = new OAuthProvider('apple.com');
        return { provider: appleProvider };
      }
      case 'microsoft': {
        const microsoftProvider = new OAuthProvider('microsoft.com');
        return { provider: microsoftProvider };
      }
      case 'github': {
        const githubProvider = new OAuthProvider('github.com');
        return { provider: githubProvider };
      }
      case 'twitter': {
        const twitterProvider = new OAuthProvider('twitter.com');
        return { provider: twitterProvider };
      }
      case 'facebook': {
        const facebookProvider = new OAuthProvider('facebook.com');
        return { provider: facebookProvider };
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

  /**
   * Sets custom OAuth parameters on the provider if provided by consumer
   * @param provider - Firebase auth provider instance
   * @param customParameters - Consumer-provided OAuth parameters
   */
  private setProviderCustomParameters(
    provider: GoogleAuthProvider | OAuthProvider,
    customParameters?: Record<string, string>,
  ): void {
    if (!customParameters || Object.keys(customParameters).length === 0) {
      return;
    }

    provider.setCustomParameters(customParameters);
  }

  /**
   * Adds OAuth scopes to the provider if provided by consumer
   * Handles provider-specific scope setting logic
   * @param provider - Firebase auth provider instance
   * @param scopes - Array of OAuth scopes to request
   */
  private setProviderScopes(provider: GoogleAuthProvider | OAuthProvider, scopes?: string[]): void {
    if (!scopes || scopes.length === 0) {
      return;
    }

    if (provider instanceof GoogleAuthProvider) {
      // Google provider supports individual scope addition
      scopes.forEach(scope => {
        (provider as GoogleAuthProvider).addScope(scope);
      });
    } else if (provider instanceof OAuthProvider) {
      // OAuth providers expect space-separated scope string
      (provider as OAuthProvider).addScope(scopes.join(' '));
    }
  }

  /**
   * Configures OAuth provider with consumer-provided options
   * @param provider - Firebase auth provider instance
   * @param options - Consumer options containing custom parameters and scopes
   */
  private configureProvider(
    provider: GoogleAuthProvider | OAuthProvider,
    options: SocialProviderOptions,
  ): void {
    this.setProviderCustomParameters(provider, options.customParameters);
    this.setProviderScopes(provider, options.scopes);
  }

  private executeAuthMethod = async (
    authMethod: AuthMethodFunction,
    providerName: SupportedProvider,
    options: SocialProviderOptions = {},
  ): Promise<SignInResponse> => {
    try {
      const config = this.getProviderConfig(providerName);

      this.configureProvider(config.provider, options);

      const { user, providerId, operationType } = await authMethod(this.auth, config.provider);

      return {
        status: 'success',
        message: 'Authentication successful',
        user,
        providerId,
        operationType,
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

  private async _signInWithRedirect(
    providerName: SupportedProvider,
    options: SocialProviderOptions = {},
  ): Promise<SignInResponse> {
    return this.executeAuthMethod(signInWithRedirect, providerName, options);
  }

  private async _signInWithPopUp(
    providerName: SupportedProvider,
    options: SocialProviderOptions = {},
  ): Promise<SignInResponse> {
    return this.executeAuthMethod(signInWithPopup, providerName, options);
  }

  public async checkRedirectResult(): Promise<SignInResponse | null> {
    return this.authRedirectResult();
  }

  protected fromJSON(data: SignInJson | null): this {
    if (data) {
      this.id = data.id;
      this.status = data.status;
    }
    return this;
  }
}
