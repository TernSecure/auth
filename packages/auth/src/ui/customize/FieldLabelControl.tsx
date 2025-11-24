import { useState } from 'react';

import { Input, Label } from '../elements';
import { Eye, EyeOff } from '../icons';
import { useFieldContext } from './Form';

export interface FieldProps {
  field?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export function FieldErrors() {
  const field = useFieldContext<string>();
  const meta = field.state.meta as { errors: string[] };
  const errors = meta.errors;

  if (!errors || errors.length === 0) return null;

  return (
    <div className='mt-1 text-sm text-red-500'>
      {errors.map((error, i) => (
        <div key={i}>{error}</div>
      ))}
    </div>
  );
}

export function TextField({ label, placeholder, disabled, required }: FieldProps) {
  const field = useFieldContext<string>();
  return (
    <div className='space-y-2'>
      {label && (
        <Label htmlFor={field.name}>
          {label}
          {required && <span className='ml-1 text-red-500'>*</span>}
        </Label>
      )}
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
      <FieldErrors />
    </div>
  );
}

export function PasswordField({ label, placeholder, disabled, required }: FieldProps) {
  const field = useFieldContext<string>();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className='space-y-2'>
      {label && <Label htmlFor={field.name}>{label}</Label>}
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
          required
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
      <FieldErrors />
    </div>
  );
}

export function EmailField({ label, placeholder, disabled, required }: FieldProps) {
  const field = useFieldContext<string>();

  return (
    <div className='space-y-2'>
      {label && <Label htmlFor={field.name}>{label}</Label>}
      <Input
        id={field.name}
        name={field.name}
        type='email'
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={e => field.handleChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required
      />
      <FieldErrors />
    </div>
  );
}
