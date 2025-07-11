import {
    SignUpResource,
    SignUpStatus
} from '@tern-secure/types';

export class SignUp implements SignUpResource {
    status?: SignUpStatus | null = null;
    username?: string | null = null;
    firstName?: string | null = null;
    lastName?: string | null = null
    email: string | null = null;

  withSocialProvider(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}