import { without } from '@tern-secure/shared/object';
import { isDeeplyEqual } from '@tern-secure/shared/react';
import type { PropsWithChildren } from 'react';
import React from 'react';

import type { MountProps, OpenProps } from '../types';

const isMountProps = (props: any): props is MountProps => {
  return 'mount' in props;
};

const isOpenProps = (props: any): props is OpenProps => {
  return 'open' in props;
};

const stripMenuItemIconHandlers = (
  menuItems?: Array<{
    mountIcon?: (el: HTMLDivElement) => void;
    unmountIcon?: (el: HTMLDivElement) => void;
    [key: string]: any;
  }>,
) => {
  return menuItems?.map(({ mountIcon, unmountIcon, ...rest }) => rest);
};

type HostRendererProps = PropsWithChildren<
  (MountProps | OpenProps) & {
    component?: string;
    hideRootHtmlElement?: boolean;
    rootProps?: React.JSX.IntrinsicElements['div'];
  }
>;

/**
 * TernSecureHostRenderer is responsible for the actual mounting/unmounting of UI components
 * from the @tern-secure/auth package. It handles the lifecycle of the mounted component
 * and ensures proper cleanup.
 */
export class TernSecureHostRenderer extends React.PureComponent<HostRendererProps> {
  private rootRef = React.createRef<HTMLDivElement>();

  componentDidUpdate(_prevProps: Readonly<MountProps | OpenProps>) {
    if (!isMountProps(_prevProps) || !isMountProps(this.props)) {
      return;
    }

    const prevProps = without(_prevProps.props, 'customPages', 'customMenuItems', 'children');
    const newProps = without(this.props.props, 'customPages', 'customMenuItems', 'children');

    const customPagesChanged = prevProps.customPages?.length !== newProps.customPages?.length;
    const customMenuItemsChanged =
      prevProps.customMenuItems?.length !== newProps.customMenuItems?.length;

    const prevMenuItemsWithoutHandlers = stripMenuItemIconHandlers(
      _prevProps.props.customMenuItems,
    );
    const newMenuItemsWithoutHandlers = stripMenuItemIconHandlers(this.props.props.customMenuItems);

    if (
      !isDeeplyEqual(prevProps, newProps) ||
      !isDeeplyEqual(prevMenuItemsWithoutHandlers, newMenuItemsWithoutHandlers) ||
      customPagesChanged ||
      customMenuItemsChanged
    ) {
      if (this.rootRef.current) {
        this.props.updateProps({ node: this.rootRef.current, props: this.props.props });
      }
    }
  }

  componentDidMount() {
    if (this.rootRef.current) {
      if (isMountProps(this.props)) {
        this.props.mount(this.rootRef.current, this.props.props);
      }

      if (isOpenProps(this.props)) {
        this.props.open(this.props.props);
      }
    }
  }

  componentWillUnmount() {
    if (this.rootRef.current) {
      if (isMountProps(this.props)) {
        this.props.unmount(this.rootRef.current);
      }
      if (isOpenProps(this.props)) {
        this.props.close();
      }
    }
  }

  render() {
    const { hideRootHtmlElement = false } = this.props;
    const rootAttributes = {
      ref: this.rootRef,
      ...this.props.rootProps,
      ...(this.props.component && { 'data-ternsecure-component': this.props.component }),
    };

    return (
      <>
        {!hideRootHtmlElement && <div {...rootAttributes} />}
        {this.props.children}
      </>
    );
  }
}
