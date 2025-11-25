import { useTernSecure } from '@tern-secure/shared/react';
import type { EmailCodeFactor, PhoneCodeFactor } from '@tern-secure/types';
import type { ApplicationVerifier } from 'firebase/auth';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const [verifier, setVerifier] = useState<ApplicationVerifier | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const sendSmsCode = useCallback(async (appVerifier: ApplicationVerifier) => {
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
  }, [signIn, card]);

  useEffect(() => {
    const initializeRecaptcha = async () => {
      if (
        props.factor.strategy === 'phone_code' &&
        signIn &&
        recaptchaContainerRef.current &&
        !verifier &&
        !isInitializing
      ) {
        setIsInitializing(true);
        try {
          const container = recaptchaContainerRef.current;
          
          // Ensure container has proper structure and styling
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
            },
          });
          
          setVerifier(appVerifier);
          await sendSmsCode(appVerifier);
        } catch (e) {
          console.error('Failed to initialize Recaptcha', e);
          card.setError({
            status: 'error',
            message: 'Failed to initialize security verification',
            error: e,
          });
          setIsInitializing(false);
        }
      }
    };
    
    void initializeRecaptcha();
  }, [props.factor.strategy, signIn, verifier, isInitializing, sendSmsCode, card]);

  const action = (
    code: string,
    resolve: () => Promise<void>,
    reject: (err: unknown) => Promise<void>,
  ) => {
    const run = async () => {
      try {
        let res;
        if (props.factor.strategy === 'phone_code') {
          // @ts-ignore: attemptPhoneNumberVerification exists on SignIn class but not in SignInResource interface
          res = await signIn?.attemptPhoneNumberVerification({ code });
        } else {
          res = await signIn?.attemptFirstFactor({
            strategy: props.factor.strategy,
            code,
          });
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
      />
    </>
  );
};
