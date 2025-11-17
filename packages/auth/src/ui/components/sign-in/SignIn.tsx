import { useTernSecure } from '@tern-secure/shared/react';
import type { SignInModalProps, SignInProps } from '@tern-secure/types';
import React from 'react';

import { SignInContext, SignUpContext } from '../../ctx';
import { Route, Switch, useRouter } from '../../router';
import { PasswordResetSuccess } from './password-reset-success';
import { PasswordReset } from './ResetPassword';
import { SignInStart } from './sign-in-start';
import { useSignInContext } from '../../ctx';
import { normalizeRoutingOptions } from '../../../utils/normalizeRoutingOptions';
import type { SignUpCtx } from '../../types';

function RedirectToSignIn() {
  const ternSecure = useTernSecure();
  React.useEffect(() => {
    void ternSecure.redirectToSignIn();
  }, []);
  return null;
}

function SignInRoutes(): React.JSX.Element {
  return (
    <Switch>
      <Route path='reset-password'>
        <PasswordReset />
      </Route>
      <Route path='password-reset-success'>
        <PasswordResetSuccess />
      </Route>
      <Route index>
        <SignInStart />
      </Route>
      <Route>
        <RedirectToSignIn />
      </Route>
    </Switch>
  );
}

function SignInRoot() {
  const { navigate, indexPath } = useRouter();

  const signInContext = useSignInContext();
  const normalizedSignUpContext = {
    componentName: 'SignUp',
    forceRedirectUrl: signInContext.signUpForceRedirectUrl,
    fallbackRedirectUrl: signInContext.signUpFallbackRedirectUrl,
    signInUrl: signInContext.signInUrl,
    ...normalizeRoutingOptions({ routing: signInContext?.routing, path: signInContext?.path }),
  } as SignUpCtx;
  return (
    <SignUpContext.Provider value={normalizedSignUpContext}>
      <SignInRoutes />
    </SignUpContext.Provider>
  );
}

SignInRoutes.displayName = 'SignIn';

export const SignIn: React.ComponentType<SignInProps> = SignInRoutes;

export const SignInModal = (props: SignInModalProps): React.JSX.Element => {
  return (
    <Route path='sign-in'>
      <SignInContext.Provider
        value={{
          componentName: 'SignIn',
          ...props,
          routing: 'virtual',
        }}
      >
        <SignInRoutes />
      </SignInContext.Provider>
    </Route>
  );
};
