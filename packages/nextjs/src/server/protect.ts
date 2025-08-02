import { isNextFetcher } from './nextFetcher';
import type { CheckCustomClaims } from '@tern-secure/types';
import type { RedirectFun } from './redirect';
import type { AuthObject } from '@tern-secure/backend';

type AuthProtectOptions = {
  /**
   * The URL to redirect the user to if they are not authorized.
   */
  unauthorizedUrl?: string;
  /**
   * The URL to redirect the user to if they are not authenticated.
   */
  unauthenticatedUrl?: string;
};

export interface AuthProtect {
  (params?: (has: CheckCustomClaims) => boolean, options?: AuthProtectOptions): void;
  (options?: AuthProtectOptions): void;

}

export function createProtect(opts: {
  request: Request;
  authObject: AuthObject;
  notFound: () => never;
  redirect: (url: string) => void;
  redirectToSignIn: RedirectFun<unknown>;
}) {
  const { redirectToSignIn, authObject, redirect, notFound, request } = opts;

  return (params?: ((has: CheckCustomClaims) => boolean) | AuthProtectOptions, options?: AuthProtectOptions): void => {
    // Handle overloaded parameters
    let checkCustomClaims: ((has: CheckCustomClaims) => boolean) | undefined;
    let protectOptions: AuthProtectOptions = {};

    if (typeof params === 'function') {
      checkCustomClaims = params;
      protectOptions = options || {};
    } else {
      protectOptions = params || {};
    }

    // Check if user is authenticated
    if (!authObject || !authObject.userId || !authObject.session) {
      if (protectOptions.unauthenticatedUrl) {
        redirect(protectOptions.unauthenticatedUrl);
        return;
      }
      redirectToSignIn({ returnBackUrl: request.url });
      return;
    }

    // Check custom claims if provided
    if (checkCustomClaims) {
      const has: CheckCustomClaims = {
        role: undefined as never,
        permissions: undefined as never,
      };

      const isAuthorized = checkCustomClaims(has);
      if (!isAuthorized) {
        if (protectOptions.unauthorizedUrl) {
          redirect(protectOptions.unauthorizedUrl);
          return;
        }
        notFound();
        return;
      }
    }
  };
}
