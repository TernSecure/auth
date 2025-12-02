import { useTernSecure } from '@tern-secure/shared/react';
import type { SignUpModalProps } from '@tern-secure/types';
import React from 'react';

import { SignUpContext } from '../../ctx';
import { Route, Switch } from '../../router';
import type { SignUpProps } from '../../types';
import { SignUpStart } from './SignUpStart';
import { SignUpVerifyEmail } from './SignUpVerifyEmail';

function RedirectToSignUp() {
  const ternSecure = useTernSecure();
  React.useEffect(() => {
    void ternSecure.redirectToSignUp();
  }, []);
  return null;
}

function SignUpRoutes(): React.JSX.Element {
  return (
    <div className="tern-secure-auth">
      <Switch>
        <Route
          path='verify-email-address'
          canActivate={ternsecure => !!ternsecure.signUp?.user?.email}
        >
          <SignUpVerifyEmail />
        </Route>
        <Route index>
          <SignUpStart />
        </Route>
        <Route>
          <RedirectToSignUp />
        </Route>
      </Switch>
    </div>
  );
}

SignUpRoutes.displayName = 'SignUp';

export const SignUp: React.ComponentType<SignUpProps> = SignUpRoutes;

export const SignUpModal = (props: SignUpModalProps): React.JSX.Element => {
  return (
    <Route path='sign-up'>
      <SignUpContext.Provider
        value={{
          componentName: 'SignUp',
          ...props,
          routing: 'virtual',
          mode: 'modal',
        }}
      >
        <div>
          <SignUp
            {...props}
            routing='virtual'
          />
        </div>
      </SignUpContext.Provider>
    </Route>
  );
};

export { SignUpStart, SignUpVerifyEmail};
