import { useTernSecure } from '@tern-secure/shared/react';

import { cn } from '../../../lib/utils';

export function SignUp() {
  const instance = useTernSecure();

  // This is just a placeholder - would implement the actual UI in a real component
  return (
    <div className={cn('w-full max-w-md rounded-lg bg-white p-8 shadow-md')}>
      <h2 className='mb-6 text-center text-2xl font-bold text-gray-800'>
        Sign up for your account
      </h2>

      {/* Email signup form would be implemented here */}

      {/* Social signup options would be implemented here */}
    </div>
  );
}
