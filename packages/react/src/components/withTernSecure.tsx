import type { TernSecureAuth, Without } from '@tern-secure/types';
import React from 'react';

import { useIsoTernSecureAuthCtx } from '../ctx/IsomorphicTernSecureCtx';
import { useAssertWrappedByTernSecureAuthProvider } from '../hooks/useAssertWrappedTernSecureProvider';


export const withTernSecure = <P extends { ternsecure: TernSecureAuth; component?: string }>(
  Component: React.ComponentType<P>,
  displayNameOrOptions?: string | { component: string; renderWhileLoading?: boolean },
) => {
  const passedDisplayName = typeof displayNameOrOptions === 'string' ? displayNameOrOptions : displayNameOrOptions?.component;
  const displayName = passedDisplayName || Component.displayName || Component.name || 'Component';
  Component.displayName = displayName;

  const options = typeof displayNameOrOptions === 'string' ? undefined : displayNameOrOptions;

  const HOC = (props: Without<P, 'ternsecure'>) => {
    useAssertWrappedByTernSecureAuthProvider(displayName || 'withTernSecure');

    const ternsecure = useIsoTernSecureAuthCtx();

    if (!ternsecure.isReady && !options?.renderWhileLoading) {
      return null;
    }

    return (
      <Component
        {...(props as P)}
        component={displayName}
        ternsecure={ternsecure}
      />
    );
  };

  HOC.displayName = `withTernSecure(${displayName})`;
  return HOC;
};
