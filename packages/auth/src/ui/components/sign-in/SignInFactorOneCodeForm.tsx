import { useTernSecure } from '@tern-secure/shared/react';
import type { EmailCodeFactor, PhoneCodeFactor } from '@tern-secure/types';
//import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import type { ApplicationVerifier } from 'firebase/auth';
import { getAuth, RecaptchaVerifier } from 'firebase/auth';
import React from 'react';

import type { VerificationCodeCardProps } from '../../common/VerificationCodeCard';
import { VerificationCodeCard } from '../../common/VerificationCodeCard';
import { useAuthSignIn, useSignInContext, useTernSecureOptions } from '../../ctx';
import { useCardState } from '../../elements';
import { useRouter } from '../../router';

export type SignInFactorOneCodeCard = Pick<VerificationCodeCardProps, 'onBackLinkClicked'> & {
  factor: EmailCodeFactor | PhoneCodeFactor;
};

export type SignInFactorOneCodeFormProps = SignInFactorOneCodeCard;

const VERIFIER_CONTAINER_ID = 'recaptcha-verifier-container';

export const SignInFactorOneCodeForm = (props: SignInFactorOneCodeFormProps) => {
  const signIn = useAuthSignIn();
  const card = useCardState();
  const { navigate } = useRouter();
  const { afterSignInUrl } = useSignInContext();
  const ternSecure = useTernSecure();
  const ternSecureOptions = useTernSecureOptions();
  const recaptchaContainerRef = React.useRef<HTMLDivElement>(null);
  const verifierRef = React.useRef<RecaptchaVerifier | null>(null);
  // Guards the one-time automatic send. A ref survives StrictMode's
  // mount -> cleanup -> mount cycle, so the SMS is only requested once.
  const smsSentRef = React.useRef(false);

  const app = ternSecure.firebaseApp;
  const auth = getAuth(app);

  // Lazily create (or reuse) the reCAPTCHA verifier. Keeping creation lazy
  // means a verifier torn down by an unmount/cleanup is transparently
  // rebuilt on the next use, so callers never observe a null verifier.
  const ensureRecaptcha = React.useCallback((): ApplicationVerifier => {
    if (verifierRef.current) {
      return verifierRef.current;
    }

    const container = recaptchaContainerRef.current;
    if (!container) {
      throw new Error('reCAPTCHA container is not mounted yet');
    }

    if (!container.id) {
      container.id = VERIFIER_CONTAINER_ID;
    }

    const appVerifier = new RecaptchaVerifier(auth, container, {
      size: 'invisible',
      callback: (_response: any) => {
        console.log('reCAPTCHA solved. Appcheck Verified this flow', _response);
      },
      'expired-callback': () => {
        card.setError({
          status: 'error',
          message: 'reCAPTCHA expired. Please try again.',
        });
      },
    });

    verifierRef.current = appVerifier;
    window.recaptchaVerifier = appVerifier;
    return appVerifier;
  }, [auth, card]);

  const sendSmsCode = React.useCallback(async () => {
    if (!signIn?.identifier) return;

    try {
      const appVerifier = ensureRecaptcha();
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
    } catch (e) {
      console.error('Failed to send SMS verification code', e);
      card.setError({
        status: 'error',
        message: 'Failed to initialize security verification',
        error: e,
      });
    }
  }, [signIn, card, ensureRecaptcha]);

  React.useEffect(() => {
    if (props.factor.strategy !== 'phone_code' || !signIn?.identifier) {
      return;
    }

    if (!smsSentRef.current) {
      smsSentRef.current = true;
      void sendSmsCode();
    }

    return () => {
      verifierRef.current?.clear();
      verifierRef.current = null;
      if (window.recaptchaVerifier) {
        delete window.recaptchaVerifier;
      }
    };
  }, [props.factor.strategy, signIn?.identifier, sendSmsCode]);

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
      if (props.factor.strategy === 'phone_code' && signIn?.identifier) {
        await sendSmsCode();
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
          id={VERIFIER_CONTAINER_ID}
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
