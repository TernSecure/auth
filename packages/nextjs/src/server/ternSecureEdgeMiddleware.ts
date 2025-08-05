import { notFound as nextjsNotFound } from "next/navigation";
import {
  constants,
  createTernSecureRequest,
  createBackendInstanceEdge,
  enableDebugLogging,
  validateCheckRevokedOptions,
} from "@tern-secure/backend";
import type {
  TernSecureRequest,
  AuthObject,
  CheckRevokedOptions,
} from "@tern-secure/backend";
import { SIGN_IN_URL, SIGN_UP_URL } from "./constant";
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
import { setHeader } from '../utils/response';
import type {
  NextMiddlewareEvtParam,
  NextMiddlewareRequestParam,
  NextMiddlewareReturn,
} from "./types";
import { createProtect, type AuthProtect } from "./protect";
import { CheckCustomClaims } from "@tern-secure/types";
import { createEdgeCompatibleLogger } from "../utils/withLogger";


export interface MiddlewareAuth {
  (): Promise<MiddlewareAuthObject>;
  protect: AuthProtect;
}

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
  request: NextRequest,
  checkRevoked: CheckRevokedOptions | undefined,
  logger: ReturnType<typeof createEdgeCompatibleLogger>
): Promise<AuthObject> => {
  try {
    const requestState = await createBackendInstanceEdge(request, checkRevoked);
    const authResult = requestState.requestState.auth();
    logger.debug("Auth Result:", authResult);
    return authResult;
  } catch (error) {
    logger.error(
      "Auth check error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return {
      session: null,
      userId: null,
      has: {} as CheckCustomClaims,
      error: error instanceof Error ? error.message : "Unknown error",
    } as AuthObject;
  }
};

export interface MiddlewareOptions {
  checkRevoked?: CheckRevokedOptions;
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
      const debug = resolvedParams.debug || false;

      const logger = createEdgeCompatibleLogger(debug);
      const checkRevoked = resolvedParams.checkRevoked;

      if (checkRevoked) {
        const validation = validateCheckRevokedOptions(checkRevoked);
        if (!validation.isValid) {
          logger.error("Invalid checkRevoked configuration:", validation.error);
          const ternSecureRequest = createTernSecureRequest(request);
          const configError = new Error(validation.error);
          configError.name = "CHECK_REVOKED_CONFIG_ERROR";
          return handleControlError(configError, ternSecureRequest, request);
        }
      }

      const requestId = crypto.randomUUID().slice(0, 8);
      const startTime = performance.now();

      try {
        if (debug) {
          enableDebugLogging();
        }

        const authObject = await authenticateMiddlewareRequest(
          request,
          checkRevoked,
          logger
        );

        const ternSecureRequest = createTernSecureRequest(request);

        const { redirectToSignIn } = createMiddlewareRedirects(
          ternSecureRequest
        );

        const { redirectToSignUp } = createMiddlewareRedirects(
          ternSecureRequest
        );

        const protect = createMiddlewareProtect(
          ternSecureRequest,
          authObject,
          redirectToSignIn
        );

        let handlerResult: Response = NextResponse.next();

        if (handler) {
          const createAuthHandler = (): MiddlewareAuth => {
            const getAuth = async (): Promise<MiddlewareAuthObject> => {
              return {
                ...authObject,
                redirectToSignIn,
                redirectToSignUp,
              };
            };

            const authHandler = Object.assign(getAuth, {
              protect,
            });

            return authHandler as MiddlewareAuth;
          };

          try {
            const auth = createAuthHandler();
            const userHandlerResult = await handler(auth, request, event);
            handlerResult = userHandlerResult || handlerResult;
          } catch (error) {
            logger.error("User handler error:", error);
            const ternSecureRequest = createTernSecureRequest(request);
            handlerResult = handleControlError(
              error,
              ternSecureRequest,
              request
            );
          }
        }
        return handlerResult;
      } catch (error) {
        const duration = performance.now() - startTime;
        logger.logError(requestId, duration, error);
        throw error;
      }
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
  ternSecureRequest: TernSecureRequest
) => {
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
): AuthProtect => {
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

const redirectAdapter = (url: string | URL) => {
  return NextResponse.redirect(url, { headers: { [constants.Headers.TernSecureRedirectTo]: 'true' } });
};

/**
 * Handle control flow errors in middleware
 */
const handleControlError = (
  error: any,
  ternSecureRequest: TernSecureRequest,
  nextrequest: NextRequest,
): Response => {
  if (isNextjsNotFoundError(error)) {
    return setHeader(
      NextResponse.rewrite(new URL(`/tern_${Date.now()}`, nextrequest.url)),
      constants.Headers.AuthReason,
      'protect-rewrite'
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

    return redirect[isRedirectToSignIn ? 'redirectToSignIn' : 'redirectToSignUp']({ returnBackUrl });
  }

  if (isNextjsRedirectError(error)) {
    return redirectAdapter(error.redirectUrl);
  }

  throw error;
};
