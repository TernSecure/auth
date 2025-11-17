import type { RoutingOptions } from '@tern-secure/types';
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';

import { PRESERVED_QUERYSTRING_PARAMS } from '../../instance/constants';
import { normalizeRoutingOptions } from '../../utils/normalizeRoutingOptions';
import { TernAuthUIComponentProvider } from '../ctx';
import { HashRouter, PathRouter } from '../router';
import type { AvailableComponentCtx, AvailableComponentName } from '../types';

type PortalProps<
  CtxType extends AvailableComponentCtx,
  PropsType = Omit<CtxType, 'componentName'>,
> = {
  node: HTMLDivElement;
  component: React.FunctionComponent<PropsType> | React.ComponentClass<PropsType, any>;
  props?: PropsType & RoutingOptions;
} & { componentName: AvailableComponentName };

export function Portal<CtxType extends AvailableComponentCtx>({
  props,
  component,
  componentName,
  node,
}: PortalProps<CtxType>) {
  const normalizedProps = {
    ...props,
    ...normalizeRoutingOptions({ routing: props?.routing, path: props?.path }),
  };

  const cml = (
    <TernAuthUIComponentProvider
      componentName={componentName}
      props={normalizedProps}
    >
      <Suspense fallback={''}>
        {React.createElement(component, normalizedProps as PortalProps<CtxType>['props'])}
      </Suspense>
    </TernAuthUIComponentProvider>
  );

  if (normalizedProps?.routing === 'path') {
    if (!normalizedProps?.path) {
      throw new Error('PathRouter requires a path to be specified in routing options.');
    }

    return ReactDOM.createPortal(
      <PathRouter
        preservedParams={PRESERVED_QUERYSTRING_PARAMS}
        basePath={normalizedProps.path}
      >
        {cml}
      </PathRouter>,
      node,
    );
  }
  return ReactDOM.createPortal(
    <HashRouter preservedParams={PRESERVED_QUERYSTRING_PARAMS}>{cml}</HashRouter>,
    node,
  );
}
