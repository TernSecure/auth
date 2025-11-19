import { useTernSecure } from '@tern-secure/shared/react';

import { cn } from '../../../lib/utils';
import { useAuthSignUp, useSignUpContext } from '../../ctx';
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardStateProvider,
  CardTitle,
  FieldDescription,
  useCardState,
} from '../../elements';
import { SignUpForm } from './SignUpForm';

function SignUpStartInternal(): React.JSX.Element {
  const signUp = useAuthSignUp();
  const cardState = useCardState();
  const ternSecure = useTernSecure();
  const ctx = useSignUpContext();
  const { signInUrl } = ctx;

  const signUpWithPassword = async (email: string, password: string) => {
    const res = await signUp?.withEmailAndPassword({ email, password });
    if (res?.status === 'error') {
      cardState.setError({
        status: 'error',
        message: res.message,
        error: res.error,
      });
    }

    if (res?.status === 'complete') {
      console.log('Sign up successful');
      //createActiveSession({ session: res.user, redirectUrl: afterSignUpUrl });
    }
  };

  return (
    <div className='relative flex justify-center p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <Card className={cn('mt-8 w-full max-w-md')}>
          <CardHeader className='space-y-1 text-center'>
            <CardTitle>Create Account</CardTitle>
            <CardDescription className={cn('text-muted-foreground')}>
              Please sign up to continue
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
            <SignUpForm
               signUpWithPassword={signUpWithPassword}
            />
          </CardContent>
            <FieldDescription className='text-center'>
              Already have an account?{' '}
              <a
                href={signInUrl}
              >
                Sign In
              </a>
            </FieldDescription>
        </Card>
      </div>
    </div>
  );
}

export const SignUpStart = () => {
  return (
    <CardStateProvider>
      <SignUpStartInternal />
    </CardStateProvider>
  );
};
