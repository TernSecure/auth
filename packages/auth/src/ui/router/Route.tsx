import type { JSX } from 'react';
import React from 'react';

import { trimTrailingSlash } from '../../utils';
import { newPaths } from './newPaths';
import { match } from './pathToRegexp';
import { RouteContext, useRouter } from './RouterCtx';

interface SecureRouteProps {
  path?: string;
  index?: boolean;
}

export type RouteProps = React.PropsWithChildren<SecureRouteProps>;

export function Route(props: RouteProps): JSX.Element | null {
  const router = useRouter();

  if (!props.children) {
    return null;
  }

  if (!props.index && !props.path) {
    return <>{props.children}</>;
  }

  if (!router.matches(props.path, props.index)) {
    return null;
  }

  const [indexPath, fullPath] = newPaths(
    router.indexPath,
    router.fullPath,
    props.path,
    props.index,
  );

  const resolve = (to: string, { searchParams }: { searchParams?: URLSearchParams } = {}) => {
    const url = new URL(to, window.location.origin + fullPath + '/');
    if (searchParams) {
      url.search = searchParams.toString();
    }
    url.pathname = trimTrailingSlash(url.pathname);
    return url;
  };

  const newGetMatchData = (path?: string, index?: boolean) => {
    const [newIndexPath, newFullPath] = newPaths(indexPath, fullPath, path, index);
    const currentPath = trimTrailingSlash(router.currentPath);
    const matchResult =
      (path && match(newFullPath + '/:foo*')(currentPath)) ||
      (index && match(newIndexPath)(currentPath)) ||
      (index && match(newFullPath)(currentPath)) ||
      false;
    if (matchResult !== false) {
      return matchResult.params;
    } else {
      return false;
    }
  };
  const rawParams = router.getMatchData(props.path, props.index) || {};
  const paramsDict: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawParams)) {
    paramsDict[key] = value;
  }

  return (
    <RouteContext.Provider
      value={{
        basePath: router.basePath,
        startPath: router.startPath,
        flowStartPath: fullPath,
        fullPath: fullPath,
        indexPath: indexPath,
        currentPath: router.currentPath,
        baseNavigate: router.baseNavigate,
        getMatchData: newGetMatchData,
        matches: (path?: string, index?: boolean) => {
          return newGetMatchData(path, index) ? true : false;
        },
        navigate: (to: string, { searchParams } = {}) => {
          const toURL = resolve(to, { searchParams });
          return router.baseNavigate(toURL);
        },
        resolve,
        refresh: router.refresh,
        params: paramsDict,
        queryString: router.queryString,
        queryParams: router.queryParams,
        urlStateParam: router.urlStateParam,
      }}
    >
      {props.children}
    </RouteContext.Provider>
  );
}

