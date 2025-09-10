'use client';

import React, { useEffect, useState, useMemo } from 'react';
import type { IsoTernSecureAuthOptions } from '../types';
import { IsoTernSecureAuth } from '../lib/isoTernSecureAuth';
import { type InitialState, type TernSecureResources } from '@tern-secure/types';
import { AuthProviderCtx } from './AuthProvider';
import { deriveAuthState } from '@tern-secure/shared/derivedAuthState';
import { IsoTernSecureAuthCtx } from './IsomorphicTernSecureCtx';

type TernSecureCtxProviderProps = {
  children: React.ReactNode;
  instanceOptions: IsoTernSecureAuthOptions;
  initialState: InitialState | undefined;
};

export type TernSecureCtxProviderState = TernSecureResources;

export function TernSecureCtxProvider(props: TernSecureCtxProviderProps) {
  const { children, initialState, instanceOptions } = props;

  const { isoTernSecureAuth: instance, instanceStatus } = useInitTernSecureAuth(instanceOptions);

  const [authState, setAuthState] = useState<TernSecureCtxProviderState>({
    user: instance.user,
  });

  React.useEffect(() => {
    return instance.addListener(e => setAuthState({ ...e }));
  }, []);

  const derivedState = deriveAuthState(authState, initialState);
  const { token, email, user, userId } = derivedState;

  const authCtx = useMemo(() => {
    const value = {
      userId: userId,
      token: token,
      email: email,
      user: user,
    };
    return { value };
  }, [userId, token, email, user]);

  const ternAuthCtx = useMemo(
    () => ({
      value: instance,
      instanceStatus,
    }),
    [instance, instanceStatus],
  );

  return (
    <IsoTernSecureAuthCtx.Provider value={ternAuthCtx}>
      <AuthProviderCtx.Provider value={authCtx}>{children}</AuthProviderCtx.Provider>
    </IsoTernSecureAuthCtx.Provider>
  );
}

const useInitTernSecureAuth = (options: IsoTernSecureAuthOptions) => {
  const isoTernSecureAuth = useMemo(() => {
    return IsoTernSecureAuth.getOrCreateInstance(options);
  }, []);

  const [instanceStatus, setInstanceStatus] = useState(isoTernSecureAuth.status);

  useEffect(() => {
    void isoTernSecureAuth.on('status', setInstanceStatus);
    console.warn('[useInitTernSecureAuth] Status changed:', instanceStatus);

    return () => isoTernSecureAuth.off('status', setInstanceStatus);
  }, [isoTernSecureAuth]);

  useEffect(() => {
    const un = isoTernSecureAuth.addListener(event => {
      console.warn('[useInitTernSecureAuth] Event received:', event);
    });
    return () => un();
  }, [isoTernSecureAuth]);

  useEffect(() => {
    isoTernSecureAuth.initialize();
  }, [isoTernSecureAuth]);

  useEffect(() => {
    return () => {
      IsoTernSecureAuth.clearInstance();
    };
  }, []);

  return {
    isoTernSecureAuth,
    instanceStatus,
  };
};
