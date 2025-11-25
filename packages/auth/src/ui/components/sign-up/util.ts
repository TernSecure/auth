import type { SignUpResource } from '@tern-secure/types';

type CompleteSignUpFlowProps = {
  signUp: SignUpResource;
  verifyEmailPath?: string;
  verifyPhonePath?: string;
  continuePath?: string;
  navigate: (to: string) => Promise<unknown>;
  handleComplete?: () => Promise<void>;
  redirectUrl?: string;
  redirectUrlComplete?: string;
  oidcPrompt?: string;
};

export const completeSignUpFlow = ({
  signUp,
  verifyEmailPath,
  navigate,
  handleComplete
}: CompleteSignUpFlowProps): Promise<unknown> | undefined => {
  if (signUp.status === 'complete') {
    return handleComplete && handleComplete();
  } else if (signUp.status === 'missing_requirements') {
    if (signUp.unverifiedFields?.includes('email_address') && verifyEmailPath) {
      return navigate(verifyEmailPath);
    }
  }
  return;
}