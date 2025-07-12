'use client'

import React, { useEffect, useState, useMemo } from "react"
import { IsomorphicTernSecureCtx } from "./IsomorphicTernSecureCtx"
import type { 
  IsomorphicTernSecureOptions,
} from '../types'
import {
  DEFAULT_TERN_SECURE_STATE,
  type TernSecureState
} from '@tern-secure/types'
import { 
  TernSecureAuthContext,
} from '@tern-secure/shared/react'


type TernSecureCtxProviderProps = {
  children: React.ReactNode
  instanceOptions: IsomorphicTernSecureOptions
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
  } = props
  
  
  const [currentAuthState, setCurrentAuthState] = useState<TernSecureState>(
    initialState || DEFAULT_TERN_SECURE_STATE
  );

  const { isomorphicTernSecure: instance, instanceStatus } = useLoadIsomorphicTernSecure(instanceOptions)

  
  useEffect(() => {
    const unsubscribe = instance.events.onAuthStateChanged(setCurrentAuthState);
    return () => unsubscribe?.();
  }, [instance]);


  const ternsecureCtx = useMemo(() => ({
    value: instance,
    instanceStatus
  }), [instance, instanceStatus]);


  const ternAuthCtx = useMemo(() => {
    const value = {
      authProvider: instance.ternAuth,
      authState: currentAuthState,
    }

    return { value}
  }, [instance.ternAuth, currentAuthState]);
  
  const loadingComponent = useMemo(() => (
    <IsomorphicTernSecureCtx.Provider value={ternsecureCtx}>
    </IsomorphicTernSecureCtx.Provider>
  ), [ternsecureCtx, ternAuthCtx])


  if (instanceStatus === 'loading' || !instance.ternAuth) {
    return loadingComponent;
  }


  return (
     <TernSecureAuthContext.Provider value={ternAuthCtx}>
      {children}
    </TernSecureAuthContext.Provider>
  )
}