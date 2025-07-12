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
  console.log('[TernSecureCtxProvider] Initialized auth:', auth);

  const contextValue = useMemo(() => ({
    value: auth
  }), [auth]);

  if (!auth?.isReady) {
    return (
      <TernSecureAuthCtx.Provider value={contextValue}>
      </TernSecureAuthCtx.Provider>
    );
  }

  return (
    <TernSecureAuthCtx.Provider value={contextValue}>
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