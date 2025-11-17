import type {
  SignInProps, 
  SignInUIConfig, 
  SignUpProps,
  SignUpUIConfig,
  TernSecureAuth
} from '@tern-secure/types';
import React, { useEffect,useMemo } from 'react';

import { useWaitForComponentMount } from '../hooks/useWaitForComponentMount';
import { TernSecureHostRenderer } from './TernSecureHostRenderer';
import type { FallbackProp} from './withTernSecure';
import { withTernSecure } from './withTernSecure';

const debugLog = (component: string, action: string, data?: any) => {
  console.log(`[TernSecure:${component}] ${action}`, data || '');
};


// Internal component props including instance from withTernSecure
type SignInComponentProps = SignInProps & FallbackProp & {
  component?: string;
  instance: TernSecureAuth;
};


type SignUpComponentProps = SignUpProps & FallbackProp & {
  component?: string;
  instance: TernSecureAuth;
};

export const SignIn = withTernSecure(
  ({ instance, component, fallback }: SignInComponentProps) => {
    const mountingStatus = useWaitForComponentMount(component);
    const shouldShowFallback = mountingStatus === 'rendering' || !instance.isReady;



    const rendererProps = useMemo(() => ({
      signIn: instance.signIn,
    } as SignInUIConfig), [instance.signIn]);

    const rendererRootProps = useMemo(() => ({
      ...(shouldShowFallback && fallback && { style: { display: 'none' } }),
    }), [shouldShowFallback, fallback]);

    return (
      <>
        {shouldShowFallback && fallback}
        {instance.isReady && (
          <TernSecureHostRenderer
            component={component}
            mount={instance.showSignIn}
            unmount={instance.hideSignIn}
            //updateProps={instance.up}
            props={rendererProps}
            rootProps={rendererRootProps}
          />
        )}
      </>
    );
  },
  { component: 'SignIn', renderWhileLoading: true }
);


export const SignUp = withTernSecure(
  ({ instance, component, fallback, forceRedirectUrl }: SignUpComponentProps) => {
    const mountingStatus = useWaitForComponentMount(component);
    const shouldShowFallback = mountingStatus === 'rendering' || !instance.isReady;

    useEffect(() => {
      debugLog('SignUp', 'Instance Status', {
        isReady: instance.isReady,
        mountingStatus,
        hasSignUpMethod: !!instance.showSignUp,
      });
    }, [instance.isReady, mountingStatus, instance.showSignUp]);

{/*    const mount = useCallback((el: HTMLDivElement) => {
      debugLog('SignUp', 'Mounting', { config });
      instance.showSignUp(el, config);
    }, [instance, config]);

    const unmount = useCallback((el: HTMLDivElement) => {
      debugLog('SignUp', 'Unmounting');
      instance.hideSignUp(el);
    }, [instance]);

    const updateProps = useCallback((params: { node: HTMLDivElement; props: SignUpUIConfig }) => {
      debugLog('SignUp', 'Updating Props', params.props);
      instance.showSignUp(params.node, params.props);
    }, [instance]); */}

    const rendererProps = useMemo(() => ({
      forceRedirectUrl,
      signIn: instance.signIn,
    } as SignUpUIConfig), [forceRedirectUrl, instance.signIn]);

    const rendererRootProps = useMemo(() => ({
      ...(shouldShowFallback && fallback && { style: { display: 'none' } }),
    }), [shouldShowFallback, fallback]);

    return (
      <>
        {shouldShowFallback && fallback}
        {instance.isReady && (
          <TernSecureHostRenderer
            component={component}
            mount={instance.showSignUp}
            unmount={instance.hideSignUp}
            //updateProps={instance.}
            props={rendererProps}
            rootProps={rendererRootProps}
          />
        )}
      </>
    );
  },
  { component: 'SignUp', renderWhileLoading: true }
);


export const UserButton = withTernSecure(
  ({ instance, component}) => {
    const mountingStatus = useWaitForComponentMount(component);
    const shouldShowFallback = mountingStatus === 'rendering' || !instance.isReady;

    return (
      <>
        {shouldShowFallback}
        {instance.isReady && (
          <TernSecureHostRenderer
            component={component}
            mount={instance.showUserButton}
            unmount={instance.hideUserButton}
            props={{}}
            rootProps={{
              ...(shouldShowFallback && { style: { display: 'none' } }),
            }}
          />
        )}
      </>
    );
  },
  { component: 'UserButton', renderWhileLoading: true }
);

