import { createFormHook, createFormHookContexts } from '@tanstack/react-form';

import { Button } from '../elements/button';
import { TernEmailField, TernPasswordField } from './FieldControl';
import { EmailField, PasswordField } from './FieldLabelControl';

const { fieldContext, useFieldContext, formContext, useFormContext } = createFormHookContexts();

export function SubscribeButton({ label }: { label: string }) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={state => state.isSubmitting}>
      {isSubmitting => <Button disabled={isSubmitting}>{label}</Button>}
    </form.Subscribe>
  );
}

// Create base form hook with contexts
const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    EmailField,
    PasswordField,
    TernEmailField,
    TernPasswordField,
  },
  formComponents: {
    SubscribeButton,
  },
});

// Export only the essential hooks and contexts for form usage
export { fieldContext, useFieldContext, formContext, useAppForm, withForm, useFormContext };
