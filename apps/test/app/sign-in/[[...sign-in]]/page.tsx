'use client';

import { SignIn } from '@tern-secure/nextjs';

export default function LoginPage() {
  return (
    <SignIn
      appearance={{
        layout: {
          logoPlacement: 'inside',
          logoImageUrl: './shield.png',
          socialButtonsPlacement: 'top',
        },
      }}
      socialProviders={[
        {name: 'google', options: {mode: 'redirect'}},
        {name: 'github'},
        {name: 'facebook'}
      ]}
      //initialValues={{ phoneNumber: '' }}
    />
  );
}
