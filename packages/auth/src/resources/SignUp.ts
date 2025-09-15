import type {
    SignUpResource,
    SignUpStatus,
    TernSecureConfig
} from '@tern-secure/types';
import type { Auth } from 'firebase/auth';

export class SignUp implements SignUpResource {
    status?: SignUpStatus | null = null;
    username?: string | null = null;
    firstName?: string | null = null;
    lastName?: string | null = null
    email: string | null = null;
    private auth: Auth;
    private ternSecureConfig?: TernSecureConfig;

    constructor(auth: Auth) {
        this.auth = auth;
    }

  withSocialProvider(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}