import React, { lazy } from 'react';

import type { TernSecureComponentName } from './components';
import { TernSecureComponents } from './components';

const TernSecureContextWrapper = lazy(() =>
  import('../ctx').then(module => ({ default: module.TernSecureContextWrapper })),
);
const TernSecureOptionsProvider = lazy(() =>
  import('../ctx').then(module => ({ default: module.TernSecureOptionsProvider })),
);
const Portal = lazy(() => import('../portal').then(module => ({ default: module.Portal })));

type LazyComponentRendererProps = React.PropsWithChildren<{
  node: PortalProps['node'];
  componentName: any;
  componentProps: any;
  componentKey: string;
}>;

type PortalProps = Parameters<typeof Portal>[0];

/**
 * LazyProviders handles UI-specific context for lazily loaded components.
 * This separates the UI rendering context from the instance context,
 * making it easier to manage UI-specific concerns.
 */
type LazyProvidersProps = React.PropsWithChildren<{
  ternsecure: any;
  children: any;
  options: any;
}>;
export const LazyProviders = (props: LazyProvidersProps) => {
  return (
    <TernSecureContextWrapper ternsecure={props.ternsecure}>
      <TernSecureOptionsProvider value={props.options}>{props.children}</TernSecureOptionsProvider>
    </TernSecureContextWrapper>
  );
};

/**
 * LazyComponentRenderer handles rendering a single component through a portal
 * with proper Suspense and error boundaries.
 */
export const LazyComponentRenderer = (props: LazyComponentRendererProps) => {
  return (
    <Portal
      node={props.node}
      key={props.componentKey}
      component={TernSecureComponents[props.componentName as TernSecureComponentName]}
      props={props.componentProps}
      componentName={props.componentName}
    />
  );
};
