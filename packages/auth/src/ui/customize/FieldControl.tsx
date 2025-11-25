import { useState } from 'react';

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
  const [showPassword, setShowPassword] = useState(false);

  return (
    <FieldCn>
      {label && (
        <div className='flex items-center'>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          {onForgotPassword && (
            <button
              type='button'
              onClick={onForgotPassword}
              disabled={disabled}
              className='ml-auto inline-block text-sm underline-offset-4 hover:underline'
            >
              Forgot your password?
            </button>
          )}
        </div>
      )}
      <div className='relative'>
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
          className='pr-10'
        />
        <button
          type='button'
          className='absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 hover:bg-transparent'
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
        >
          {showPassword ? (
            <EyeOff className='text-muted-foreground hover:text-foreground h-4 w-4' />
          ) : (
            <Eye className='text-muted-foreground hover:text-foreground h-4 w-4' />
          )}
          <span className='sr-only'>{showPassword ? 'Hide password' : 'Show password'}</span>
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
