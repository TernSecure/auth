import { TernSecureAuthCtx } from '@tern-secure/shared/react';
import type { TernSecureAuth, TernSecureResources } from '@tern-secure/types';
import React from 'react';

type TernSecureContextWrapperProps = {
  ternsecure: TernSecureAuth;
  children: React.ReactNode;
};

type TernSecureAuthProviderState = TernSecureResources;

export function TernSecureContextWrapper(
  props: TernSecureContextWrapperProps,
): React.JSX.Element | null {
  const ternSecure = props.ternsecure;

  const [state, setState] = React.useState<TernSecureAuthProviderState>({
    user: ternSecure.user,
    session: ternSecure.currentSession,
  });

  React.useEffect(() => {
    return ternSecure.addListener(e => setState({ ...e }));
  }, []);

  const ternSecureCtx = React.useMemo(() => ({ value: ternSecure }), []);

  return (
    <TernSecureAuthCtx.Provider value={ternSecureCtx}>{props.children}</TernSecureAuthCtx.Provider>
  );
}
