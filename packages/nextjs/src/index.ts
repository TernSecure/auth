export { TernSecureProvider } from './app-router/server/TernSecureProvider';
export {
  useAuth,
  useIdToken,
  useSession,
  useSignIn,
  useSignUp,
  signIn,
} from './boundary/components';

export {
  SignIn,
  SignUp,
  UserButton,
} from './components/uiComponents'

export type {
  TernSecureUser,
  SignInResponse,
  SignUpResponse,
  SocialProviderOptions,
} from '@tern-secure/types';

export type { UserInfo, SessionResult } from './types';
