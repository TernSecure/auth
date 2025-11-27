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
    <div className='relative flex justify-center p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <Card className={cn('mt-8 w-full max-w-md')}>
          <CardHeader className='space-y-1 text-center'>
            <CardTitle>{props.cardTitle}</CardTitle>
            <CardDescription>{props.cardDescription}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
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
  const { ref, ...restInputProps } = props.otpControl.otpInputProps;
  return (
    <FieldCn {...restInputProps}>
      <OTPRoot {...props}>
        <OTPCodeControl ref={ref} />
        <OTPResendButton />
      </OTPRoot>
    </FieldCn>
  );
};
