'use client';

import type {
  AuthErrorTree,
  SignInForceRedirectUrl,
  SignInProps,
  SignUpForceRedirectUrl,
  TernSecureUser,
} from '@tern-secure/auth';
import { buildURL, RedirectUrls } from '@tern-secure/auth';
import { useTernSecure } from '@tern-secure/shared/react';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo } from 'react';

export type SignInCtx = SignInProps & SignInForceRedirectUrl & SignUpForceRedirectUrl;

interface SignInContextType extends Omit<SignInCtx, 'forceRedirectUrl'> {
  handleSignInSuccess: (user?: TernSecureUser | null, options?: { skipRedirect?: boolean }) => void;
  handleSignInError: (error: AuthErrorTree) => void;
  redirectAfterSignIn: () => void;
  signInUrl: string;
  signUpUrl: string;
  afterSignUpUrl: string;
  afterSignInUrl: string;
  checkRedirectResult: () => Promise<void>;
}

const SignInContext = createContext<SignInContextType>({
  handleSignInSuccess: () => {},
  handleSignInError: () => {},
  redirectAfterSignIn: () => {},
  checkRedirectResult: async () => {},
  signInUrl: '',
  signUpUrl: '',
  afterSignUpUrl: '',
  afterSignInUrl: '',
});

export const useSignInContext = () => useContext(SignInContext);

interface SignInProviderProps extends Partial<SignInCtx> {
  children: ReactNode;
}

export function SignInProvider({
  children,
  onSuccess,
  forceRedirectUrl,
  signInForceRedirectUrl,
  signUpForceRedirectUrl,
  ...ctxProps
}: SignInProviderProps) {
  const context = useSignInContext();
  const ternSecure = useTernSecure();
  const ternSecureOptions = ternSecure._internal_getAllOptions();
  const currentParams = useMemo(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  }, []);

  const createAuthError = useCallback(
    (message: string, code: string, name: string = 'AuthError', response?: any): AuthErrorTree => {
      const authError = new Error(message) as AuthErrorTree;
      authError.name = name;
      authError.code = code;
      authError.response = response;
      return authError;
    },
    [],
  );

  const redirectAfterSignIn = useCallback(() => {
    ternSecure.redirectAfterSignIn();
  }, [ternSecure]);

  const handleSignInSuccess = useCallback(
    (user?: TernSecureUser | null, options?: { skipRedirect?: boolean }) => {
      onSuccess?.(user || null);
      if (!options?.skipRedirect) {
        redirectAfterSignIn();
      }
    },
    [onSuccess, redirectAfterSignIn],
  );

  const handleSignInError = useCallback((authError: AuthErrorTree) => {
    console.error(authError);
  }, []);

  const checkRedirectResult = useCallback(async (): Promise<void> => {
    try {
      const result = await ternSecure.getRedirectResult();
      if (result && result.success) {
        handleSignInSuccess(result.user);
      } else if (result && !result.success) {
        const authError = createAuthError(
          result.message || 'Redirect sign-in failed',
          result.error || 'REDIRECT_FAILED',
          'RedirectError',
          result,
        );
        handleSignInError(authError);
      }
    } catch (error) {
      const authError = createAuthError(
        error instanceof Error ? error.message : 'Failed to check redirect result',
        'REDIRECT_CHECK_FAILED',
        'RedirectError',
        error,
      );
      handleSignInError(authError);
    }
  }, [ternSecure, handleSignInSuccess, handleSignInError, createAuthError]);

  const { ...ctx } = context;

  const redirectUrls = new RedirectUrls(
    ternSecureOptions,
    {
      ...ctx,
      signInForceRedirectUrl: ctx.signInForceRedirectUrl || forceRedirectUrl,
    },
    currentParams,
  );

  const afterSignInUrl = ternSecure.constructUrlWithAuthRedirect(redirectUrls.getAfterSignInUrl());
  const afterSignUpUrl = ternSecure.constructUrlWithAuthRedirect(redirectUrls.getAfterSignUpUrl());

  const preservedParams = redirectUrls.getPreservedSearchParams();
  const baseSignInUrl = ctxProps.path || ternSecureOptions.signInUrl;
  const baseSignUpUrl = ternSecureOptions.signUpUrl;

  const signInUrl = buildURL(
    {
      base: baseSignInUrl,
      hashSearchParams: [currentParams, preservedParams],
    },
    { stringify: true },
  );

  const signUpUrl = buildURL(
    {
      base: baseSignUpUrl,
      hashSearchParams: [currentParams, preservedParams],
    },
    { stringify: true },
  );

  const contextValue: SignInContextType = useMemo(
    () => ({
      handleSignInSuccess,
      handleSignInError,
      redirectAfterSignIn,
      checkRedirectResult,
      signInUrl,
      signUpUrl,
      afterSignUpUrl,
      afterSignInUrl,
      onSuccess,
    }),
    [
      handleSignInSuccess,
      handleSignInError,
      redirectAfterSignIn,
      checkRedirectResult,
      signInUrl,
      signUpUrl,
      afterSignUpUrl,
      afterSignInUrl,
      onSuccess,
    ],
  );

  return <SignInContext.Provider value={contextValue}>{children}</SignInContext.Provider>;
}

export { useTernSecure };
