import type { TernSecureAuth } from '@tern-secure/types';
import React from 'react';

import { useIsoTernSecureAuthCtx  } from '../ctx/IsomorphicTernSecureCtx';
import { useAssertWrappedByTernSecureAuthProvider} from '../hooks/useAssertWrappedTernSecureProvider';

type WithTernSecureProp<P> = P & {
  instance: TernSecureAuth;
  component?: string;
};


export interface FallbackProp {
  fallback?: React.ReactNode;
}

export const withTernSecure = <P extends { instance: TernSecureAuth; component?: string }>(
  Component: React.ComponentType<P>,
  options?: { component: string; renderWhileLoading?: boolean },
) => {
  const displayName = options?.component || Component.displayName || Component.name || 'Component';

  const HOC = (props: Omit<P, 'instance'> & FallbackProp) => {
    useAssertWrappedByTernSecureAuthProvider(displayName || 'withTernSecure');

    const instance = useIsoTernSecureAuthCtx();

    //console.log(
    //  `[TernSecure] ${displayName} - Instance Status:`,
    //  {
    //    isReady: instance.isReady,
    //    status: instance.status,
    //    hasInstance: !!instance,
    //    hasShowSignIn: !!(instance as any).showSignIn,
    //    renderWhileLoading: options?.renderWhileLoading
    //  }
    //);

    if (!instance.isReady && !options?.renderWhileLoading) {
      return null;
    }

    return (
      <Component
        {...(props as P)}
        component={displayName}
        instance={instance}
      />
    );
  };

  HOC.displayName = `withTernSecure(${displayName})`;
  return HOC;
};
