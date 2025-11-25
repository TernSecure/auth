'use client';

import type {
  SignInPasswordParams,
  SignInResponse,
  SignInVerificationResponse,
  SocialProviderOptions,
  UseSignInReturn,
} from '@tern-secure/types';

import { useAuthSignInCtx } from '../ctx/TernSecureAuthResourcesCtx';
import { useAssertWrappedByTernSecureAuthProvider } from './useAssertWrappedTernSecureProvider';

/**
 * Hook to access the SignInResource methods from TernSecureAuth
 * Provides type-safe access to all sign-in related functionality
 */
export const useSignIn = (): UseSignInReturn => {
  useAssertWrappedByTernSecureAuthProvider('useSignIn');
  const auth = useAuthSignInCtx();

  if (!auth) {
    return {
      isLoaded: false,
      signIn: undefined,
    };
  }

  return {
    isLoaded: true,
    signIn: auth,
  };
};

export const signIn = {
  authenticateWithPasswordd: async (params: SignInPasswordParams): Promise<SignInResponse> => {
    const auth = useAuthSignInCtx();
    if (!auth) {
      throw new Error('SignIn methods not available - auth not initialized');
    }
    return auth.authenticateWithPassword(params);
  },

  authenticateWithSocialProvider: async (
    provider: string,
    customOptions: SocialProviderOptions,
  ): Promise<SignInResponse | void> => {
    const auth = useAuthSignInCtx();
    if (!auth) {
      throw new Error('SignIn methods not available - auth not initialized');
    }
    return auth.authenticateWithSocialProvider(provider, customOptions);
  },

  attemptEmailVerification: async (): Promise<SignInVerificationResponse> => {
    const auth = useAuthSignInCtx();
    if (!auth) {
      throw new Error('SignIn methods not available - auth not initialized');
    }
    return auth.attemptEmailVerification();
  },

  checkRedirectResult: async (): Promise<SignInResponse | null> => {
    const auth = useAuthSignInCtx();
    if (!auth) {
      throw new Error('SignIn methods not available - auth not initialized');
    }
    return auth.checkRedirectResult();
  },
};
