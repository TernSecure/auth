import type { PhoneCodeFactor } from '@tern-secure/types';

import type { SignInFactorOneCodeCard } from './SignInFactorOneCodeForm';
import { SignInFactorOneCodeForm } from './SignInFactorOneCodeForm';

type SignInFactorOnePhoneCodeCardProps = SignInFactorOneCodeCard & { factor: PhoneCodeFactor };

export const SignInFactorOnePhoneCodeCard = (props: SignInFactorOnePhoneCodeCardProps) => {
  return <SignInFactorOneCodeForm {...props} />;
};
