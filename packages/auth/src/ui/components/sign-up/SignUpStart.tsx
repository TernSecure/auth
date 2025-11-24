import { useTernSecure } from '@tern-secure/shared/react';
import type { SignUpFormValues } from '@tern-secure/types';

import { cn } from '../../../lib/utils';
import { useAuthSignUp, useSignUpContext } from '../../ctx';
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FieldDescription,
  FieldGroup,
  FieldSeparator,
  useAppForm,
  useCardState,
  withCardStateProvider,
} from '../../elements';
import { useRouter } from '../../router';
import { FormButton } from '../../utils/form';
import { SignUpSocialButtons } from './SignUpSocialButtons';
import { completeSignUpFlow } from './util';

function SignUpStartInternal(): React.JSX.Element {
  const signUp = useAuthSignUp();
  const card = useCardState();
  const { navigate } = useRouter();
  const ctx = useSignUpContext();
  const { afterSignUpUrl, signInUrl, shouldShowForm = true } = ctx;
  const { createActiveSession } = useTernSecure();

  const defaultValues: SignUpFormValues = {
    email: '',
    password: '',
  };

  const form = useAppForm({
    defaultValues,
    validators: {
      onSubmitAsync: async ({ value }) => {
        return await signUpWithPassword(value.email, value.password);
      },
    },
  });

  const signUpWithPassword = async (email: string, password: string): Promise<void> => {
    if (!signUp) return;
    const res = await signUp.withEmailAndPassword({ email, password });

    if (res.status === 'error') {
      card.setError({
        status: 'error',
        message: res.message,
        error: res.error,
      });
      return;
    }

    const redirectUrlComplete = ctx.afterSignUpUrl || '/';
    await completeSignUpFlow({
      signUp: res,
      verifyEmailPath: 'verify-email-address',
      handleComplete: async () =>
        createActiveSession({ session: res.user, redirectUrl: afterSignUpUrl }),
      navigate,
      redirectUrlComplete,
    });
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
            {card.error && (
              <Alert
                variant='destructive'
                className='animate-in fade-in-50'
              >
                <AlertDescription>{card.error.message}</AlertDescription>
              </Alert>
            )}

            <form
              onSubmit={e => {
                e.preventDefault();
                e.stopPropagation();
                void form.handleSubmit();
              }}
            >
              <FieldGroup>
                {shouldShowForm && (
                  <>
                    <form.AppField name='email'>
                      {field => (
                        <field.TernEmailField
                          label='Email'
                          placeholder='Enter your email'
                          required
                        />
                      )}
                    </form.AppField>

                    <form.AppField name='password'>
                      {field => (
                        <field.TernPasswordField
                          label='Password'
                          placeholder='Enter your password'
                          required
                        />
                      )}
                    </form.AppField>
                    <FormButton
                      canSubmit={form.state.canSubmit}
                      isSubmitting={form.state.isSubmitting}
                      submitText='Continue'
                      submittingText='Creating Account...'
                    />
                    <FieldSeparator>Or continue with</FieldSeparator>
                  </>
                )}
                <SignUpSocialButtons />
              </FieldGroup>
            </form>
          </CardContent>
          <FieldDescription className='text-center'>
            Already have an account? <a href={signInUrl}>Sign In</a>
          </FieldDescription>
        </Card>
      </div>
    </div>
  );
}

export const SignUpStart = withCardStateProvider(SignUpStartInternal);
