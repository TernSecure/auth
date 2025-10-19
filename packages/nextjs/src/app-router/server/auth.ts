import type { AuthObject } from '@tern-secure/backend';
import { createTernSecureRequest } from '@tern-secure/backend';
import { notFound, redirect } from 'next/navigation';

import { SIGN_IN_URL, SIGN_UP_URL } from '../../server/constant';
import { getAuthDataFromRequest } from '../../server/data/getAuthDataFromRequest';
import { getAuthKeyFromRequest } from '../../server/headers-utils';
import { type AuthProtect, createProtect } from '../../server/protect';
import { createRedirect, type RedirectFun } from '../../server/redirect';
import type { BaseUser, RequestLike } from '../../server/types';
import { buildRequestLike } from './utils';

export interface AuthResult {
  user: BaseUser | null;
  error: Error | null;
}

/**
 * `Auth` object of the currently active user and the `redirectToSignIn()` method.
 */
type Auth = AuthObject & {
  redirectToSignIn: RedirectFun<ReturnType<typeof redirect>>;
  redirectToSignUp: RedirectFun<ReturnType<typeof redirect>>;
};

export interface AuthFn {
  (): Promise<Auth>;

  protect: AuthProtect;
}

const createAuthObject = () => {
  return async (req: RequestLike) => {
    return getAuthDataFromRequest(req);
  };
};

/**
 * Get the current authenticated user from the session or token
 */
export const auth: AuthFn = async () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('server-only');

  const request = await buildRequestLike();

  const authObject = await createAuthObject()(request);

  const ternUrl = getAuthKeyFromRequest(request, 'TernSecureUrl');

  const createRedirectForRequest = (...args: Parameters<RedirectFun<never>>) => {
    const { returnBackUrl } = args[0] || {};
    const ternSecureRequest = createTernSecureRequest(request);

    return [
      createRedirect({
        redirectAdapter: redirect,
        baseUrl: ternSecureRequest.ternUrl.toString(),
        signInUrl: SIGN_IN_URL,
        signUpUrl: SIGN_UP_URL,
      }),
      returnBackUrl === null ? '' : returnBackUrl || ternUrl?.toString(),
    ] as const;
  };

  const redirectToSignIn: RedirectFun<never> = (opts = {}) => {
    const [r, returnBackUrl] = createRedirectForRequest(opts);
    return r.redirectToSignIn({
      returnBackUrl,
    });
  };

  const redirectToSignUp: RedirectFun<never> = (opts = {}) => {
    const [r, returnBackUrl] = createRedirectForRequest(opts);
    return r.redirectToSignUp({
      returnBackUrl,
    });
  };

  return Object.assign(authObject, { redirectToSignIn, redirectToSignUp });
};

auth.protect = async (...args: any[]) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('server-only');

  const request = await buildRequestLike();
  const authObject = await auth();

  const protect = createProtect({
    request,
    authObject,
    redirectToSignIn: authObject.redirectToSignIn,
    notFound,
    redirect,
  });

  return protect(...args);
};
