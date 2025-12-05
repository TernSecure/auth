import { useTernSecure } from '@tern-secure/shared/react';
import type { SocialProvider } from '@tern-secure/types';
import React from 'react';

import { useAuthSignIn, useSignInContext, useTernSecureOptions } from '../../ctx';
import { SocialButtons, useCardState } from '../../elements';

export const SignInSocialButtons = () => {
  const signIn = useAuthSignIn();
  const ternSecure = useTernSecure();
  const card = useCardState();
  const ctx = useSignInContext();
  const { afterSignInUrl, socialProviders: signInSocialProviders } = ctx;
  const ternSecureOptions = useTernSecureOptions();

  const socialProviders = signInSocialProviders || ternSecureOptions.socialProviders || [];

  React.useEffect(() => {
    void ctx.checkRedirectResult();
  }, []);

  const signInWithSocialLogin = async (
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
      await ternSecure.createActiveSession({ session: res.user, redirectUrl: afterSignInUrl });
    }
  };

  if (socialProviders.length === 0) {
    return null;
  }

  return (
    <SocialButtons
      onProviderClick={provider => void signInWithSocialLogin(provider)}
      disabled={card.isLoading}
      providers={socialProviders}
    />
  );
};