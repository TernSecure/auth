import { useTernSecure } from '@tern-secure/shared/react';
import { createContext, useContext, useMemo } from 'react';

import { SIGN_UP_INITIAL_VALUE_KEYS} from '../../../instance/constants';
import { buildURL } from '../../../utils';
import { RedirectUrls } from '../../../utils/redirectUrls';
import type { ParsedQueryString } from '../../router';
import { useRouter } from '../../router';
import type { SignUpCtx } from '../../types';
import { useTernSecureOptions } from '../TernSecureOptions';
import { getInitialValuesFromQueryParams } from '../utils';


export type SignUpContextType = Omit<SignUpCtx, 'fallbackRedirectUrl' | 'forceRedirectUrl'> & {
  navigateAfterSignUp: () => any;
  queryParams: ParsedQueryString;
  authQueryString: string | null;
  signInUrl: string;
  signUpUrl: string;
  afterSignUpUrl: string;
  afterSignInUrl: string;
};

export const SignUpContext = createContext<SignUpCtx | null>(null);

export const useSignUpContext = (): SignUpContextType => {
  const context = useContext(SignUpContext);
  const { navigate } = useRouter();
  const { queryParams, queryString } = useRouter();
  const options = useTernSecureOptions();
  const ternSecure = useTernSecure();

  const initialValuesFromQueryParams = useMemo(
    () => getInitialValuesFromQueryParams(queryString, SIGN_UP_INITIAL_VALUE_KEYS),
    [],
  );


  if (!context || context.componentName !== 'SignUp') {
    throw new Error('useSignUpContext called outside of the mounted SignUp component.');
  }

  const { componentName, mode, ...ctx } = context;

  const redirectUrls = new RedirectUrls(
    options,
    {
      ...ctx,
      signUpFallbackRedirectUrl: ctx.signUpFallbackRedirectUrl || ctx.fallbackRedirectUrl,
      signUpForceRedirectUrl: ctx.signUpForceRedirectUrl || ctx.forceRedirectUrl,
    },
    queryParams,
    mode
  );

  delete ctx.fallbackRedirectUrl;
  delete ctx.forceRedirectUrl;

  const afterSignUpUrl = ternSecure.constructUrlWithAuthRedirect(redirectUrls.getAfterSignInUrl());
  const afterSignInUrl = ternSecure.constructUrlWithAuthRedirect(redirectUrls.getAfterSignInUrl());

  const navigateAfterSignUp = () => navigate(afterSignUpUrl);


  let signUpUrl = (ctx.routing === 'path' && ctx.path) || options.signUpUrl;
  let signInUrl = ctx.signInUrl || options.signInUrl;


  const preservedParams = redirectUrls.getPreservedSearchParams();
  signInUrl = buildURL({ base: signInUrl, hashSearchParams: [queryParams, preservedParams] }, { stringify: true });
  signUpUrl = buildURL({ base: signUpUrl, hashSearchParams: [queryParams, preservedParams] }, { stringify: true });

  const authQueryString = redirectUrls.toSearchParams().toString();

  return {
    ...ctx,
    componentName,
    signInUrl,
    signUpUrl,
    afterSignUpUrl,
    afterSignInUrl,
    navigateAfterSignUp,
    queryParams,
    initialValues: { ...ctx.initialValues, ...initialValuesFromQueryParams },
    authQueryString,
  };
};
