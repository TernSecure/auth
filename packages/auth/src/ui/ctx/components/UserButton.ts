import { useTernSecure } from '@tern-secure/shared/react';
import { createContext, useContext } from 'react';

import { useTernSecureOptions} from '../../ctx';
import { useRouter } from '../../router';
import type { UserButtonCtx } from '../../types';


export const UserButtonContext = createContext<UserButtonCtx | null>(null);

export const useUserButtonContext = () => {
  const context = useContext(UserButtonContext);
  const ternSecure = useTernSecure();
  const { navigate } = useRouter();
  const options = useTernSecureOptions();
  if (!context || context.componentName !== 'UserButton') {
    throw new Error('useUserButtonContext called outside of the mounted UserButton component.');
  }

  const { componentName, ...ctx } = context;

  const signInUrl = ctx.signInUrl || options.signInUrl;

  const afterSignOutUrl = ternSecure.constructAfterSignOutUrl();
  const navigateAfterSignOut = () => navigate(afterSignOutUrl);


  return {
    ...ctx,
    componentName,
    navigateAfterSignOut,
    signInUrl,
  };
};
