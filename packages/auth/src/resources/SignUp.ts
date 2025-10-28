import { handleFirebaseAuthError } from '@tern-secure/shared/errors';
import type {
  SignUpInitialValue,
  SignUpResource,
  SignUpResponse,
  SignUpStatus,
} from '@tern-secure/types';
import type { Auth } from 'firebase/auth';
import { createUserWithEmailAndPassword } from 'firebase/auth';

import { TernSecureBase } from './Base';

export class SignUp extends TernSecureBase implements SignUpResource {
  status: SignUpStatus | null = null;
  username: string | null = null;
  firstName: string | null = null;
  lastName: string | null = null;
  displayName: string | null = null;
  email: string | null = null;
  phoneNumber: string | null = null;
  private auth: Auth;

  constructor(auth: Auth) {
    super();
    this.auth = auth;
  }

  withEmailAndPassword = async (params: SignUpInitialValue): Promise<SignUpResponse> => {
    try {
      const { email, password } = params;
      const { user, providerId, operationType } = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password,
      );
      return {
        status: 'complete',
        user,
        providerId,
        operationType,
        message: 'User registration successful',
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

  withSocialProvider(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
