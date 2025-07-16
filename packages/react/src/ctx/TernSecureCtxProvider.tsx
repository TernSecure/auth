'use client'

import React, { useEffect, useState, useMemo, use } from "react"
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
  
  
  const [currentAuthState, setCurrentAuthState] = useState<TernSecureState>(
    initialState || DEFAULT_TERN_SECURE_STATE
  );

  const { isoTernSecureAuth: instance, instanceStatus} = useInitTernSecureAuth(instanceOptions);


  useEffect(() => {
    const unsubscribe = instance.onAuthStateChanged((user) => {
      console.log('[TernSecureCtxProvider] - Auth state changed:', user);
      setCurrentAuthState(instance.internalAuthState);
    });
    return () => unsubscribe();
  }, []);


  const ternAuthCtx = useMemo(() => ({
    value: instance,
    instanceStatus,
    internalAuthState: currentAuthState,
  }), [instance, instanceStatus, currentAuthState]);

  const loadingComponent = useMemo(() => (
      <div aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading authentication state...</span>
      </div>
  ), [ternAuthCtx]);


  if (instanceStatus === 'loading' && !instance.internalAuthState.isLoaded) {
    return loadingComponent;
  }

  console.log('[TernSecureCtxProvider] - TernSecureAuth instance initialized:', instance);
  console.log('[TernSecureCtxProvider] - Auth state:', currentAuthState);
  console.log('[TernSecureCtxProvider] - Internal status:', instance.internalAuthState);


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
      setInstanceStatus(newStatus);
      console.warn('[useInitTernSecureAuth] Status changed:', newStatus);
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