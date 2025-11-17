import { useTernSecure } from '@tern-secure/shared/react';
import type { AuthErrorTree, TernSecureUser } from '@tern-secure/types';
import { createContext, useCallback, useContext, useMemo } from 'react';

import { SIGN_IN_INITIAL_VALUE_KEYS } from '../../../instance/constants';
import { buildURL, RedirectUrls } from '../../../utils';
import type { ParsedQueryString } from '../../router';
import { useRouter } from '../../router';
import type { SignInCtx } from '../../types';
import { useTernSecureOptions } from '../TernSecureOptions';
import { getInitialValuesFromQueryParams } from '../utils';

export type SignInContextType = Omit<SignInCtx, 'fallbackRedirectUrl' | 'forceRedirectUrl'> & {
  onSignInSuccess: (
    user: TernSecureUser,
    options?: { onPreRedirect?: () => Promise<boolean> },
  ) => void;
  handleSignInError: (error: AuthErrorTree) => void;
  redirectAfterSignIn: () => any;
  queryParams: ParsedQueryString;
  signInUrl: string;
  signUpUrl: string;
  afterSignUpUrl: string;
  afterSignInUrl: string;
  checkRedirectResult: () => Promise<void>;
};

export const SignInContext = createContext<SignInCtx | null>(null);

export const useSignInContext = (): SignInContextType => {
  const context = useContext(SignInContext);
  const ternSecure = useTernSecure();
  const { navigate } = useRouter();
  const ternSecureOptions = useTernSecureOptions();
  //const ternSecureOptions = ternSecure._internal_getAllOptions();
  const { queryParams, queryString } = useRouter();

  if (context === null || context.componentName !== 'SignIn') {
    throw new Error(
      'useSignInContext must be used within a SignInProvider. Please wrap your component tree with SignInProvider.',
    );
  }

  const { componentName, ...ctx } = context;
  const initialValuesFromQueryParams = useMemo(
    () => getInitialValuesFromQueryParams(queryString, SIGN_IN_INITIAL_VALUE_KEYS),
    [],
  );

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

  const handleSignInError = useCallback((authError: AuthErrorTree) => {
    console.error(authError);
  }, []);

  const redirectUrls = new RedirectUrls(
    ternSecureOptions,
    {
      ...ctx,
      signInForceRedirectUrl: ctx.signInForceRedirectUrl || ctx.forceRedirectUrl,
      signInFallbackRedirectUrl: ctx.signInFallbackRedirectUrl || ctx.fallbackRedirectUrl,
    },
    queryParams,
  );

  delete ctx.fallbackRedirectUrl;
  delete ctx.forceRedirectUrl;

  const afterSignInUrl = ternSecure.constructUrlWithAuthRedirect(redirectUrls.getAfterSignInUrl());
  const afterSignUpUrl = ternSecure.constructUrlWithAuthRedirect(redirectUrls.getAfterSignUpUrl());

  const redirectAfterSignIn = () => navigate(afterSignInUrl);

  let signInUrl = (ctx.routing === 'path' && ctx.path) || ternSecureOptions.signInUrl;
  let signUpUrl = (ctx.routing === 'path' && ctx.path) || ternSecureOptions.signUpUrl;

  const preservedParams = redirectUrls.getPreservedSearchParams();

  signInUrl = buildURL(
    {
      base: signInUrl,
      hashSearchParams: [queryParams, preservedParams],
    },
    { stringify: true },
  );

  signUpUrl = buildURL(
    {
      base: signUpUrl,
      hashSearchParams: [queryParams, preservedParams],
    },
    { stringify: true },
  );

  /**
   *
   * This function separates session creation from redirection, allowing consumers
   * to perform custom logic between authentication and redirect.
   *
   * Use cases:
   * 1. Check if user exists in external database (e.g., FreeSWITCH VoIP user table)
   * 2. Validate user permissions or roles
   * 3. Perform additional setup or initialization
   * 4. Custom redirect logic based on user data
   * Example:
   *   await onSignInSuccess(user, {
   *     onPreRedirect: async () => {
   *       // user is accessible here via closure
   *       const exists = await checkUser(user.email);
   *       return exists;
   *     }
   *   });
   *
   * @param user - The authenticated TernSecureUser
   * @param options - Configuration options
   * @param options.onPreRedirect - Optional async callback executed before redirect.
   *                                Return false to prevent redirection, true to proceed.
   *                                This is where you can perform DB checks, role validation, etc.
   *                                The user object is accessible via closure.
   *                                If not provided, automatically redirects after session creation.
   */
  const onSignInSuccess = useCallback(
    async (
      user: TernSecureUser,
      options?: {
        onPreRedirect?: () => Promise<boolean>;
      },
    ) => {
      try {
        await ternSecure.createActiveSession({ session: user });

        if (options?.onPreRedirect) {
          try {
            const shouldRedirect = await options.onPreRedirect();

            if (shouldRedirect) {
              redirectAfterSignIn();
            }
            // If shouldRedirect is false, consumer handles redirect manually
          } catch (error) {
            const authError = createAuthError(
              'Pre-redirect validation failed',
              'PRE_REDIRECT_FAILED',
              'PreRedirectError',
              error,
            );
            handleSignInError(authError);
          }
        } else {
          redirectAfterSignIn();
        }
      } catch (error) {
        const authError = createAuthError(
          error instanceof Error ? error.message : 'Failed to create session',
          'SESSION_CREATION_FAILED',
          'SessionError',
          error,
        );
        handleSignInError(authError);
      }
    },
    [ternSecure, createAuthError, handleSignInError, redirectAfterSignIn],
  );

  const checkRedirectResult = useCallback(async (): Promise<void> => {
    try {
      const result = await ternSecure.getRedirectResult();
      if (result && result.success) {
        await onSignInSuccess(result.user);
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
  }, [ternSecure, onSignInSuccess, handleSignInError, createAuthError]);

  return {
    ...(ctx as SignInCtx),
    componentName,
    afterSignInUrl,
    afterSignUpUrl,
    signInUrl,
    signUpUrl,
    queryParams,
    initialValue: { ...ctx.initialValue, ...initialValuesFromQueryParams },
    checkRedirectResult,
    onSignInSuccess,
    handleSignInError,
    redirectAfterSignIn,
  };
};
