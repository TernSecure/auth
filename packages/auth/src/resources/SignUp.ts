import { handleFirebaseAuthError } from '@tern-secure/shared/errors';
import type {
  SignUpFormValues,
  SignUpJson,
  SignUpResource,
  SignUpStatus,
  TernSecureUser,
  UnverifiedField
} from '@tern-secure/types';
import type { Auth } from 'firebase/auth';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

import { TernSecureBase } from './Base';

export class SignUp extends TernSecureBase implements SignUpResource {
  status: SignUpStatus | null = null;
  user: TernSecureUser | null = null;
  unverifiedFields?: UnverifiedField[];
  message?: string;
  error?: any;
  private auth: Auth;

  constructor(data: SignUpJson | null = null, auth: Auth) {
    super();
    this.auth = auth;
    this.fromJSON(data);
  }

  withEmailAndPassword = async (params: SignUpFormValues): Promise<SignUpResource> => {
    try {
      const { email, password } = params;
      const { user } = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password,
      );

      this.user = user;

      if (!user.emailVerified) {
        this.status = 'missing_requirements';
        this.unverifiedFields = ['email_address'];
        this.message = 'User created successfully. Email verification required.';
      }

      return this;
    } catch (error) {
      const authError = handleFirebaseAuthError(error);
      this.status = 'error';
      this.message = authError.message;
      this.error = authError.code;
      return this;
    }
  };

  withSocialProvider(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  attemptEmailVerification = async (options?: {
    url?: string;
    handleCodeInApp?: boolean;
  }): Promise<SignUpResource> => {
    try {
      if (!this.user) {
        this.status = 'error';
        this.message = 'No user found to send verification email';
        this.error = 'NO_USER';
        return this;
      }

      await sendEmailVerification(this.user, {
        url: options?.url || window.location.origin,
        handleCodeInApp: options?.handleCodeInApp ?? true,
      });

      this.message = 'Verification email sent successfully';
      return this;
    } catch (error) {
      const authError = handleFirebaseAuthError(error);
      this.status = 'error';
      this.message = authError.message;
      this.error = authError.code;
      return this;
    }
  };

  protected fromJSON(data: SignUpJson | null): this {
    if (data) {
      this.id = data.id;
      this.status = data.status;
    }
    return this;
  }
}
