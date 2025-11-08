export { TernSecureProvider } from './app-router/server/TernSecureProvider';
export {
  useAuth,
  useIdToken,
  useSession,
  useSignIn,
  useSignUp,
  signIn,
  useSignInContext,
  useSignUpContext,
  useTernSecure,
  SignInProvider,
  SignUpProvider,
} from './boundary/components';

export type {
  TernSecureUser,
  SignInResponse,
  SignUpResponse,
  SocialProviderOptions,
} from '@tern-secure/types';

export type { UserInfo, SessionResult } from './types';
