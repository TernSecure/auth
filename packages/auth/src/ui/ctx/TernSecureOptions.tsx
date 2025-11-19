import type { TernSecureAuthOptions } from '@tern-secure/types';
import React from 'react';

export const TernSecureAuthOptionsCtx = React.createContext<TernSecureAuthOptions>({});

interface OptionsProviderProps {
  children: React.ReactNode;
  value: TernSecureAuthOptions;
}

function TernSecureOptionsProvider({ children, value }: OptionsProviderProps) {
  return <TernSecureAuthOptionsCtx.Provider value={value}>{children}</TernSecureAuthOptionsCtx.Provider>;
}

function useTernSecureOptions(): TernSecureAuthOptions {
  const ctx = React.useContext(TernSecureAuthOptionsCtx);
  if (ctx === undefined) {
    throw new Error(
      'TernSecureAuthOptions context is not available. Ensure that the context is properly initialized.',
    );
  }
  return ctx;
}

export { useTernSecureOptions, TernSecureOptionsProvider };
