import { createFormHook, createFormHookContexts } from '@tanstack/react-form';

import { Button } from '../elements/button';
import { TernEmailField, TernPasswordField, TernTextField } from './FieldControl';
import { EmailField, PasswordField } from './FieldLabelControl';

const { fieldContext, useFieldContext, formContext, useFormContext } = createFormHookContexts();

const SubscribeButton = ({ label }: { label: string }) => {
  const form = useFormContext();
  return (
    <form.Subscribe selector={state => state.isSubmitting}>
      {isSubmitting => <Button disabled={isSubmitting}>{label}</Button>}
    </form.Subscribe>
  );
};

const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    EmailField,
    PasswordField,
    TernEmailField,
    TernPasswordField,
    TernTextField,
  },
  formComponents: {
    SubscribeButton,
  },
});

export { fieldContext, useFieldContext, formContext, useAppForm, withForm, useFormContext };
