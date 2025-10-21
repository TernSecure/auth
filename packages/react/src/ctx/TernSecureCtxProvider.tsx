'use client';

import { deriveAuthState } from '@tern-secure/shared/derivedAuthState';
import type  { TernSecureResources, TernSecureStateExtended } from '@tern-secure/types';
import React, { useEffect, useMemo, useState } from 'react';

import { IsoTernSecureAuth } from '../lib/isoTernSecureAuth';
import type { IsoTernSecureAuthOptions } from '../types';
import { AuthProviderCtx } from './AuthProvider';
import { IsoTernSecureAuthCtx } from './IsomorphicTernSecureCtx';

type TernSecureCtxProviderProps = {
  children: React.ReactNode;
  instanceOptions: IsoTernSecureAuthOptions;
  initialState: TernSecureStateExtended | undefined;
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

  const derivedState = deriveAuthState(instance.isReady, authState, initialState);
  const { sessionClaims, user, userId } = derivedState;

  const authCtx = useMemo(() => {
    const value = {
      userId: userId,
      user: user,
      sessionClaims: sessionClaims,
    };
    return { value };
  }, [userId, user, sessionClaims]);

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
    void isoTernSecureAuth.initialize();
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
