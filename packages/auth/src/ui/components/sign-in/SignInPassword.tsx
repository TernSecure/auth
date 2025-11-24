import type { SignInPasswordParams } from '@tern-secure/types';

import { FieldGroup, FieldSeparator, useAppForm } from '../../elements';
import { FormButton } from '../../utils/form';
import { SignInSocialButtons } from './SignInSocialButtons';

interface SignInPasswordProps {
  onError?: (error: Error) => void;
  isDisabled?: boolean;
  signInWithPassword?: (email: string, password: string) => Promise<void>;
  onForgotPassword?: () => void;
}

const defaultValues: SignInPasswordParams = {
  email: '',
  password: '',
};

export const SignInPassword = (props: SignInPasswordProps) => {
  const { onError, isDisabled, signInWithPassword, onForgotPassword } = props;
  const form = useAppForm({
    defaultValues,
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
    <FieldGroup>
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
                    disabled={isSubmitting || isDisabled}
                    required
                  />
                )}
              </form.AppField>

              <form.AppField name='password'>
                {field => (
                  <field.TernPasswordField
                    label='Password'
                    placeholder='Enter your password'
                    disabled={isSubmitting || isDisabled}
                    required
                    onForgotPassword={onForgotPassword}
                  />
                )}
              </form.AppField>

              <FormButton
                canSubmit={canSubmit}
                isSubmitting={isSubmitting}
                submitText='Sign In'
                submittingText='Signing in...'
              />
              <FieldSeparator>Or continue with</FieldSeparator>
            </>
          )}
        </form.Subscribe>
      </form>
      <SignInSocialButtons />
    </FieldGroup>
  );
};
