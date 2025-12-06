import type { PropsWithChildren } from 'react';
import React from 'react';

import { cn } from '../../lib/utils';
import type { OTPInputProps } from '../elements';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  TimerButton,
  useCardState,
  useFieldOTP,
} from '../elements';

export type VerificationCodeCardProps = {
  cardTitle?: string;
  cardDescription?: string;
  inputLabel?: string;
  submitButtonText?: string;
  onCodeEntryFinishedAction: (
    code: string,
    resolve: () => Promise<void>,
    reject: (err: unknown) => Promise<void>,
  ) => void;
  onResendCodeClicked?: React.MouseEventHandler;
  onBackLinkClicked?: React.MouseEventHandler;
};

export const VerificationCodeCard = (props: PropsWithChildren<VerificationCodeCardProps>) => {
  const card = useCardState();
  const otp = useFieldOTP({
    onCodeEntryFinished: (code, resolve, reject) => {
      props.onCodeEntryFinishedAction(code, resolve, reject);
    },
    onResendCodeClicked: props.onResendCodeClicked,
  });

  const handleContinue = () => {
    const { values, length } = otp.otpControl.otpInputProps;
    const code = values.join('');
    if (code.length < length) {
      card.setError({
        status: 'error',
        message: 'Please enter the code.',
        error: new Error('Incomplete code'),
      });
      return;
    }
    otp.onFakeContinue();
  };

  return (
    <div className='tern:relative tern:flex tern:justify-center tern:p-6 tern:md:p-10'>
      <div className='tern:w-full tern:max-w-sm'>
        <Card className={cn('tern:mt-8 tern:w-full tern:max-w-md')}>
          <CardHeader className='tern:space-y-1 tern:text-center'>
            <CardTitle>{props.cardTitle}</CardTitle>
            <CardDescription>{props.cardDescription}</CardDescription>
          </CardHeader>
          <CardContent className='tern:space-y-4'>
            {card.error && (
              <Alert variant='destructive'>
                <AlertDescription>{card.error.message}</AlertDescription>
              </Alert>
            )}
            <TernOTPInput
              {...otp}
              onResendCode={otp.onResendCode}
            />
            <Button
              className="tern:w-full"
              disabled={otp.isLoading}
              onClick={handleContinue}
            >
              {props.submitButtonText}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const TernOTPInput = (props: OTPInputProps) => {
  const { otpControl, resendButton, description, isLoading, isDisabled, onResendCode, centerAlign = true } = props;
  const { values, setValues, length, feedback, feedbackType, ref } = otpControl.otpInputProps;
  
  const value = values.join('');
  
  const handleChange = (newValue: string) => {
      const newValues = newValue.split('');
      while (newValues.length < length) {
          newValues.push('');
      }
      setValues(newValues);
  };

  return (
    <div className={cn("tern:flex tern:flex-col tern:gap-4", centerAlign && "tern:items-center")}>

        <InputOTP
            maxLength={length}
            value={value}
            onChange={handleChange}
            disabled={isDisabled || isLoading}
            ref={ref}
        >
            <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
            </InputOTPGroup>
        </InputOTP>
        
        {description && <div className="tern:text-sm tern:text-muted-foreground">{description}</div>}
        
        {onResendCode && (
            <TimerButton
                onClick={onResendCode}
                startDisabled
                disabled={feedbackType === 'success' || isLoading}
                showCounter={feedbackType !== 'success'}
                throttleTimeInSec={60}
                className="tern:text-sm tern:text-muted-foreground hover:tern:text-primary tern:underline tern:underline-offset-4"
            >
                Resend Code
            </TimerButton>
        )}
    </div>
  );
};
