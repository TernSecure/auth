import { SignUp } from '@tern-secure/nextjs';

export default function SignUpPage() {
  return (
  <SignUp socialProviders={[
    {name: 'google'}
  ]} />
);
}
