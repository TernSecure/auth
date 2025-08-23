import { notFound, redirect } from "next/navigation";
import type { BaseUser, RequestLike } from "../../server/types";
import {
  signedInAuthObject,
  createTernSecureRequest,
} from "@tern-secure/backend";
import type { AuthObject } from "@tern-secure/backend";
import { ternDecodeJwt } from "@tern-secure/backend/jwt";
import { createRedirect, type RedirectFun } from "../../server/redirect";
import { createProtect, type AuthProtect } from "../../server/protect";
import { buildRequestLike } from "./utils";
import { getAuthKeyFromRequest, getHeader } from "../../server/headers-utils";
import { SIGN_IN_URL, SIGN_UP_URL } from "../../server/constant";

export interface AuthResult {
  user: BaseUser | null;
  error: Error | null;
}

const COOKIE_NAME = "_session_cookie";

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

const extractSessionToken = (cookieHeader: string | null): string | null => {
  if (!cookieHeader) {
    return null;
  }

  const sessionCookie = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith(`${COOKIE_NAME}=`));

  return sessionCookie?.split("=")[1] || null;
};

function getAuthDataFromRequest(req: RequestLike): AuthObject {
  const cookieHeader = getHeader(req, "Cookie") ?? null;
  const sessionToken = extractSessionToken(cookieHeader);

  if (!sessionToken) {
    throw new Error("No session token found");
  }

  const jwt = ternDecodeJwt(sessionToken);

  return signedInAuthObject(jwt.payload);
}

/**
 * Get the current authenticated user from the session or token
 */
export const auth: AuthFn = async () => {
  require("server-only");

  const request = await buildRequestLike();

  const authObject = await createAuthObject()(request);

  const ternUrl = getAuthKeyFromRequest(request, "TernSecureUrl");

  const createRedirectForRequest = (
    ...args: Parameters<RedirectFun<never>>
  ) => {
    const { returnBackUrl } = args[0] || {};
    const ternSecureRequest = createTernSecureRequest(request);

    return [
      createRedirect({
        redirectAdapter: redirect,
        baseUrl: ternSecureRequest.ternUrl.toString(),
        signInUrl: SIGN_IN_URL,
        signUpUrl: SIGN_UP_URL,
      }),
      returnBackUrl === null ? "" : returnBackUrl || ternUrl?.toString(),
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
  require("server-only");

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
