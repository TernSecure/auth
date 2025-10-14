'use client';

import { deriveAuthState } from '@tern-secure/shared/derivedAuthState';
import { type InitialState, type TernSecureResources } from '@tern-secure/types';
import React, { useEffect, useMemo, useState } from 'react';

import { IsoTernSecureAuth } from '../lib/isoTernSecureAuth';
import type { IsoTernSecureAuthOptions } from '../types';
import { AuthProviderCtx } from './AuthProvider';
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
    session: instance.currentSession,
  });

  React.useEffect(() => {
    return instance.addListener(e => setAuthState({ ...e }));
  }, []);

  const derivedState = deriveAuthState(authState, initialState);
  const { email, user, userId } = derivedState;

  const authCtx = useMemo(() => {
    const value = {
      userId: userId,
      email: email,
      user: user,
    };
    return { value };
  }, [userId, email, user]);

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
