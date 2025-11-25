import { withCardStateProvider } from '../../elements';
import { SignUpEmailLinkCard } from './SignUpEmailLinkCard';

export const SignUpVerifyEmail = withCardStateProvider(() => {
  return <SignUpEmailLinkCard />;
});
