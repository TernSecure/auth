import { notFound as nextjsNotFound } from "next/navigation";
import {
  createTernSecureRequest,
  createBackendInstanceEdge,
} from "@tern-secure/backend";
import type { TernSecureRequest, AuthObject } from "@tern-secure/backend";
import { SIGN_IN_URL, SIGN_UP_URL } from "./constant";
import type { NextRequest } from "next/server";
import { NextResponse, NextMiddleware } from "next/server";
import {
  isNextjsNotFoundError,
  nextjsRedirectError,
  redirectToSignInError,
  redirectToSignUpError,
  isRedirectToSignInError,
  isRedirectToSignUpError,
} from "./nextErrors";
import { createRedirect, type RedirectFun } from "./redirect";
import type {
  NextMiddlewareEvtParam,
  NextMiddlewareRequestParam,
  NextMiddlewareReturn,
} from "./types";
import { createProtect, type AuthProtect } from "./protect";

export type MiddlewareAuth = AuthObject & {
  (): Promise<MiddlewareAuthObject>;
  protect: () => AuthProtect;
};

type MiddlewareHandler = (
  auth: MiddlewareAuth,
  request: NextMiddlewareRequestParam,
  event: NextMiddlewareEvtParam
) => NextMiddlewareReturn;

export type MiddlewareAuthObject = AuthObject & {
  redirectToSignIn: RedirectFun<Response>;
  redirectToSignUp: RedirectFun<Response>;
};

const authenticateMiddlewareRequest = async (
  request: NextRequest
): Promise<AuthObject> => {
  const requestState = await createBackendInstanceEdge(request);
  const authResult = requestState.requestState.auth();
  console.log("Auth Result:", authResult);
  return authResult;
};

export interface MiddlewareOptions {
  signInUrl?: string;
  signUpUrl?: string;
  debug?: boolean;
}
type MiddlewareOptionsCallback = (
  req: NextRequest
) => MiddlewareOptions | Promise<MiddlewareOptions>;

interface TernSecureMiddleware {
  /**
   * @example
   * export default ternSecureMiddleware((auth, request, event) => { ... }, options);
   */
  (handler: MiddlewareHandler, options?: MiddlewareOptions): NextMiddleware;

  /**
   * @example
   * export default ternSecureMiddleware((auth, request, event) => { ... }, (req) => options);
   */
  (
    handler: MiddlewareHandler,
    options?: MiddlewareOptionsCallback
  ): NextMiddleware;

  /**
   * @example
   * export default ternSecureMiddleware(options);
   */
  (options?: MiddlewareOptions): NextMiddleware;
  /**
   * @example
   * export default ternSecureMiddleware;
   */
  (
    request: NextMiddlewareRequestParam,
    event: NextMiddlewareEvtParam
  ): NextMiddlewareReturn;
}

export const ternSecureMiddleware = ((
  ...args: unknown[]
): NextMiddleware | NextMiddlewareReturn => {
  const [request, event] = parseRequestAndEvent(args);
  const [handler, params] = parseHandlerAndOptions(args);

  const middleware = () => {
    const withAuthNextMiddleware: NextMiddleware = async (request, event) => {
      const resolvedParams =
        typeof params === "function" ? await params(request) : params;

      const signInUrl = resolvedParams.signInUrl || SIGN_IN_URL;
      const signUpUrl = resolvedParams.signUpUrl || SIGN_UP_URL;

      const authObject = await authenticateMiddlewareRequest(request);

      const ternSecureRequest = createTernSecureRequest(request);

      const { redirectToSignIn } = createMiddlewareRedirects(
        ternSecureRequest,
        signInUrl,
        signUpUrl
      );

      const protect = await createMiddlewareProtect(
        ternSecureRequest,
        authObject,
        redirectToSignIn
      );

      let handlerResult: Response = NextResponse.next();

      if (handler) {
        const createAuthHandler = async (): Promise<MiddlewareAuth> => {
          const getAuth = async (): Promise<MiddlewareAuthObject> => {
            const { redirectToSignUp } = createMiddlewareRedirects(
              ternSecureRequest,
              signInUrl,
              signUpUrl
            );

            return {
              ...authObject,
              redirectToSignIn,
              redirectToSignUp,
            };
          };

          // Return the MiddlewareAuth object with direct property access
          const authHandler = Object.assign(getAuth, {
            protect,
          });

          return authHandler as MiddlewareAuth;
        };

        try {
          const auth = await createAuthHandler();
          const userHandlerResult = await handler(auth, request, event);
          handlerResult = userHandlerResult || handlerResult;
        } catch (error) {
          const ternSecureRequest = createTernSecureRequest(request);
          handlerResult = handleControlError(error, ternSecureRequest, request);
        }

        return handlerResult;
      }

      return handlerResult;
    };

    const nextMiddleware: NextMiddleware = async (request, event) => {
      return withAuthNextMiddleware(request, event);
    };

    if (request && event) {
      return nextMiddleware(request, event);
    }

    return nextMiddleware;
  };
  return middleware();
}) as TernSecureMiddleware;

const parseRequestAndEvent = (args: unknown[]) => {
  return [
    args[0] instanceof Request ? args[0] : undefined,
    args[0] instanceof Request ? args[1] : undefined,
  ] as [
    NextMiddlewareRequestParam | undefined,
    NextMiddlewareEvtParam | undefined,
  ];
};

const parseHandlerAndOptions = (args: unknown[]) => {
  return [
    typeof args[0] === "function" ? args[0] : undefined,
    (args.length === 2
      ? args[1]
      : typeof args[0] === "function"
        ? {}
        : args[0]) || {},
  ] as [
    MiddlewareHandler | undefined,
    MiddlewareOptions | MiddlewareOptionsCallback,
  ];
};

/**
 * Create middleware redirect functions
 */
const createMiddlewareRedirects = (
  ternSecureRequest: TernSecureRequest,
  signInUrl: string,
  signUpUrl: string
) => {
  const redirectToSignIn: MiddlewareAuthObject["redirectToSignIn"] = (
    opts = {}
  ) => {
    const url = signInUrl || ternSecureRequest.ternUrl.toString();
    redirectToSignInError(url, opts.returnBackUrl);
  };

  const redirectToSignUp: MiddlewareAuthObject["redirectToSignUp"] = (
    opts = {}
  ) => {
    const url = signUpUrl || ternSecureRequest.ternUrl.toString();
    redirectToSignUpError(url, opts.returnBackUrl);
  };

  return { redirectToSignIn, redirectToSignUp };
};

const createMiddlewareProtect = async(
  ternSecureRequest: TernSecureRequest,
  authObject: AuthObject,
  redirectToSignIn: RedirectFun<Response>
): Promise<AuthProtect> => {
  const notFound = () => nextjsNotFound();

  const redirect = (url: string) =>
    nextjsRedirectError(url, {
      redirectUrl: url,
    });

  return createProtect({
    request: ternSecureRequest,
    redirect,
    notFound,
    authObject,
    redirectToSignIn,
  });
};

/**
 * Handle control flow errors in middleware
 */
const handleControlError = (
  error: any,
  ternSecureRequest: TernSecureRequest,
  nextrequest: NextRequest
): Response => {
  if (isNextjsNotFoundError(error)) {
    return NextResponse.rewrite(new URL("/404", nextrequest.url));
  }

  // Handle redirect to sign in errors
  if (isRedirectToSignInError(error)) {
    const redirectAdapter = (url: string) =>
      NextResponse.redirect(new URL(url, nextrequest.url));
    const { redirectToSignIn } = createRedirect({
      redirectAdapter,
      baseUrl: ternSecureRequest.ternUrl.origin,
      signInUrl: SIGN_IN_URL,
      signUpUrl: SIGN_UP_URL,
    });

    return redirectToSignIn({ returnBackUrl: error.returnBackUrl });
  }

  // Handle redirect to sign up errors
  if (isRedirectToSignUpError(error)) {
    const redirectAdapter = (url: string) =>
      NextResponse.redirect(new URL(url, nextrequest.url));
    const { redirectToSignUp } = createRedirect({
      redirectAdapter,
      baseUrl: ternSecureRequest.ternUrl.origin,
      signInUrl: SIGN_IN_URL,
      signUpUrl: SIGN_UP_URL,
    });

    return redirectToSignUp({ returnBackUrl: error.returnBackUrl });
  }

  throw error;
};
