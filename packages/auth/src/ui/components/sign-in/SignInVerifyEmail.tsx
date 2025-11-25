import { withCardStateProvider } from '../../elements';
import { SignInEmailLinkCard } from './SignInEmailLinkCard';

export const SignInVerifyEmail = withCardStateProvider(() => {
  return <SignInEmailLinkCard />;
});
