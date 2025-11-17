import type { TernSecureAuthOptions } from '@tern-secure/types';
import React from 'react';

const TernSecureInstanceTreeOptionsCtx = React.createContext<TernSecureAuthOptions>({});

export function useTernSecureOptions(): TernSecureAuthOptions {
  const ctx = React.useContext(TernSecureInstanceTreeOptionsCtx);

  if (ctx === undefined) {
    throw new Error(
      'TernSecureInstanceTreeOptions context is not available. Ensure that the context is properly initialized.',
    );
  }
  return ctx;
}
