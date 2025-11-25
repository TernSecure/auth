import React from 'react';

import { VerificationLinkCard } from '../../common/VerificationLinkCard';
import { useAuthSignIn, useSignInContext} from '../../ctx';
import { useCardState } from '../../elements';

export function SignInEmailLinkCard(): React.JSX.Element {
  const signIn = useAuthSignIn();
  const signInCtx = useSignInContext();
  const { afterSignInUrl } = signInCtx;
  const card = useCardState();
  const [emailSent, setEmailSent] = React.useState(false);

  React.useEffect(() => {
    void sendVerificationEmail();
  }, []);

  const sendVerificationEmail = async () => {
    const res = await signIn?.attemptEmailVerification({
      url: afterSignInUrl,
      handleCodeInApp: true,
    }); 

    if (res?.status === 'error') {
      card.setError({
        status: 'error',
        message: res.message,
        error: res.error,
      });
      return;
    }

    setEmailSent(true);
  };

  const handleResendEmail = async () => {
    card.setLoading();
    await sendVerificationEmail();
    card.setIdle();
  };

  return (
    <VerificationLinkCard
      emailSent={emailSent}
      onResend={handleResendEmail}
      isLoading={card.isLoading}
    />
  );
}
