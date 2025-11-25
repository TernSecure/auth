import type { SignUpFormValues } from '@tern-secure/types';

import { FieldGroup, FieldSeparator, useAppForm } from '../../elements';
import { FormButton } from '../../utils/form';
import { SignUpSocialButtons } from './SignUpSocialButtons';

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
                    disabled={isSubmitting}
                    required
                  />
                )}
              </form.AppField>

              <form.AppField name='password'>
                {field => (
                  <field.TernPasswordField
                    label='Password'
                    placeholder='Enter your password'
                    disabled={isSubmitting}
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
      <SignUpSocialButtons />
    </FieldGroup>
  );
};
