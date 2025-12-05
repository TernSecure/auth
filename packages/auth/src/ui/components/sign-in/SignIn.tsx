import { useTernSecure } from '@tern-secure/shared/react';
import type { SignInModalProps, SignInProps } from '@tern-secure/types';
import React from 'react';

import { normalizeRoutingOptions } from '../../../utils/normalizeRoutingOptions';
import { SignInContext, SignUpContext, useSignInContext } from '../../ctx';
import { Route, Switch } from '../../router';
import type { SignUpCtx } from '../../types';
import { PasswordReset } from './ResetPassword';
import { PasswordResetSuccess } from './ResetPasswordSuccess';
import { SignInFactorOne } from './SignInFactorOne';
import { SignInStart } from './SignInStart';
import { SignInVerifyEmail } from './SignInVerifyEmail';

function RedirectToSignIn() {
  const ternSecure = useTernSecure();
  React.useEffect(() => {
    void ternSecure.redirectToSignIn();
  }, []);
  return null;
}

function SignInRoutes(): React.JSX.Element {
  return (
    <div className="tern tern:w-full tern:min-h-full">
      <Switch>
        <Route path='reset-password'>
          <PasswordReset />
        </Route>
        <Route path='reset-password-success'>
          <PasswordResetSuccess />
        </Route>
        <Route path='factor-one'>
          <SignInFactorOne />
        </Route>
        <Route
          path='verify-email-address'
          canActivate={ternsecure => !!ternsecure.signIn?.identifier}
        >
          <SignInVerifyEmail />
        </Route>
        <Route index>
          <SignInStart />
        </Route>
        <Route>
          <RedirectToSignIn />
        </Route>
      </Switch>
    </div>
  );
}

function SignInRoot() {
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

export const SignIn: React.ComponentType<SignInProps> = SignInRoot;

export const SignInModal = (props: SignInModalProps): React.JSX.Element => {
  return (
    <Route path='sign-in'>
      <SignInContext.Provider
        value={{
          componentName: 'SignIn',
          ...props,
          routing: 'virtual',
          mode: 'modal',
        }}
      >
        <div>
          <SignIn
            {...props}
            routing='virtual'
          />
        </div>
      </SignInContext.Provider>
    </Route>
  );
};
