import { useTernSecure } from '@tern-secure/shared/react';
import type { EmailCodeFactor, PhoneCodeFactor } from '@tern-secure/types';
import type { ApplicationVerifier } from 'firebase/auth';
import React from 'react';

import type { VerificationCodeCardProps } from '../../common/VerificationCodeCard';
import { VerificationCodeCard } from '../../common/VerificationCodeCard';
import { useAuthSignIn, useSignInContext } from '../../ctx';
import { useCardState } from '../../elements';
import { useRouter } from '../../router';

export type SignInFactorOneCodeCard = Pick<VerificationCodeCardProps, 'onBackLinkClicked'> & {
  factor: EmailCodeFactor | PhoneCodeFactor;
};

export type SignInFactorOneCodeFormProps = SignInFactorOneCodeCard;

export const SignInFactorOneCodeForm = (props: SignInFactorOneCodeFormProps) => {
  const signIn = useAuthSignIn();
  const card = useCardState();
  const { navigate } = useRouter();
  const { afterSignInUrl } = useSignInContext();
  const ternSecure = useTernSecure();
  const recaptchaContainerRef = React.useRef<HTMLDivElement>(null);
  const [verifier, setVerifier] = React.useState<ApplicationVerifier | null>(null);
  const [isInitializing, setIsInitializing] = React.useState(false);
  const initializationAttempted = React.useRef(false);

  const sendSmsCode = React.useCallback(
    async (appVerifier: ApplicationVerifier) => {
      if (!signIn?.identifier) return;
      const res = await signIn.authenticateWithPhoneNumber({
        phoneNumber: signIn.identifier,
        appVerifier,
      });

      if (res.status === 'error') {
        card.setError({
          status: 'error',
          message: res.message,
          error: res.error,
        });
      }
    },
    [signIn, card],
  );

  const initializeRecaptcha = React.useCallback(async () => {
    if (
      props.factor.strategy === 'phone_code' &&
      signIn &&
      recaptchaContainerRef.current &&
      !verifier &&
      !isInitializing &&
      !initializationAttempted.current
    ) {
      initializationAttempted.current = true;
      setIsInitializing(true);
      try {
        const container = recaptchaContainerRef.current;

        if (!container.id) {
          container.id = 'recaptcha-container';
        }

        const appVerifier = signIn.createRecaptchaVerifier(container, {
          size: 'invisible',
          callback: (_response: any) => {
            // reCAPTCHA solved
          },
          'expired-callback': () => {
            // Response expired - reset verifier
            setVerifier(null);
            setIsInitializing(false);
            initializationAttempted.current = false;
          },
        });

        setVerifier(appVerifier);
        await sendSmsCode(appVerifier);
      } catch (e) {
        card.setError({
          status: 'error',
          message: 'Failed to initialize security verification',
          error: e,
        });
        setIsInitializing(false);
        initializationAttempted.current = false;
      }
    }
  }, [props.factor.strategy, signIn, verifier, isInitializing, sendSmsCode, card]);

  React.useEffect(() => {
    void initializeRecaptcha();
  }, [initializeRecaptcha]);

  const action = (
    code: string,
    resolve: () => Promise<void>,
    reject: (err: unknown) => Promise<void>,
  ) => {
    const run = async () => {
      try {
        let res;
        if (props.factor.strategy === 'phone_code') {
          res = await signIn?.attemptPhoneNumberVerification({ code });
        }

        if (res?.status === 'success') {
          await resolve();
          if (signIn?.user) {
            await ternSecure.createActiveSession({
              session: signIn.user,
              redirectUrl: afterSignInUrl,
            });
          }
        } else {
          await reject(new Error('Verification failed'));
        }
      } catch (error) {
        await reject(error);
      }
    };
    void run();
  };

  const handleResend = (e: React.MouseEvent) => {
    e.preventDefault();
    const run = async () => {
      if (props.factor.strategy === 'phone_code' && signIn?.identifier && verifier) {
        await sendSmsCode(verifier);
      }
    };
    void run();
  };

  const goBack = () => {
    void navigate('../');
  };

  return (
    <>
      {props.factor.strategy === 'phone_code' && (
        <div
          ref={recaptchaContainerRef}
          id='recaptcha-container'
          style={{
            minHeight: '78px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
          }}
        />
      )}
      <VerificationCodeCard
        cardTitle='Enter Code'
        cardDescription={`Please enter the code sent to your ${props.factor.strategy === 'phone_code' ? 'phone' : 'email'}.`}
        onCodeEntryFinishedAction={action}
        onResendCodeClicked={handleResend}
        onBackLinkClicked={goBack}
        inputLabel='SignIn PhoneCode'
        submitButtonText='Continue'
      />
    </>
  );
};
