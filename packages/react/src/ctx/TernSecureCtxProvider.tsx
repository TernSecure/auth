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


  const { isoTernSecureAuth: auth } = useInitTernSecureAuth(instanceOptions);

  const ternAuthCtx = useMemo(() => ({
    value: auth
  }), [auth]);

  const loadingComponent = useMemo(() => (
    <TernSecureAuthCtx.Provider value={ternAuthCtx}>
    </TernSecureAuthCtx.Provider>
  ), [ternAuthCtx])

  
  console.log('[TernSecureCtxProvider] Rendering with auth:', auth);

  return (
    <TernSecureAuthCtx.Provider value={ternAuthCtx}>
      {children}
    </TernSecureAuthCtx.Provider>
  )
}


const useInitTernSecureAuth = (options: IsoTernSecureAuthOptions) => {
  const isoTernSecureAuth = useMemo(() => {
    return IsoTernSecureAuth.initialize(options);
  }, [options]);

  return {
    isoTernSecureAuth
  };
}