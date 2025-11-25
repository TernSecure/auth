import { useTernSecure } from '@tern-secure/shared/react';
import type { SignUpFormValues } from '@tern-secure/types';

import { cn } from '../../../lib/utils';
import { useTernSecureOptions } from '../../ctx';
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
  const { appName } = useTernSecureOptions();

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
            <CardTitle>{appName ? `Create your ${appName} account` : 'Create your account'}</CardTitle>
            <CardDescription className={cn('text-muted-foreground')}>
              {shouldShowForm
                ? 'Welcome! Please fill in the details to get started.'
                : 'Welcome! Please sign up to continue.'}
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

            <FieldGroup>
              {shouldShowForm && (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    void form.handleSubmit();
                  }}
                  className="flex flex-col gap-7"
                >
                  <form.Subscribe
                    selector={state => [state.canSubmit, state.isSubmitting]}
                  >
                    {([canSubmit, isSubmitting]) => (
                      <>
                        <form.AppField name='email'>
                          {field => (
                            <field.TernEmailField
                              label='Email'
                              placeholder='Enter your email'
                              disabled={isSubmitting || card.isLoading}
                              required
                            />
                          )}
                        </form.AppField>

                        <form.AppField name='password'>
                          {field => (
                            <field.TernPasswordField
                              label='Password'
                              placeholder='Enter your password'
                              disabled={isSubmitting || card.isLoading}
                              required
                            />
                          )}
                        </form.AppField>
                        <FormButton
                          canSubmit={canSubmit}
                          isSubmitting={isSubmitting}
                          submitText='Continue'
                          submittingText='Creating Account...'
                        />
                        <FieldSeparator>Or continue with</FieldSeparator>
                      </>
                    )}
                  </form.Subscribe>
                </form>
              )}
              <SignUpSocialButtons />
            </FieldGroup>
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
