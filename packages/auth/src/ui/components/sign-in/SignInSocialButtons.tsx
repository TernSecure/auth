import { useTernSecure } from '@tern-secure/shared/react';
import type { SocialProviderOptions } from '@tern-secure/types';

import { useAuthSignIn, useSignInContext } from '../../ctx';
import { SocialButtons, useCardState } from '../../elements';

export const SignInSocialButtons = () => {
  const signIn = useAuthSignIn();
  const ternSecure = useTernSecure();
  const card = useCardState();
  const { afterSignInUrl } = useSignInContext();

  const signInWithSocialLogin = async (
    provider: string,
    customOptions: SocialProviderOptions = { mode: 'popup' },
  ) => {
    const res = await signIn?.authenticateWithSocialProvider(provider, {
      mode: customOptions.mode || 'popup',
      customParameters: customOptions.customParameters,
      scopes: customOptions.scopes,
    });

    if (res?.status === 'error') {
      card.setError({
        status: 'error',
        message: res.message,
        error: res.error,
      });
    }

    if (res?.status === 'success') {
      await ternSecure.createActiveSession({ session: res.user, redirectUrl: afterSignInUrl });
    }
  };

  return (
    <SocialButtons
      onProviderClick={provider => void signInWithSocialLogin(provider)}
      disabled={card.isLoading}
    />
  );
};