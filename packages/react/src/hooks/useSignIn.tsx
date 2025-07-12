"use client"

import { useCallback } from 'react';
import { useAssertWrappedByTernSecureAuthProvider } from './useAssertWrappedTernSecureProvider'
import type { 
  SignInResource,
  SignInFormValuesTree,
  SignInResponseTree,
  ResendEmailVerification
} from '@tern-secure/types'
import { useAuthSignInCtx} from '../ctx/TernSecureAuthResourcesCtx'

/**
 * Hook to access the SignInResource methods from TernSecureAuth
 * Provides type-safe access to all sign-in related functionality
 */
export const useSignIn = (): SignInResource => {
  useAssertWrappedByTernSecureAuthProvider('useSignIn');
  const auth = useAuthSignInCtx();

  if (!auth) {
    throw new Error('SignIn methods not available - auth not initialized');
  }


  return {
    status: auth.status,

    withEmailAndPassword: useCallback(
      async (params: SignInFormValuesTree): Promise<SignInResponseTree> => {
        return auth.withEmailAndPassword(params);
      },
      [auth]
    ),

    withSocialProvider: useCallback(
      async (provider: string, options?: { mode?: 'popup' | 'redirect' }): Promise<SignInResponseTree | void> => {
        return auth.withSocialProvider(provider, options);
      },
      [auth]
    ),

    completeMfaSignIn: useCallback(
      async (mfaToken: string, mfaContext?: any): Promise<SignInResponseTree> => {
        return auth.completeMfaSignIn(mfaToken, mfaContext);
      },
      [auth]
    ),

    sendPasswordResetEmail: useCallback(
      async (email: string): Promise<void> => {
        return auth.sendPasswordResetEmail(email);
      },
      [auth]
    ),

    resendEmailVerification: useCallback(
      async (): Promise<ResendEmailVerification> => {
        return auth.resendEmailVerification();
      },
      [auth]
    ),

    checkRedirectResult: useCallback(
      async (): Promise<SignInResponseTree | null> => {
        return auth.checkRedirectResult();
      },
      [auth]
    ),
  };
};


export const signIn = {
  withEmailAndPassword: async (params: SignInFormValuesTree): Promise<SignInResponseTree> => {
    const auth = useAuthSignInCtx();
    return auth.withEmailAndPassword(params);
  },

  withSocialProvider: async (
    provider: string, 
    options?: { mode?: 'popup' | 'redirect' }
  ): Promise<SignInResponseTree | void> => {
    const auth = useAuthSignInCtx();
    return auth.withSocialProvider(provider, options);
  },

  resendEmailVerification: async (): Promise<ResendEmailVerification> => {
    const auth = useAuthSignInCtx();
    return auth.resendEmailVerification();
  },

  checkRedirectResult: async (): Promise<SignInResponseTree | null> => {
    const auth = useAuthSignInCtx();
    return auth.checkRedirectResult();
  }
};

