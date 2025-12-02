import type { TernSecureInitialState } from '@tern-secure/types';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';
import React from 'react';

import { PromiseAuthProvider } from '../../boundary/PromiseAuthProvider';
import { getTernSecureAuthData } from '../../server/data/getAuthDataFromRequest';
import { isNext13 } from '../../server/sdk-versions';
import type { TernSecureNextProps } from '../../types';
import { allNextProviderPropsWithEnv } from '../../utils/allNextProviderProps';
import { ClientTernSecureProvider } from '../client/TernSecureProvider';
import { buildRequestLike, getScriptNonceFromHeader } from './utils';

const getTernSecureState = React.cache(async function getTernSecureState() {
  const request = await buildRequestLike();
  const data = getTernSecureAuthData(request);

  return data;
});

const getNonceHeaders = React.cache(async function getNonceHeaders() {
  const headersList = await headers();
  const nonce = headersList.get('X-Nonce');
  return nonce 
    ? nonce
    : getScriptNonceFromHeader(headersList.get('Content-Security-Policy') || '') || '';
});

export async function TernSecureProvider(props: TernSecureNextProps) {
  const { children, ...rest } = props;
  const { persistence } = rest;

  const browserCookiePersistence = persistence === 'browserCookie';

  async function generateStatePromise() {
    if (!browserCookiePersistence) {
      return Promise.resolve(undefined);
    }
    if (isNext13) {
      return Promise.resolve(await getTernSecureState());
    }
    return getTernSecureState();
  }

  async function generateNonce() {
    if (!browserCookiePersistence) {
      return Promise.resolve('');
    }
    if (isNext13) {
      return Promise.resolve(await getNonceHeaders());
    }
    return getNonceHeaders();
  }

  const providerProps = allNextProviderPropsWithEnv({ ...rest });

  let output: ReactNode;

  if (browserCookiePersistence) {
    output = (
      <PromiseAuthProvider
        authPromise={generateStatePromise() as unknown as Promise<TernSecureInitialState>}
      >
        <ClientTernSecureProvider
          {...providerProps}
          nonce={await generateNonce()}
          initialState={await generateStatePromise()}
        >
          {children}
        </ClientTernSecureProvider>
      </PromiseAuthProvider>
    );
  } else {
    output = (
      <ClientTernSecureProvider
        {...providerProps}
        nonce={await generateNonce()}
        initialState={await getTernSecureState()}
      >
        {children}
      </ClientTernSecureProvider>
    );
  }

  return output;
}
