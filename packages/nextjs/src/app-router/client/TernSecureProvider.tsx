'use client';

import { TernSecureProvider as TernSecureReactProvider } from '@tern-secure/react';

import { TernNextOptionsProvider, useTernNextOptions } from '../../boundary/NextOptionsCtx';
import type { TernSecureNextProps } from '../../types';
import { allNextProviderPropsWithEnv } from '../../utils/allNextProviderProps';

const NextClientProvider = (props: TernSecureNextProps) => {
  const { children } = props;

  const isNested = Boolean(useTernNextOptions());
  if (isNested) {
    return props.children;
  }

  const providerProps = allNextProviderPropsWithEnv({...props});
  return (
    <TernNextOptionsProvider options={providerProps}>
      <TernSecureReactProvider {...providerProps}>
        {children}
      </TernSecureReactProvider>
    </TernNextOptionsProvider>
  );
};

export const ClientTernSecureProvider = (props: TernSecureNextProps) => {
  const { children, ...rest } = props;
  return (
    <NextClientProvider {...rest}>
      {children}
    </NextClientProvider>
  );
};
