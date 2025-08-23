import { notFound as nextjsNotFound } from "next/navigation";
import {
  constants,
  createTernSecureRequest,
  createBackendInstanceEdge,
  createBackendInstanceClient,
  enableDebugLogging,
  validateCheckRevokedOptions,
} from "@tern-secure/backend";
import type {
  TernSecureRequest,
  AuthObject,
  CheckRevokedOptions,
  RequestOptions,
} from "@tern-secure/backend";
import { SIGN_IN_URL, SIGN_UP_URL, API_URL, API_VERSION } from "./constant";
import { NextRequest } from "next/server";
import { NextResponse, NextMiddleware } from "next/server";
import {
  isNextjsNotFoundError,
  nextjsRedirectError,
  redirectToSignInError,
  redirectToSignUpError,
  isRedirectToSignInError,
  isRedirectToSignUpError,
  isNextjsRedirectError,
} from "./nextErrors";
import { createRedirect, type RedirectFun } from "./redirect";
import { isRedirect, setHeader } from "../utils/response";
import { serverRedirectWithAuth } from "../utils/serverRedirectAuth";
import type {
  NextMiddlewareEvtParam,
  NextMiddlewareRequestParam,
  NextMiddlewareReturn,
} from "./types";
import { createProtect, type AuthProtect } from "./protect";
import {
  CheckAuthorizationFromSessionClaims,
  CookieOptions,
} from "@tern-secure/types";
import { createEdgeCompatibleLogger } from "../utils/withLogger";
import { decorateRequest } from "./utils";

export type MiddlewareAuthObject = AuthObject & {
  redirectToSignIn: RedirectFun<Response>;
  redirectToSignUp: RedirectFun<Response>;
};

export interface MiddlewareAuth {
  (): Promise<MiddlewareAuthObject>;

  protect: AuthProtect;
}

type MiddlewareHandler = (
  auth: MiddlewareAuth,
  request: NextMiddlewareRequestParam,
  event: NextMiddlewareEvtParam
) => NextMiddlewareReturn;

interface AuthenticationResult {
  authObject: AuthObject;
  headers: Headers;
}

const authenticateMiddlewareRequest = async (
  request: NextRequest,
  checkRevoked: CheckRevokedOptions | undefined,
  logger: ReturnType<typeof createEdgeCompatibleLogger>
): Promise<AuthenticationResult> => {
  try {
    const reqBackend = await createBackendInstanceEdge(request, checkRevoked);
    const requestState = reqBackend.requestState;
    const authResult = requestState.auth();
    logger.debug("Auth Result:", authResult);
    return {
      authObject: authResult,
      headers: requestState.headers,
    };
  } catch (error) {
    logger.error(
      "Auth check error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return {
      authObject: {
        session: null,
        userId: null,
        has: {} as CheckAuthorizationFromSessionClaims,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      headers: new Headers(request.headers),
    };
  }
};

export interface MiddlewareOptions extends RequestOptions {
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

const backendClientDefaultOptions = {
  apiUrl: API_URL,
  apiVersion: API_VERSION,
};

const ternSecureBackendClient = async () => {
  return createBackendClientWithOptions({});
};

const createBackendClientWithOptions: typeof createBackendInstanceClient = (
  options
) => {
  return createBackendInstanceClient({
    ...backendClientDefaultOptions,
    ...options,
  });
};

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

      const options = {
        signInUrl,
        signUpUrl,
        ...resolvedParams,
      };

      const logger = createEdgeCompatibleLogger(options.debug);

      if (options.debug) {
        enableDebugLogging();
      }

      //const { authObject, headers: authHeaders } =
      //  await authenticateMiddlewareRequest(request, checkRevoked, logger);

      //const reqBackend = await createBackendInstanceEdge(request, checkRevoked);
      const reqBackendClient = await ternSecureBackendClient();
      //const requestState = reqBackend.requestState;
      //const authObject = requestState.auth();
      //const authHeaders = requestState.headers;

      const ternSecureRequest = createTernSecureRequest(request);

      const requestStateClient = await reqBackendClient.authenticateRequest(
        ternSecureRequest,
        options
      );

      const authObjectClient = requestStateClient.auth();

      const { redirectToSignIn } = createMiddlewareRedirects(ternSecureRequest);

      const { redirectToSignUp } = createMiddlewareRedirects(ternSecureRequest);

      const protect = await createMiddlewareProtect(
        ternSecureRequest,
        authObjectClient,
        redirectToSignIn
      );

      //const createAuthHandler = (): MiddlewareAuth => {
      //  const getAuth = async (): Promise<MiddlewareAuthObject> => {
      //    return {
      //     ...authObject,
      //     redirectToSignIn,
      //      redirectToSignUp,
      //   };
      // };

      // const authHandler = Object.assign(getAuth, {
      //   protect,
      // });

      //  return authHandler as MiddlewareAuth;
      // };

      const authObj: MiddlewareAuthObject = Object.assign(authObjectClient, {
        redirectToSignIn,
        redirectToSignUp,
      });

      const authHandler = () => Promise.resolve(authObj);
      authHandler.protect = protect;

      let handlerResult: Response = NextResponse.next();

      try {
        //const auth = createAuthHandler();
        const userHandlerResult = await handler?.(authHandler, request, event);
        handlerResult = userHandlerResult || handlerResult;
      } catch (error: any) {
        handlerResult = handleControlError(error, ternSecureRequest, request);
      }

      if (requestStateClient.headers) {
        requestStateClient.headers.forEach((value, key) => {
          handlerResult.headers.append(key, value);
        });
      }

      if (isRedirect(handlerResult)) {
        return serverRedirectWithAuth(ternSecureRequest, handlerResult);
      }

      decorateRequest(ternSecureRequest, handlerResult, requestStateClient);
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
const createMiddlewareRedirects = (ternSecureRequest: TernSecureRequest) => {
  const redirectToSignIn: MiddlewareAuthObject["redirectToSignIn"] = (
    opts = {}
  ) => {
    const url = ternSecureRequest.ternUrl.toString();
    redirectToSignInError(url, opts.returnBackUrl);
  };

  const redirectToSignUp: MiddlewareAuthObject["redirectToSignUp"] = (
    opts = {}
  ) => {
    const url = ternSecureRequest.ternUrl.toString();
    redirectToSignUpError(url, opts.returnBackUrl);
  };

  return { redirectToSignIn, redirectToSignUp };
};

const createMiddlewareProtect = (
  ternSecureRequest: TernSecureRequest,
  authObject: AuthObject,
  redirectToSignIn: RedirectFun<Response>
) => {
  return (async (params: any, options: any) => {
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
    })(params, options);
  }) as unknown as Promise<AuthProtect>;
};

export const redirectAdapter = (url: string | URL) => {
  return NextResponse.redirect(url, {
    headers: { [constants.Headers.TernSecureRedirectTo]: "true" },
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
    return setHeader(
      NextResponse.rewrite(new URL(`/tern_${Date.now()}`, nextrequest.url)),
      constants.Headers.AuthReason,
      "protect-rewrite"
    );
  }

  const isRedirectToSignIn = isRedirectToSignInError(error);
  const isRedirectToSignUp = isRedirectToSignUpError(error);

  if (isRedirectToSignIn || isRedirectToSignUp) {
    const redirect = createRedirect({
      redirectAdapter,
      baseUrl: ternSecureRequest.ternUrl,
      signInUrl: SIGN_IN_URL,
      signUpUrl: SIGN_UP_URL,
    });

    const { returnBackUrl } = error;

    return redirect[
      isRedirectToSignIn ? "redirectToSignIn" : "redirectToSignUp"
    ]({ returnBackUrl });
  }

  if (isNextjsRedirectError(error)) {
    return redirectAdapter(error.redirectUrl);
  }

  throw error;
};
