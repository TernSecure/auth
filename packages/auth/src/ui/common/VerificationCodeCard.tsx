import type { PropsWithChildren } from 'react';
import React from 'react';

import {
  Alert, 
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  OTPCodeControl,
  OTPResendButton,
  OTPRoot,
  useCardState,
  useFieldOTP
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
  })

  return (
    <Card className='w-full max-w-md'>
      <CardHeader>
        <CardTitle>{props.cardTitle}</CardTitle>
        <CardDescription>{props.cardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <OTPRoot
          isLoading={otp.isLoading}
          otpControl={otp.otpControl}
          onResendCode={otp.onResendCode}
        >
          <div className='space-y-4'>
            {card.error && (
              <Alert variant='destructive'>
                <AlertDescription>{card.error.message}</AlertDescription>
              </Alert>
            )}
            <div className='space-y-2 flex flex-col items-center'>
              <Label htmlFor='code'>{props.inputLabel}</Label>
              <OTPCodeControl />
            </div>
          </div>
          <div className='flex flex-col space-y-2 mt-4'>
            <OTPResendButton />
            {props.onBackLinkClicked && (
              <Button
                variant='ghost'
                onClick={props.onBackLinkClicked}
                disabled={otp.isLoading}
              >
                Back
              </Button>
            )}
          </div>
        </OTPRoot>
      </CardContent>
    </Card>
  );
};
