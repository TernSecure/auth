import React from 'react';

import { useRouter } from '../router';


type StateProps = Partial<Record<'isDisabled' | 'hasError' | 'isLoading' | 'isOpen' | 'isActive', any>>;

type ElementProps = {
  div: React.JSX.IntrinsicElements['div'];
  input: React.JSX.IntrinsicElements['input'];
  button: React.JSX.IntrinsicElements['button'];
  heading: React.JSX.IntrinsicElements['h1'];
  p: React.JSX.IntrinsicElements['p'];
  a: React.JSX.IntrinsicElements['a'];
  label: React.JSX.IntrinsicElements['label'];
  img: React.JSX.IntrinsicElements['img'];
  form: React.JSX.IntrinsicElements['form'];
  table: React.JSX.IntrinsicElements['table'];
  thead: React.JSX.IntrinsicElements['thead'];
  tbody: React.JSX.IntrinsicElements['tbody'];
  th: React.JSX.IntrinsicElements['th'];
  tr: React.JSX.IntrinsicElements['tr'];
  td: React.JSX.IntrinsicElements['td'];
  dl: React.JSX.IntrinsicElements['dl'];
  dt: React.JSX.IntrinsicElements['dt'];
  dd: React.JSX.IntrinsicElements['dd'];
  hr: React.JSX.IntrinsicElements['hr'];
};


type PrimitiveProps<HtmlT extends keyof ElementProps> = ElementProps[HtmlT];
type OwnProps = { isExternal?: boolean; isDisabled?: boolean };
type LinkProps =  PrimitiveProps<'a'> & OwnProps;


export const applyDataStateProps = (props: any) => {
  const { hasError, isDisabled, isLoading, isOpen, isActive, ...rest } = props as StateProps;
  return {
    'data-error': hasError || undefined,
    'data-disabled': isDisabled || undefined,
    'data-loading': isLoading || undefined,
    'data-open': isOpen || undefined,
    'data-active': isActive || undefined,
    ...rest,
  };
};

export const Link = (props: LinkProps): React.JSX.Element => {
  const { isExternal, children, href, onClick, ...rest } = props;

  const onClickHandler = onClick
    ? (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        if (!href) {
          e.preventDefault();
        }
        onClick(e);
      }
    : undefined;

  return (
    <a
      {...rest}
      onClick={onClickHandler}
      href={href || ''}
      target={href && isExternal ? '_blank' : undefined}
      rel={href && isExternal ? 'noopener' : undefined}
    >
      {children}
    </a>
  );
};

type PropsOfComponent<C extends (...args: any[]) => any> = Parameters<C>[0];

type RouterLinkProps = PropsOfComponent<typeof Link> & {
  to?: string;
};

export const RouterLink = (props: RouterLinkProps) => {
  const { to, onClick: onClickProp, ...rest } = props;
  const router = useRouter();

  const toUrl = router.resolve(to || router.indexPath);

  const onClick: React.MouseEventHandler<HTMLAnchorElement> = e => {
    e.preventDefault();
    if (onClickProp && !to) {
      return onClickProp(e);
    }
    return router.navigate(toUrl.href);
  };

  return (
    <Link
      {...rest}
      onClick={onClick}
      href={toUrl.href}
    />
  );
};
