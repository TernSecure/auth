import { createContextAndHook } from '@tern-secure/shared/react';
import type { PropsWithChildren } from 'react';
import React, { useCallback } from 'react';

import { cn } from '../../lib/utils';
import { Input } from '../elements';
import { useLoadingStatus } from '../hooks';
import { sleep } from '../utils';
import { useCardState } from './ctx';
import { TimerButton } from './TimerButton';

type UseCodeInputOptions = {
  length?: number;
};

type onCodeEntryFinishedCallback = (code: string) => unknown;
type onCodeEntryFinished = (cb: onCodeEntryFinishedCallback) => void;

type onCodeEntryFinishedActionCallback<R = unknown> = (
  code: string,
  resolve: (params?: R) => Promise<void>,
  reject: (err: unknown) => Promise<void>,
) => void;

type OTPControl = {
  otpInputProps: {
    length: number;
    values: string[];
    setValues: React.Dispatch<React.SetStateAction<string[]>>;
    feedback: string | null;
    feedbackType: 'error' | 'success' | null;
    clearFeedback: () => void;
    ref: React.MutableRefObject<any>;
  };
  onCodeEntryFinished: onCodeEntryFinished;
  reset: () => void;
  setError: (msg: string) => void;
};

type UseFieldOTP = <R = unknown>(params: {
  id?: 'code';
  onCodeEntryFinished: onCodeEntryFinishedActionCallback<R>;
  onResendCodeClicked?: React.MouseEventHandler;
  onResolve?: (a?: R) => Promise<void> | void;
}) => {
  isLoading: boolean;
  onResendCode: React.MouseEventHandler<HTMLButtonElement> | undefined;
  onFakeContinue: () => void;
  otpControl: OTPControl;
};

export const useFieldOTP: UseFieldOTP = params => {
  const card = useCardState();
  const {
    id = 'code',
    onCodeEntryFinished: paramsOnCodeEntryFinished,
    onResendCodeClicked: paramsOnResendCodeClicked,
    onResolve: paramsOnResolve,
  } = params;

  const codeControl = useCodeControl({ length: 6 });
  const status = useLoadingStatus();

  const resolve = async (param: any) => {
    await sleep(750);
    await paramsOnResolve?.(param);
  };

  const reject = async (err: any) => {
    const message = (err as any)?.message || (err instanceof Error ? err.message : 'Invalid code');
    card.setError({
      status: 'error',
      message: message,
      error: err,
    });
    codeControl.setError(message);
    status.setIdle();
    await sleep(750);
    codeControl.reset();
  };

  codeControl.onCodeEntryFinished(code => {
    status.setLoading();
    codeControl.otpInputProps.clearFeedback();
    paramsOnCodeEntryFinished(code, resolve, reject);
  });

  const onFakeContinue = () => {
    codeControl.otpInputProps.clearFeedback();
    paramsOnCodeEntryFinished('', resolve, reject);
  };

  const onResendCode = useCallback<React.MouseEventHandler<HTMLButtonElement>>(
    e => {
      codeControl.reset();
      paramsOnResendCodeClicked?.(e);
    },
    [codeControl, paramsOnResendCodeClicked],
  );

  return {
    isLoading: status.isLoading,
    otpControl: codeControl,
    onResendCode: paramsOnResendCodeClicked ? onResendCode : undefined,
    onFakeContinue,
  };
};

const useCodeControl = (options?: UseCodeInputOptions) => {
  const otpControlRef = React.useRef<any>(null);
  const userOnCodeEnteredCallback = React.useRef<onCodeEntryFinishedCallback | undefined>(
    undefined,
  );
  const { length = 6 } = options || {};

  const [values, setValues] = React.useState<string[]>(Array(length).fill(''));
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [feedbackType, setFeedbackType] = React.useState<'error' | 'success' | null>(null);

  const clearFeedback = () => {
    setFeedback(null);
    setFeedbackType(null);
  };

  const setError = (msg: string) => {
    setFeedback(msg);
    setFeedbackType('error');
  };

  const onCodeEntryFinished: onCodeEntryFinished = cb => {
    userOnCodeEnteredCallback.current = cb;
  };

  React.useEffect(() => {
    const len = values.filter(c => c).length;
    if (len === length) {
      const code = values.map(c => c || ' ').join('');
      userOnCodeEnteredCallback.current?.(code);
    }
  }, [values, length]);

  const otpInputProps = {
    length,
    values,
    setValues,
    feedback,
    feedbackType,
    clearFeedback,
    ref: otpControlRef,
  };
  return {
    otpInputProps,
    onCodeEntryFinished,
    reset: () => {
      setValues(Array(length).fill(''));
      clearFeedback();
      if (otpControlRef.current && typeof otpControlRef.current.focus === 'function') {
        otpControlRef.current.focus();
      }
    },
    setError,
  };
};

export type OTPInputProps = {
  label?: string;
  resendButton?: string;
  description?: string;
  isLoading: boolean;
  isDisabled?: boolean;
  onResendCode?: React.MouseEventHandler<HTMLButtonElement>;
  otpControl: ReturnType<typeof useFieldOTP>['otpControl'];
  centerAlign?: boolean;
};

const [OTPInputContext, useOTPInputContext] =
  createContextAndHook<OTPInputProps>('OTPInputContext');

export const OTPRoot = ({ children, ...props }: PropsWithChildren<OTPInputProps>) => {
  return <OTPInputContext.Provider value={{ value: props }}>{children}</OTPInputContext.Provider>;
};

export const OTPResendButton = () => {
  const { resendButton, onResendCode, isLoading, otpControl } = useOTPInputContext();

  if (!onResendCode) {
    return null;
  }

  return (
    <TimerButton
      onClick={onResendCode}
      startDisabled
      disabled={otpControl.otpInputProps.feedbackType === 'success' || isLoading}
      showCounter={otpControl.otpInputProps.feedbackType !== 'success'}
      throttleTimeInSec={60}
    />
  );
};

export const OTPCodeControl = React.forwardRef<{ reset: any }>((_, ref) => {
  const [disabled, setDisabled] = React.useState(false);
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);
  const firstClickRef = React.useRef(false);

  const { otpControl, isLoading, isDisabled, centerAlign = true } = useOTPInputContext();
  const { feedback, values, setValues, feedbackType, length } = otpControl.otpInputProps;

  React.useImperativeHandle(ref, () => ({
    reset: () => {
      setValues(values.map(() => ''));
      setDisabled(false);
      setTimeout(() => focusInputAt(0), 0);
    },
  }));

  React.useLayoutEffect(() => {
    setTimeout(() => focusInputAt(0), 0);
  }, []);

  React.useEffect(() => {
    if (feedback) {
      setDisabled(true);
    }
  }, [feedback]);

  const handleMultipleCharValue = ({
    eventValue,
    inputPosition,
  }: {
    eventValue: string;
    inputPosition: number;
  }) => {
    const eventValues = (eventValue || '').split('');

    if (eventValues.length === 0 || !eventValues.every(c => isValidInput(c))) {
      return;
    }

    if (eventValues.length === length) {
      setValues([...eventValues]);
      focusInputAt(length - 1);
      return;
    }

    const mergedValues = values.map((value, i) =>
      i < inputPosition ? value : eventValues[i - inputPosition] || value,
    );
    setValues(mergedValues);
    focusInputAt(inputPosition + eventValues.length);
  };

  const changeValueAt = (index: number, newValue: string) => {
    const newValues = [...values];
    newValues[index] = newValue;
    setValues(newValues);
  };

  const focusInputAt = (index: number) => {
    const clampedIndex = Math.min(Math.max(0, index), refs.current.length - 1);
    const ref = refs.current[clampedIndex];
    if (ref) {
      ref.focus();
      if (values[clampedIndex]) {
        ref.select();
      }
    }
  };

  const handleOnClick = (index: number) => (e: React.MouseEvent<HTMLInputElement>) => {
    e.preventDefault();
    // Focus on the first digit, when the first click happens.
    // This is helpful especially for mobile (iOS) devices that cannot autofocus
    // and user needs to manually tap the input area
    if (!firstClickRef.current) {
      focusInputAt(0);
      firstClickRef.current = true;
      return;
    }
    focusInputAt(index);
  };

  const handleOnChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleMultipleCharValue({ eventValue: e.target.value || '', inputPosition: index });
  };

  const handleOnInput = (index: number) => (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (isValidInput((e.target as any).value)) {
      // If a user types on an input that already has a value and the new
      // value is the same as the old one, onChange will not fire so we
      // manually move focus to the next input
      focusInputAt(index + 1);
    }
  };

  const handleOnPaste = (index: number) => (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleMultipleCharValue({
      eventValue: e.clipboardData.getData('text/plain') || '',
      inputPosition: index,
    });
  };

  const handleOnKeyDown = (index: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Backspace':
        e.preventDefault();
        changeValueAt(index, '');
        focusInputAt(index - 1);
        return;
      case 'ArrowLeft':
        e.preventDefault();
        focusInputAt(index - 1);
        return;
      case 'ArrowRight':
        e.preventDefault();
        focusInputAt(index + 1);
        return;
      case ' ':
        e.preventDefault();
        return;
    }
  };

  const centerClass = centerAlign ? 'justify-center items-center' : '';

  return (
    <div
      className={cn(
        'direction-ltr -ml-1 flex gap-2 p-1',
        centerClass,
        isLoading && 'pointer-events-none opacity-50',
        feedbackType === 'error' && 'text-red-500',
      )}
    >
      {values.map((value, index: number) => (
        <SingleCharInput
          key={index}
          value={value}
          onClick={handleOnClick(index)}
          onChange={handleOnChange(index)}
          onKeyDown={handleOnKeyDown(index)}
          onInput={handleOnInput(index)}
          onPaste={handleOnPaste(index)}
          id={`digit-${index}-field`}
          ref={node => {
            refs.current[index] = node;
          }}
          autoFocus={index === 0 || undefined}
          autoComplete='one-time-code'
          aria-label={`${index === 0 ? 'Enter verification code. ' : ''}Digit ${index + 1}`}
          disabled={isDisabled || isLoading || disabled || feedbackType === 'success'}
          hasError={feedbackType === 'error'}
          isSuccessfullyFilled={feedbackType === 'success'}
          type='text'
          inputMode='numeric'
          name={`codeInput-${index}`}
        />
      ))}
    </div>
  );
});

const SingleCharInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input> & { isSuccessfullyFilled?: boolean; hasError?: boolean }
>((props, ref) => {
  const { isSuccessfullyFilled, hasError, className, ...rest } = props;
  return (
    <Input
      ref={ref}
      type='text'
      className={cn(
        'h-10 w-10 rounded-md bg-transparent p-0.5 text-center sm:h-8 sm:w-8',
        isSuccessfullyFilled ? 'border-green-500' : '',
        hasError ? 'border-red-500' : '',
        className,
      )}
      {...rest}
    />
  );
});

const isValidInput = (char: string) => char != undefined && Number.isInteger(+char);
