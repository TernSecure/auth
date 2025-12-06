import { useTernSecure } from '@tern-secure/shared/react';
import type { EmailCodeFactor, PhoneCodeFactor } from '@tern-secure/types';
//import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import type { ApplicationVerifier } from 'firebase/auth';
import { getAuth, RecaptchaVerifier} from "firebase/auth";
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

const RECAPTCHA_ENTERPRISE_SITE_KEY = '6Lc2aCIsAAAAAAZ2fYnqkPGqGnlsi6KE94qEzGKX'; 

const VERIFIER_CONTAINER_ID = 'recaptcha-verifier-container';

export const SignInFactorOneCodeForm = (props: SignInFactorOneCodeFormProps) => {
  const signIn = useAuthSignIn();
  const card = useCardState();
  const { navigate } = useRouter();
  const { afterSignInUrl } = useSignInContext();
  const ternSecure = useTernSecure();
  const ternSecureOptions = useTernSecureOptions();
  const recaptchaContainerRef = React.useRef<HTMLDivElement>(null);
  const [verifier, setVerifier] = React.useState<ApplicationVerifier | null>(null);
  const [isInitializing, setIsInitializing] = React.useState(false);
  const initializationAttempted = React.useRef(false);
  
  const app = ternSecure.firebaseApp;
const auth = getAuth(app);

  const sendSmsCode = React.useCallback(
    async () => {
      if (!signIn?.identifier) return;
      const appVerifier = window.recaptchaVerifier;
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
          container.id = VERIFIER_CONTAINER_ID;
        }

        window.recaptchaVerifier = new RecaptchaVerifier(auth, container, {
          size: 'invisible',
          callback: (_response: any) => {
            console.log('reCAPTCHA solved. Appcheck Verified this flow', _response);
          },
          'expired-callback': () => {
            card.setError({
              status: 'error',
              message: 'reCAPTCHA expired. Please try again.',
            });
            setIsInitializing(false);
            initializationAttempted.current = false;
          },
        });

        const appVerifier = window.recaptchaVerifier;
        setVerifier(appVerifier);

        await sendSmsCode();
      } catch (e) {
        console.error('Failed to initialize reCAPTCHA verifier', e);
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

    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        delete window.recaptchaVerifier;
      }
    };
  }, []);


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
