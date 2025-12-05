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
  Field as FieldCn,
  OTPCodeControl,
  OTPResendButton,
  OTPRoot,
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
              label={props.inputLabel}
              onResendCode={otp.onResendCode}
            />
            <Button
              disabled={otp.isLoading}
              onClick={otp.onFakeContinue}
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
  const { otpControl, label, resendButton, description, isLoading, isDisabled, onResendCode, centerAlign } = props;
  const { ref, ...restInputProps } = otpControl.otpInputProps;
  
  // Filter out non-DOM props
  const { values, setValues, clearFeedback, feedback, feedbackType, ...domSafeProps } = restInputProps;
  
  return (
    <FieldCn {...domSafeProps}>
      <OTPRoot 
        label={label}
        resendButton={resendButton}
        description={description}
        isLoading={isLoading}
        isDisabled={isDisabled}
        onResendCode={onResendCode}
        otpControl={otpControl}
        centerAlign={centerAlign}
      >
        <OTPCodeControl ref={ref} />
        <OTPResendButton />
      </OTPRoot>
    </FieldCn>
  );
};
