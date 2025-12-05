import React from 'react';

import { Field as FieldCn, FieldError, FieldLabel, Input } from '../elements';
import { Eye, EyeOff } from '../icons';
import { useFieldContext } from './Form';

export interface FieldProps {
  field?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export interface PasswordFieldProps extends FieldProps {
  onForgotPassword?: () => void;
}

export interface OTPFieldProps extends FieldProps {
  length?: number;
  onResendCode?: React.MouseEventHandler;
  isLoading?: boolean;
}

const TernFieldErrors = () => {
  const field = useFieldContext<string>();
  const meta = field.state.meta as { errors: string[] };
  const errors = meta.errors;

  if (!errors || errors.length === 0) return null;

  const formattedErrors = errors.map(error => ({ message: error }));

  return <FieldError errors={formattedErrors} />;
};

const TernTextField = ({ label, placeholder, disabled, required }: FieldProps) => {
  const field = useFieldContext<string>();

  return (
    <FieldCn>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={e => field.handleChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
      />
      <TernFieldErrors />
    </FieldCn>
  );
};

const TernPasswordField = ({
  label,
  placeholder,
  disabled,
  required,
  onForgotPassword,
}: PasswordFieldProps) => {
  const field = useFieldContext<string>();
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <FieldCn>
      {label && (
        <div className='tern:flex tern:items-center'>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          {onForgotPassword && (
            <button
              type='button'
              onClick={onForgotPassword}
              disabled={disabled}
              className='tern:ml-auto tern:inline-block tern:text-sm tern:underline-offset-4 hover:tern:underline'
            >
              Forgot your password?
            </button>
          )}
        </div>
      )}
      <div className='tern:relative'>
        <Input
          id={field.name}
          name={field.name}
          type={showPassword ? 'text' : 'password'}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={e => field.handleChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className='tern:pr-10'
        />
        <button
          type='button'
          className='tern:absolute tern:right-2 tern:top-1/2 tern:h-8 tern:w-8 tern:-translate-y-1/2 hover:tern:bg-transparent'
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
        >
          {showPassword ? (
            <EyeOff className='tern:text-muted-foreground hover:tern:text-foreground tern:h-4 tern:w-4' />
          ) : (
            <Eye className='tern:text-muted-foreground hover:tern:text-foreground tern:h-4 tern:w-4' />
          )}
          <span className='tern:sr-only'>{showPassword ? 'Hide password' : 'Show password'}</span>
        </button>
      </div>
      <TernFieldErrors />
    </FieldCn>
  );
};

const TernEmailField = ({ label, placeholder, disabled, required }: FieldProps) => {
  const field = useFieldContext<string>();

  return (
    <FieldCn>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <Input
        id={field.name}
        name={field.name}
        type='email'
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={e => field.handleChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
      />
      <TernFieldErrors />
    </FieldCn>
  );
};

export { TernTextField, TernPasswordField, TernEmailField, TernFieldErrors };
