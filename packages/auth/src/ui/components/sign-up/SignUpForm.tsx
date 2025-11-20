import type { SignUpFormValues } from '@tern-secure/types';

import { FieldGroup, useAppForm } from '../../elements';
import { FormButton } from '../../utils/form';

type SignUpFormProps = {
  signUpWithPassword: (email: string, password: string) => Promise<void> | void;
};

export const SignUpForm = (props: SignUpFormProps) => {
  const { signUpWithPassword } = props;
  const form = useAppForm({
    defaultValues: {
      email: '',
      password: '',
    } as SignUpFormValues,
    validators: {
      onSubmitAsync: async ({ value }) => {
        if (signUpWithPassword) {
          await signUpWithPassword(value.email, value.password);
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
      </FieldGroup>
    </form>
  );
};
