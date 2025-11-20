import React from 'react';

import { VerificationLinkCard } from '../../common/VerificationLinkCard';
import { useAuthSignUp, useSignUpContext } from '../../ctx';
import { useCardState } from '../../elements';

export function SignUpEmailLinkCard(): React.JSX.Element {
  const signUp = useAuthSignUp();
  const signUpCtx = useSignUpContext();
  const { afterSignUpUrl } = signUpCtx;
  const card = useCardState();
  const [emailSent, setEmailSent] = React.useState(false);

  React.useEffect(() => {
    void sendVerificationEmail();
  }, []);

  const sendVerificationEmail = async () => {
    const res = await signUp?.attemptEmailVerification({
      url: afterSignUpUrl,
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
