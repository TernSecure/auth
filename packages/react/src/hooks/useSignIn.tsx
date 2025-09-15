"use client";

import type {
  ResendEmailVerification,
  SignInFormValuesTree,
  SignInResponseTree,
  UseSignInReturn,
} from "@tern-secure/types";

import { useAuthSignInCtx } from "../ctx/TernSecureAuthResourcesCtx";
import { useAssertWrappedByTernSecureAuthProvider } from "./useAssertWrappedTernSecureProvider";

/**
 * Hook to access the SignInResource methods from TernSecureAuth
 * Provides type-safe access to all sign-in related functionality
 */
export const useSignIn = (): UseSignInReturn => {
  useAssertWrappedByTernSecureAuthProvider("useSignIn");
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
  withEmailAndPassword: async (
    params: SignInFormValuesTree
  ): Promise<SignInResponseTree> => {
    const auth = useAuthSignInCtx();
    if (!auth) {
      throw new Error("SignIn methods not available - auth not initialized");
    }
    return auth.withEmailAndPassword(params);
  },

  withSocialProvider: async (
    provider: string,
    options?: { mode?: "popup" | "redirect" }
  ): Promise<SignInResponseTree | void> => {
    const auth = useAuthSignInCtx();
    if (!auth) {
      throw new Error("SignIn methods not available - auth not initialized");
    }
    return auth.withSocialProvider(provider, options);
  },

  resendEmailVerification: async (): Promise<ResendEmailVerification> => {
    const auth = useAuthSignInCtx();
    if (!auth) {
      throw new Error("SignIn methods not available - auth not initialized");
    }
    return auth.resendEmailVerification();
  },

  checkRedirectResult: async (): Promise<SignInResponseTree | null> => {
    const auth = useAuthSignInCtx();
    if (!auth) {
      throw new Error("SignIn methods not available - auth not initialized");
    }
    return auth.checkRedirectResult();
  },
};
