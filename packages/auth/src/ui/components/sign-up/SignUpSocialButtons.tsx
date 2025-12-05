import { useTernSecure } from '@tern-secure/shared/react';
import type { SocialProvider } from '@tern-secure/types';

import { useAuthSignIn, useSignUpContext, useTernSecureOptions } from '../../ctx';
import { SocialButtons, useCardState } from '../../elements';

export const SignUpSocialButtons = () => {
  const signIn = useAuthSignIn();
  const ternSecure = useTernSecure();
  const card = useCardState();
  const { afterSignUpUrl, socialProviders: signUpSocialProviders } = useSignUpContext();
  const ternSecureOptions = useTernSecureOptions();

  const socialProviders = signUpSocialProviders || ternSecureOptions.socialProviders || [];

  const signUpWithSocialLogin = async (
    provider: SocialProvider,
  ) => {
    const customOptions = provider.options || { mode: 'popup' };
    const res = await signIn?.authenticateWithSocialProvider(provider.name, {
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
      await ternSecure.createActiveSession({ session: res.user, redirectUrl: afterSignUpUrl });
    }
  };

  if (socialProviders.length === 0) {
    return null;
  }

  return (
    <SocialButtons
      onProviderClick={provider => void signUpWithSocialLogin(provider)}
      disabled={card.isLoading}
      providers={socialProviders}
    />
  );
};
