import { useTernSecure } from '@tern-secure/shared/react';
import type {
  AuthErrorTree,
  SignInPropsTree,
  SignInUIConfig,
} from '@tern-secure/types';

import { cn } from '../../../lib/utils';
import { useAuthSignIn } from '../../ctx';
import { useSignInContext } from '../../ctx/components/SignIn';
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardStateProvider,
  CardTitle,
  useCardState,
} from '../../elements';
import { useRouter } from '../../router';
import { SignInPassword } from './SignInPassword';

interface SignInStartProps {
  socialButtonsConfig?: SignInUIConfig['socialButtons'];
  ui?: SignInPropsTree['ui'];
  className?: string;
}

export type SessionErrorCode =
  | 'ENDPOINT_NOT_FOUND'
  | 'COOKIE_SET_FAILED'
  | 'API_REQUEST_FAILED'
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'
  | 'UNKNOWN_ERROR';

export interface SessionError {
  code: SessionErrorCode;
  message: string;
  original?: unknown;
}

function SignInStartInternal({ socialButtonsConfig, ui, className }: SignInStartProps) {
  const signIn = useAuthSignIn();
  const cardState = useCardState();
  const { navigate } = useRouter();
  const { afterSignInUrl, onSignInSuccess } = useSignInContext();
  const { createActiveSession } = useTernSecure();

  const signInWithPassword = async (email: string, password: string) => {
    const res = await signIn?.withEmailAndPassword({ email, password });
    if (res?.status === 'error') {
      cardState.setError({
        status: 'error',
        message: res.message,
        error: res.error,
      });
    }
    if (res?.status === 'success') {
      await createActiveSession({ session: res.user, redirectUrl: afterSignInUrl });
    }
  };
 
  const handleForgotPassword = () => {
    void navigate('reset-password');
  };

  const handleError = (error: AuthErrorTree) => {
    cardState.setError(error);
  };

  const { appName, logo } = ui || {};

  return (
    <div className="relative flex justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
      <Card className={cn('w-full max-w-md mt-8', className)}>
        <CardHeader className="space-y-1 text-center">
          {logo && (
            <div className='mb-6 flex justify-center'>
              <img
                src={logo}
                alt={appName ? `${appName} Logo` : 'Application Logo'}
                className='h-16 w-auto'
              />
            </div>
          )}
          <CardTitle className={cn('font-bold')}>Sign in to {appName || 'your account'}</CardTitle>
          <CardDescription className={cn('text-muted-foreground')}>
            Please sign in to continue
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {cardState.error && (
            <Alert
              variant='destructive'
              className='animate-in fade-in-50'
            >
              <AlertDescription>{cardState.error.message}</AlertDescription>
            </Alert>
          )}
          <SignInPassword
            signInWithPassword={signInWithPassword}
            onError={handleError}
            isDisabled={cardState.isLoading}
            onForgotPassword={handleForgotPassword}
          />
        </CardContent>
      </Card>
    </div>
    </div>
  );
}

export const SignInStart = () => {
  return (
    <CardStateProvider>
      <SignInStartInternal />
    </CardStateProvider>
  );
};
