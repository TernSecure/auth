import type { AuthErrorTree } from '@tern-secure/types';

import { cn } from '../../../lib/utils';
import { useAuthSignIn } from '../../ctx';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardStateProvider,
  CardTitle,
  FieldGroup,
  useAppForm,
  useCardState,
} from '../../elements';
import { useRouter } from '../../router';

interface ResetPasswordFormValues {
  email: string;
}

function PasswordResetInternal() {
  const signIn = useAuthSignIn();
  const cardState = useCardState();
  const { navigate } = useRouter();

  const form = useAppForm({
    defaultValues: {
      email: '',
    } as ResetPasswordFormValues,
    validators: {
      onSubmitAsync: async ({ value }) => {
        try {
          await signIn?.sendPasswordResetEmail(value.email);

          void navigate('../reset-password-success');
        } catch (error) {
          cardState.setError({
            status: 'error',
            name: 'ResetPasswordError',
            message: (error as Error).message || 'Failed to send reset email',
            error: error,
          } as AuthErrorTree);
          throw error;
        }
      },
    },
  });

  const handleCancel = () => {
    void navigate('../');
  };

  return (
    <div className='tern:relative tern:flex tern:justify-center tern:p-6 tern:md:p-10'>
      <Card className={cn('tern:mt-8 tern:w-full tern:max-w-md')}>
        <CardHeader className='tern:space-y-1'>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Enter your email address and we&apos;ll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cardState.error && (
            <Alert
              variant='destructive'
              className='tern:animate-in tern:fade-in-50 tern:mb-4'
            >
              <AlertDescription>{cardState.error.message}</AlertDescription>
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
              <form.AppField name='email'>
                {field => (
                  <field.TernEmailField
                    label='Email'
                    placeholder='Enter your email'
                    disabled={form.state.isSubmitting}
                    required
                  />
                )}
              </form.AppField>

              <div className='tern:flex tern:gap-3'>
                <Button
                  type='submit'
                  disabled={!form.state.canSubmit || form.state.isSubmitting}
                  className='tern:flex-1'
                >
                  {form.state.isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleCancel}
                  disabled={form.state.isSubmitting}
                  className='tern:flex-1'
                >
                  Cancel
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export const PasswordReset = () => {
  return (
    <CardStateProvider>
      <PasswordResetInternal />
    </CardStateProvider>
  );
};
