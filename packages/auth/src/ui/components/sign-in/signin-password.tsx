import { FieldGroup, useAppForm } from '../../elements';
import { FormButton } from '../../utils/form';

interface SignInFormValues {
  email: string;
  password: string;
}

interface SignInPasswordProps {
  onError?: (error: Error) => void;
  isDisabled?: boolean;
  signInWithPassword?: (email: string, password: string) => Promise<void>;
  onForgotPassword?: () => void;
}

export function SignInPassword({
  onError,
  isDisabled,
  signInWithPassword,
  onForgotPassword,
}: SignInPasswordProps) {
  const form = useAppForm({
    defaultValues: {
      email: '',
      password: '',
    } as SignInFormValues,
    validators: {
      onSubmitAsync: async ({ value }) => {
        try {
          if (signInWithPassword) {
            await signInWithPassword(value.email, value.password);
          }
        } catch (error) {
          onError?.(error as Error);
          throw error;
        }
      },
    },
  });

  return (
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
              disabled={form.state.isSubmitting || isDisabled}
              required
            />
          )}
        </form.AppField>

        <form.AppField name='password'>
          {field => (
            <field.TernPasswordField
              label='Password'
              placeholder='Enter your password'
              disabled={form.state.isSubmitting || isDisabled}
              required
              onForgotPassword={onForgotPassword}
            />
          )}
        </form.AppField>

        <FormButton
          canSubmit={form.state.canSubmit}
          isSubmitting={form.state.isSubmitting}
          submitText='Sign in'
          submittingText='Signing in...'
        />
      </FieldGroup>
    </form>
  );
}
