import { useSafeLayoutEffect } from '@tern-secure/shared/react';
import type { TernSecureAuth, TernSecureAuthOptions } from '@tern-secure/types';
import React, { Suspense } from 'react';

import type { TernSecureComponentName } from './lazyLoading/components';
import { preloadComponent } from './lazyLoading/components';
import { LazyComponentRenderer, LazyProviders } from './lazyLoading/providersCtx';
import type { AvailableComponentProps } from './types';

//export const useSafeLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

const ROOT_ELEMENT_ID = 'data-ternsecure-component';


interface HtmlNodeOptions {
  key: string;
  name: TernSecureComponentName;
  appearanceKey: string;
  props?: AvailableComponentProps;
}

export type TernComponentControls = {
  mountComponent: (params: {
    appearanceKey: string;
    name: TernSecureComponentName;
    node: HTMLDivElement;
    props?: AvailableComponentProps;
  }) => void;
  unmountComponent: (params: { node: HTMLDivElement }) => void;
  updateProps: (params: {
    appearanceKey?: string;
    options?: TernSecureAuthOptions | undefined;
    node: HTMLDivElement;
    props?: unknown;
  }) => void;
};

interface ComponentsProps {
  ternsecure: TernSecureAuth;
  options: TernSecureAuthOptions;
  onComponentsMounted: () => void;
}

interface ComponentsState {
  options: TernSecureAuthOptions | undefined;
  nodes: Map<HTMLDivElement, HtmlNodeOptions>;
}

let portalCt = 0;

function assertDOMElement(element: HTMLElement): asserts element {
  if (!element) {
    throw new Error('Element is not a valid DOM element');
  }
}

export const mountComponentRenderer = (
  ternsecure: TernSecureAuth,
  options: TernSecureAuthOptions,
) => {
  let ternsecureRoot = document.getElementById(ROOT_ELEMENT_ID);

  if (!ternsecureRoot) {
    ternsecureRoot = document.createElement('div');
    ternsecureRoot.setAttribute('id', ROOT_ELEMENT_ID);
    document.body.appendChild(ternsecureRoot);
  }

  let componentsControlsResolver: Promise<TernComponentControls> | undefined;

  const createDeferredPromise = () => {
    let resolve: (value?: any) => void = () => {};
    let reject: (value?: any) => void = () => {};
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };


  return {
    ensureMounted: async (opts?: { preloadHint: TernSecureComponentName }) => {
      const { preloadHint } = opts || {};

      if (!componentsControlsResolver) {
        const deferredPromise = createDeferredPromise();
        if (preloadHint) {
          void preloadComponent(preloadHint);
        }
        componentsControlsResolver = import('./lazyLoading/common').then(({ createRoot }) => {
          createRoot(ternsecureRoot).render(
            <Components
              ternsecure={ternsecure}
              options={options}
              onComponentsMounted={deferredPromise.resolve}
            />,
          );
          return deferredPromise.promise.then(() => componentsControls);
        });
      }
      return componentsControlsResolver.then(controls => controls);
    },
  };
};

export type MountComponentRenderer = typeof mountComponentRenderer;

const componentsControls = {} as TernComponentControls;

const Components = (props: ComponentsProps) => {
  const [state, setState] = React.useState<ComponentsState>({
    options: props.options,
    nodes: new Map(),
  });

  const { nodes } = state;

  useSafeLayoutEffect(() => {
    componentsControls.mountComponent = params => {
      const { name, node, props, appearanceKey } = params;
      assertDOMElement(node);
      setState(s => {
        s.nodes.set(node, { key: `p${++portalCt}`, name, props, appearanceKey });
        return { ...s, nodes };
      });
    };

    componentsControls.unmountComponent = params => {
      const { node } = params;
      setState(s => {
        s.nodes.delete(node);
        return { ...s, nodes };
      });
    };

    componentsControls.updateProps = ({ node, props, ...restProps }) => {
      if (node && props && typeof props === 'object') {
        const nodeOptions = state.nodes.get(node);
        if (nodeOptions) {
          nodeOptions.props = { ...props };
          setState(s => ({ ...s }));
          return;
        }
      }
      setState(s => ({ ...s, ...restProps, options: { ...s.options, ...restProps.options } }));
    };

    props.onComponentsMounted();
  }, []);

  return (
    <Suspense fallback={''}>
      <LazyProviders
        ternsecure={props.ternsecure}
        options={state.options}
      >
        {[...nodes].map(([node, component]) => (
          <LazyComponentRenderer
            key={component.key}
            node={node}
            componentName={component.name}
            componentProps={component.props}
            componentKey={component.key}
          />
        ))}
      </LazyProviders>
    </Suspense>
  );
};
