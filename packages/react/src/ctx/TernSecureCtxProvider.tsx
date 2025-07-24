'use client'

import React, { useEffect, useState, useMemo } from "react"
import type { 
  IsoTernSecureAuthOptions
} from '../types'
import { IsoTernSecureAuth } from '../lib/isoTernSecureAuth'
import {
  type InitialState,
  type TernSecureResources
} from '@tern-secure/types'
import { 
  TernSecureAuthCtx,
} from '@tern-secure/shared/react'
import { AuthProviderCtx } from "./AuthProvider"
import { deriveAuthState } from "@tern-secure/shared/derivedAuthState"


type TernSecureCtxProviderProps = {
  children: React.ReactNode
  instanceOptions: IsoTernSecureAuthOptions
  initialState: InitialState | undefined
}

export type TernSecureCtxProviderState = TernSecureResources


export function TernSecureCtxProvider(props: TernSecureCtxProviderProps) {
  const { 
    children,
    initialState, 
    instanceOptions
  } = props;
  

  const { isoTernSecureAuth: instance, instanceStatus} = useInitTernSecureAuth(instanceOptions);


  const [authState, setAuthState] = useState<TernSecureCtxProviderState>({
    user: instance.user
  });

  useEffect(() => {
    const unsubscribe = instance.onAuthStateChanged((user) => {
      setAuthState((prevState) => ({
        ...prevState,
        user
      }));
    });
    return () => unsubscribe();
  }, []);


  const derivedState = deriveAuthState(authState, initialState);
  const { 
    token,
    email,
    user, 
    userId
  } = derivedState;

  const authCtx = useMemo(() => {
    const value = {
      userId: userId,
      token: token,
      email: email,
      user: user
    }
    return { value }
  }, [userId, token, email, user]);

  const ternAuthCtx = useMemo(() => ({
    value: instance,
    instanceStatus
  }), [instance, instanceStatus]);


  return (
    <TernSecureAuthCtx.Provider value={ternAuthCtx}>
      <AuthProviderCtx.Provider value={authCtx}>
        {children}
      </AuthProviderCtx.Provider>
    </TernSecureAuthCtx.Provider>
  )
}


const useInitTernSecureAuth = (options: IsoTernSecureAuthOptions) => {

  const isoTernSecureAuth = useMemo(() => {
    return IsoTernSecureAuth.getOrCreateInstance(options);
  }, []);

  
  const [instanceStatus, setInstanceStatus] = useState(isoTernSecureAuth.status)
  const [userStatus, setUserStatus] = useState(isoTernSecureAuth.user)

  useEffect(() => {
    void isoTernSecureAuth.on('status', setInstanceStatus)
    console.warn('[useInitTernSecureAuth] Status changed:', instanceStatus);

    return () => isoTernSecureAuth.off('status', setInstanceStatus);
  }, [isoTernSecureAuth]);

  useEffect(() => {
    const un = isoTernSecureAuth.addListener((event) => {
      console.warn('[useInitTernSecureAuth] Event received:', event);
    });
    return () => un();
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