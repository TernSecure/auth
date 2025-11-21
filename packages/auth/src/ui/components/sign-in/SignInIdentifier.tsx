import { useMemo } from 'react';

import type { SignInStartIdentifier } from '../../common';
import { getIdentifiers } from '../../common';
import { FieldGroup, useAppForm, useCardState } from '../../elements';
import { FormButton } from '../../utils/form';

const buildDefaultValues = (
  identifier: SignInStartIdentifier | undefined,
  includePassword: boolean,
): Record<string, string> => {
  const defaults: Record<string, string> = {};

  if (identifier === 'phone_number') {
    defaults.phoneNumber = '';
  } else {
    defaults.email = '';
  }

  if (includePassword) {
    defaults.password = '';
  }

  return defaults;
};

interface SignInIdentifierProps {
  onError?: (error: Error) => void;
  isDisabled?: boolean;
  onSubmit?: (values: Record<string, string>) => void;
  identifierAttribute?: SignInStartIdentifier;
  initialValue?: string;
}

export const SignInIdentifier = (props: SignInIdentifierProps) => {
    const card = useCardState();
  const { onError, onSubmit, identifierAttribute = 'email_address', initialValue } = props;

  const { fieldName, label, placeholder } = useMemo(
    () => getIdentifiers(identifierAttribute),
    [identifierAttribute],
  );

  const form = useAppForm({
    defaultValues: {
      ...buildDefaultValues(identifierAttribute, false),
      [fieldName]: initialValue || '',
    },
    validators: {
      onSubmitAsync: ({ value }) => {
        try {
          onSubmit?.(value);
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
        <form.AppField name={fieldName}>
          {field => {
            if (identifierAttribute === 'phone_number') {
              return (
                <field.TernTextField
                  label={label}
                  placeholder={placeholder}
                  disabled={form.state.isSubmitting || props.isDisabled}
                  required
                />
              );
            }
            return (
              <field.TernEmailField
                label={label}
                placeholder={placeholder}
                disabled={form.state.isSubmitting || props.isDisabled}
                required
              />
            );
          }}
        </form.AppField>
        <FormButton
          canSubmit={form.state.canSubmit}
          isSubmitting={form.state.isSubmitting}
          submitText='Continue'
          submittingText='Signing in...'
        />
      </FieldGroup>
    </form>
  );
};
