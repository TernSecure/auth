'use client'

import React, { useEffect, useState, useMemo } from "react"
import type { 
  IsoTernSecureAuthOptions
} from '../types'
import { IsoTernSecureAuth } from '../lib/isoTernSecureAuth'
import {
  DEFAULT_TERN_SECURE_STATE,
  type TernSecureState
} from '@tern-secure/types'
import { 
  TernSecureAuthCtx,
} from '@tern-secure/shared/react'
import { deriveAuthState } from "@tern-secure/shared/derivedAuthState"
import { UserContext } from './UserCtx'
import { useRouter } from 'next/navigation'


type TernSecureCtxProviderProps = {
  children: React.ReactNode
  instanceOptions: IsoTernSecureAuthOptions
  initialState: TernSecureState | undefined
}

export type AuthStateProps = {
  authState: TernSecureState
}


export function TernSecureCtxProvider(props: TernSecureCtxProviderProps) {
  const { 
    children,
    initialState, 
    instanceOptions
  } = props;
  const router = useRouter();
  
  
  const [currentAuthState, setCurrentAuthState] = useState<TernSecureState>(
    initialState || DEFAULT_TERN_SECURE_STATE
  );

  const { isoTernSecureAuth: instance, instanceStatus} = useInitTernSecureAuth(instanceOptions);


  useEffect(() => {
    const unsubscribe = instance.onAuthStateChanged((user) => {
      setCurrentAuthState(instance.internalAuthState);
    });
    return () => unsubscribe();
  }, []);


  const deriveState = deriveAuthState(currentAuthState);
  const { user, userId } = deriveState;

  const ternAuthCtx = useMemo(() => ({
    value: instance,
    instanceStatus,
    internalAuthState: currentAuthState,
  }), [instance, instanceStatus, currentAuthState]);

  const userCtx = useMemo(() => ({
    value: user
  }), [user, userId]);

  const loadingComponent = useMemo(() => (
    <TernSecureAuthCtx.Provider value={ternAuthCtx}>
      <div aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading authentication state...</span>
      </div>
    </TernSecureAuthCtx.Provider>
  ), [ternAuthCtx]);

  if (instanceStatus === 'loading' || !currentAuthState.isLoaded) {
    return loadingComponent;
  }


  return (
    <TernSecureAuthCtx.Provider value={ternAuthCtx}>
        {children}
    </TernSecureAuthCtx.Provider>
  )
}


const useInitTernSecureAuth = (options: IsoTernSecureAuthOptions) => {

  const isoTernSecureAuth = useMemo(() => {
    return IsoTernSecureAuth.getOrCreateInstance(options);
  }, []);

  
  const [instanceStatus, setInstanceStatus] = useState(isoTernSecureAuth.status)


  useEffect(() => {
    const unsubscribeStatus = isoTernSecureAuth.events.onStatusChanged((newStatus) => {
      console.warn('[useInitTernSecureAuth] Status changed:', newStatus);
      setInstanceStatus(newStatus);
    });

    return () => unsubscribeStatus();
  }, [isoTernSecureAuth]);

  useEffect(() => {
    isoTernSecureAuth.initialize()
  }, [isoTernSecureAuth]);

  useEffect(() => {
    return () => {
      IsoTernSecureAuth.clearInstance();
    };
  }, []);

  return {
    isoTernSecureAuth,
    instanceStatus
  };
}