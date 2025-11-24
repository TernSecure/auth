import { useTernSecure } from '@tern-secure/shared/react';
import type { AuthErrorTree, SignInCreateParams } from '@tern-secure/types';
import { useMemo, useState } from 'react';

import { cn } from '../../../lib/utils';
import { TernSecureAPIResponseError } from '../../../resources/Error';
import type { SignInStartIdentifier } from '../../common';
import { getIdentifiers } from '../../common';
import { useAuthSignIn, useTernSecureOptions } from '../../ctx';
import { useSignInContext } from '../../ctx/components/SignIn';
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FieldDescription,
  FieldGroup,
  FieldSeparator,
  useAppForm,
  useCardState,
  withCardStateProvider,
} from '../../elements';
import { RouterLink } from '../../elements/RouterLink';
import { useRouter } from '../../router';
import { FormButton } from '../../utils/form';
import { SignInPassword } from './SignInPassword';
import { SignInSocialButtons } from './SignInSocialButtons';

export type SessionErrorCode =
  | 'ENDPOINT_NOT_FOUND'
  | 'COOKIE_SET_FAILED'
  | 'API_REQUEST_FAILED'
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'
  | 'UNKNOWN_ERROR';

export interface SessionError {
  code: SessionErrorCode;
  message: string;
  original?: unknown;
}

function SignInStartInternal(): React.JSX.Element {
  const signIn = useAuthSignIn();
  const ternSecure = useTernSecure();
  const ternSecureOptions = useTernSecureOptions();
  const ctx = useSignInContext();
  const signUpMode = ternSecureOptions.signUpMode || 'public';
  const passwordAuthentication = ternSecureOptions.passwordAuthentication ?? true;
  const requiresVerification = ternSecure.requiresVerification;
  const card = useCardState();
  const { navigate } = useRouter();
    const { afterSignInUrl, signUpUrl, showCombinedForm, isCombinedFlow } = ctx;
  const preferredEmailStrategy = ctx.preferredEmailStrategy || 'password';
  const identifierAttributes: SignInStartIdentifier[] = useMemo(
    () => ['email_address', 'phone_number'],
    [],
  );

  const onlyPhoneNumberInitialValueExists =
    ctx.initialValues?.phoneNumber !== undefined && ctx.initialValues.emailAddress === undefined;
  const shouldStartWithPhoneNumberIdentifier =
    onlyPhoneNumberInitialValueExists && identifierAttributes.includes('phone_number');
  const [identifierAttribute, setIdentifierAttribute] = useState<SignInStartIdentifier>(
    shouldStartWithPhoneNumberIdentifier ? 'phone_number' : identifierAttributes[0] || '',
  );

  const ctxInitialValues = ctx.initialValues || {};
  const initialValues: Record<SignInStartIdentifier, string | undefined> = useMemo(
    () => ({
      email_address: ctxInitialValues.emailAddress,
      email_address_username: ctxInitialValues.emailAddress || ctxInitialValues.username,
      username: ctxInitialValues.username,
      phone_number: ctxInitialValues.phoneNumber,
    }),
    [ctxInitialValues.emailAddress, ctxInitialValues.phoneNumber, ctxInitialValues.username],
  );

  const { fieldName, label, placeholder } = useMemo(
    () => getIdentifiers(identifierAttribute),
    [identifierAttribute],
  );

  const fieldComponentType = useMemo(() => {
    return identifierAttribute === 'phone_number' ? 'tel' : 'email';
  }, [identifierAttribute]);

  const defaultValues = useMemo(() => {
    return {
      [fieldName]: initialValues[identifierAttribute] || '',
    };
  }, [fieldName, identifierAttribute, initialValues[identifierAttribute]]);

  const form = useAppForm({
    defaultValues,
    validators: {
      onSubmitAsync: ({ value }) => {
        return signInWithFields(value);
      },
    },
  });

  const buildSignInParams = (values: Record<string, string>): SignInCreateParams => {
    const identifier = values.phoneNumber || values.email || values.identifier || '';
    let strategy: 'phone_code' | 'email_code' | 'password' =
      identifierAttribute === 'phone_number' ? 'phone_code' : 'email_code';

    if (identifierAttribute !== 'phone_number' && preferredEmailStrategy === 'password') {
      strategy = 'password';
    }

    if (strategy === 'password') {
      return { strategy: 'password', identifier };
    }

    return { strategy, identifier };
  };

  const handleSignInError = (error: unknown) => {
    if (error instanceof TernSecureAPIResponseError) {
      const apiError = error.errors[0];
      card.setError({
        status: 'error',
        message: apiError?.message || error.message,
        error: apiError,
        code: apiError?.code,
      });
    } else {
      card.setError({
        status: 'error',
        message: 'An unexpected error occurred.',
        error,
      });
    }
  };

  const signInWithFields = async (values: Record<string, string>) => {
    try {
      const res = await signIn?.create(buildSignInParams(values));
      switch (res?.status) {
        case 'needs_first_factor':
          return navigate('factor-one');
        case 'needs_email_verification':
          return navigate('verify-email-address');
        case 'success':
          return ternSecure.createActiveSession({ redirectUrl: afterSignInUrl });
      }
    } catch (error) {
      handleSignInError(error);
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    const res = await signIn?.authenticateWithPassword({ email, password });
    if (res?.status === 'error') {
      card.setError({
        status: 'error',
        message: res.message,
        error: res.error,
      });
    }
    if (res?.status === 'success') {
      if (requiresVerification && res?.user.emailVerified === false) {
        void navigate('verify-email-address');
        return;
      }
      await ternSecure.createActiveSession({ session: res.user, redirectUrl: afterSignInUrl });
    }
  };

  const handleForgotPassword = () => {
    void navigate('reset-password');
  };

  const handleError = (error: AuthErrorTree) => {
    card.setError(error);
  };

  return (
    <div className='relative flex justify-center p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <Card className={cn('mt-8 w-full max-w-md')}>
          <CardHeader className='space-y-1 text-center'>
            <CardTitle className={cn('font-bold')}>Sign in to {'your account'}</CardTitle>
            <CardDescription className={cn('text-muted-foreground')}>
              Please sign in to continue
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {card.error && (
              <Alert
                variant='destructive'
                className='animate-in fade-in-50'
              >
                <AlertDescription>{card.error.message}</AlertDescription>
              </Alert>
            )}

            {showCombinedForm ? (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  void form.handleSubmit();
                }}
              >
                <FieldGroup>
                  {passwordAuthentication && (
                    <>
                      <form.AppField name={fieldName}>
                        {field => {
                          return fieldComponentType === 'tel' ? (
                            <field.TernTextField
                              label={label}
                              placeholder={placeholder}
                              disabled={form.state.isSubmitting || card.isLoading}
                              required
                            />
                          ) : (
                            <field.TernEmailField
                              label={label}
                              placeholder={placeholder}
                              disabled={form.state.isSubmitting || card.isLoading}
                              required
                            />
                          );
                        }}
                      </form.AppField>
                      <FormButton
                        canSubmit={form.state.canSubmit}
                        isSubmitting={form.state.isSubmitting}
                        submitText="Continue"
                        submittingText="Signing in..."
                      />
                      <FieldSeparator>Or continue with</FieldSeparator>
                    </>
                  )}
                  <SignInSocialButtons />
                </FieldGroup>
              </form>
            ) : (
              passwordAuthentication && (
                <SignInPassword
                  signInWithPassword={signInWithPassword}
                  onError={handleError}
                  isDisabled={card.isLoading}
                  onForgotPassword={handleForgotPassword}
                />
              )
            )}

            {signUpMode === 'public' && (
              <FieldDescription className="text-center">
                Don&apos;t have an account? <RouterLink to={signUpUrl}>Sign up</RouterLink>
              </FieldDescription>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export const SignInStart = withCardStateProvider(SignInStartInternal);
