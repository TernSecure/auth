import { useTernSecure } from '@tern-secure/shared/react';
import type { SignInFactor } from '@tern-secure/types';
import React from 'react';

import { useAuthSignIn } from '../../ctx';
import { useSignInContext } from '../../ctx/components/SignIn';
import { determineCurrentFactor } from '../../ctx/utils';
import { ErrorCard, LoadingCard, useCardState, withCardStateProvider } from '../../elements';
import { useRouter } from '../../router';
import { SignInFactorOnePasswordCard } from './SignInFactorOnePasswordCard';

function SignInFactorOneInternal(): React.JSX.Element {
  const signIn = useAuthSignIn();
  const ternSecure = useTernSecure();
  const requiresVerification = ternSecure.requiresVerification;
  const card = useCardState();
  const router = useRouter();
  const { navigate } = router;
  const ctx = useSignInContext();
  const { afterSignInUrl } = ctx;
  const [selectedFactor, setSelectedFactor] = React.useState<SignInFactor | null>(null);
  const currentFactor = determineCurrentFactor(selectedFactor, signIn?.supportedFirstFactors);

  React.useEffect(() => {
    if (signIn?.status === 'needs_identifier' || signIn?.status === null) {
      void router.navigate('../');
    }
  }, [signIn?.status, router]);

  const signInWithPassword = async (password: string) => {
    if (!signIn?.identifier) {
      card.setError({
        status: 'error',
        message: 'Identifier is missing',
      });
      return;
    }

    const res = await signIn?.authenticateWithPassword({
      email: signIn.identifier,
      password,
    });

    if (res?.status === 'error') {
      card.setError({
        status: 'error',
        message: res.message,
        error: res.error,
      });
    }
    if (res?.status === 'success') {
      if (requiresVerification && !res.user.emailVerified) {
        void navigate('../verify-email-address');
        return;
      }
      await ternSecure.createActiveSession({ session: res.user, redirectUrl: afterSignInUrl });
    }
  };

  const handleForgotPassword = () => {
    void navigate('../reset-password');
  };

  if (!currentFactor && signIn?.status) {
    return <ErrorCard />;
  }

  if (!currentFactor) {
    return <LoadingCard />;
  }

  switch (currentFactor?.strategy) {
    case 'password':
      return (
        <SignInFactorOnePasswordCard
          signInWithPassword={signInWithPassword}
          onForgotPassword={handleForgotPassword}
        />
      );
    default:
      return <LoadingCard />;
  }
}

export const SignInFactorOne = withCardStateProvider(SignInFactorOneInternal);
