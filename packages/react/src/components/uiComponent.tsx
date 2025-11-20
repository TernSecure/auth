import type {
  SignInProps,
  SignUpProps,
} from '@tern-secure/types';

import { useWaitForComponentMount } from '../hooks/useWaitForComponentMount';
import type { WithTernSecureProp } from '../types';
import { TernSecureHostRenderer } from './TernSecureHostRenderer';
import { withTernSecure } from './withTernSecure';

type FallbackProp = {
  /**
   * An optional element to render while the component is mounting.
   */
  fallback?: React.ReactNode;
};

// Internal component props including ternsecure instance from withTernSecure
type SignInComponentProps = WithTernSecureProp<SignInProps> & FallbackProp;

type SignUpComponentProps = WithTernSecureProp<SignUpProps> & FallbackProp;

export const SignIn = withTernSecure(
  ({ ternsecure, component, fallback, ...props }: SignInComponentProps) => {
    const mountingStatus = useWaitForComponentMount(component);
    const shouldShowFallback = mountingStatus === 'rendering' || !ternsecure.isReady;

    const rendererRootProps =  {
      ...(shouldShowFallback && fallback && { style: { display: 'none' } }),
    }

    return (
      <>
        {shouldShowFallback && fallback}
        {ternsecure.isReady && (
          <TernSecureHostRenderer
            component={component}
            mount={ternsecure.showSignIn}
            unmount={ternsecure.hideSignIn}
            updateProps={(ternsecure as any).__unstable__updateProps}
            props={props}
            rootProps={rendererRootProps}
          />
        )}
      </>
    );
  },
  { component: 'SignIn', renderWhileLoading: true },
);

export const SignUp = withTernSecure(
  ({ ternsecure, component, fallback, ...props }: SignUpComponentProps) => {
    const mountingStatus = useWaitForComponentMount(component);
    const shouldShowFallback = mountingStatus === 'rendering' || !ternsecure.isReady;

    const rendererRootProps = {
      ...(shouldShowFallback && fallback && { style: { display: 'none' } }),
    }

    return (
      <>
        {shouldShowFallback && fallback}
        {ternsecure.isReady && (
          <TernSecureHostRenderer
            component={component}
            mount={ternsecure.showSignUp}
            unmount={ternsecure.hideSignUp}
            updateProps={(ternsecure as any).__unstable__updateProps}
            props={props}
            rootProps={rendererRootProps}
          />
        )}
      </>
    );
  },
  { component: 'SignUp', renderWhileLoading: true },
);

export const UserButton = withTernSecure(
  ({ ternsecure, component }) => {
    const mountingStatus = useWaitForComponentMount(component);
    const shouldShowFallback = mountingStatus === 'rendering' || !ternsecure.isReady;

    return (
      <>
        {shouldShowFallback}
        {ternsecure.isReady && (
          <TernSecureHostRenderer
            component={component}
            mount={ternsecure.showUserButton}
            unmount={ternsecure.hideUserButton}
            updateProps={(ternsecure as any).__unstable__updateProps}
            props={{}}
            rootProps={{
              ...(shouldShowFallback && { style: { display: 'none' } }),
            }}
          />
        )}
      </>
    );
  },
  { component: 'UserButton', renderWhileLoading: true },
);
