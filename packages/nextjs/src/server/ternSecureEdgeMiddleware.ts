import type {
  AuthObject,
  RequestOptions,
  TernSecureRequest,
} from '@tern-secure/backend';
import {
  constants,
  createTernSecureRequest,
  enableDebugLogging,
} from '@tern-secure/backend';
import type {
  TernSecureConfig,
} from '@tern-secure/types';
import { notFound as nextjsNotFound } from 'next/navigation';
import type { NextMiddleware,NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { isRedirect, setHeader } from '../utils/response';
import { serverRedirectWithAuth } from '../utils/serverRedirectAuth';
import { createEdgeCompatibleLogger } from '../utils/withLogger';
import { SIGN_IN_URL, SIGN_UP_URL } from './constant';
import {
  isNextjsNotFoundError,
  isNextjsRedirectError,
  isRedirectToSignInError,
  isRedirectToSignUpError,
  nextjsRedirectError,
  redirectToSignInError,
  redirectToSignUpError,
} from './nextErrors';
import { type AuthProtect,createProtect } from './protect';
import { createRedirect, type RedirectFun } from './redirect';
import { ternSecureBackendClient } from './ternsecureClient';
import type {
  NextMiddlewareEvtParam,
  NextMiddlewareRequestParam,
  NextMiddlewareReturn,
} from './types';
import { decorateRequest } from './utils';

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
  event: NextMiddlewareEvtParam,
) => NextMiddlewareReturn;

export interface MiddlewareOptions extends RequestOptions {
  debug?: boolean;
  firebaseOptions?: TernSecureConfig;
}
type MiddlewareOptionsCallback = (
  req: NextRequest,
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
  (handler: MiddlewareHandler, options?: MiddlewareOptionsCallback): NextMiddleware;

  /**
   * @example
   * export default ternSecureMiddleware(options);
   */
  (options?: MiddlewareOptions): NextMiddleware;
  /**
   * @example
   * export default ternSecureMiddleware;
   */
  (request: NextMiddlewareRequestParam, event: NextMiddlewareEvtParam): NextMiddlewareReturn;
}

export const ternSecureMiddleware = ((
  ...args: unknown[]
): NextMiddleware | NextMiddlewareReturn => {
  const [request, event] = parseRequestAndEvent(args);
  const [handler, params] = parseHandlerAndOptions(args);

  const middleware = () => {
    const withAuthNextMiddleware: NextMiddleware = async (request, event) => {
      const resolvedParams = typeof params === 'function' ? await params(request) : params;
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
        options,
      );

      const authObjectClient = requestStateClient.auth();

      const { redirectToSignIn } = createMiddlewareRedirects(ternSecureRequest);

      const { redirectToSignUp } = createMiddlewareRedirects(ternSecureRequest);

      const protect = await createMiddlewareProtect(
        ternSecureRequest,
        authObjectClient,
        redirectToSignIn,
      );

      const authObj: MiddlewareAuthObject = Object.assign(authObjectClient, {
        redirectToSignIn,
        redirectToSignUp,
      });

      const authHandler = () => Promise.resolve(authObj);
      authHandler.protect = protect;

      let handlerResult: Response = NextResponse.next();

      try {
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
      if(isFirebaseCookieRequest(request)) {
        return handleFirebaseAuthRequest(request);
      }
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
  ] as [NextMiddlewareRequestParam | undefined, NextMiddlewareEvtParam | undefined];
};

const parseHandlerAndOptions = (args: unknown[]) => {
  return [
    typeof args[0] === 'function' ? args[0] : undefined,
    (args.length === 2 ? args[1] : typeof args[0] === 'function' ? {} : args[0]) || {},
  ] as [MiddlewareHandler | undefined, MiddlewareOptions | MiddlewareOptionsCallback];
};

const isFirebaseRequest = (request: NextMiddlewareRequestParam) =>
  request.nextUrl.pathname.startsWith('/__/');

const rewriteFirebaseRequest = (options: MiddlewareOptions, request: NextMiddlewareRequestParam) => {
  const newUrl = new URL(request.url);
  newUrl.host = options.firebaseOptions?.authDomain || '';
  newUrl.port = '';
  return NextResponse.rewrite(newUrl);
}

const finalTarget = (request: NextMiddlewareRequestParam) => {
  const finalTargetUrl = request.nextUrl.searchParams.get('finalTarget');
  return finalTargetUrl ? new URL(finalTargetUrl, request.url) : undefined;
};

const isFirebaseCookieRequest = (request: NextMiddlewareRequestParam) =>
  request.nextUrl.pathname === '/__cookies__';

/**
 * Create middleware redirect functions
 */
const createMiddlewareRedirects = (ternSecureRequest: TernSecureRequest) => {
  const redirectToSignIn: MiddlewareAuthObject['redirectToSignIn'] = (opts = {}) => {
    const url = ternSecureRequest.ternUrl.toString();
    redirectToSignInError(url, opts.returnBackUrl);
  };

  const redirectToSignUp: MiddlewareAuthObject['redirectToSignUp'] = (opts = {}) => {
    const url = ternSecureRequest.ternUrl.toString();
    redirectToSignUpError(url, opts.returnBackUrl);
  };

  return { redirectToSignIn, redirectToSignUp };
};

const createMiddlewareProtect = (
  ternSecureRequest: TernSecureRequest,
  authObject: AuthObject,
  redirectToSignIn: RedirectFun<Response>,
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
    headers: { [constants.Headers.TernSecureRedirectTo]: 'true' },
  });
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
      'protect-rewrite',
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

    return redirect[isRedirectToSignIn ? 'redirectToSignIn' : 'redirectToSignUp']({
      returnBackUrl,
    });
  }

  if (isNextjsRedirectError(error)) {
    return redirectAdapter(error.redirectUrl);
  }

  throw error;
};

const handleFirebaseAuthRequest = async (
  request: NextRequest,
): Promise<NextResponse | null> => {

  console.log('Checking for __cookies__ path');

  const isDevMode = process.env.NODE_ENV === 'development';
  const ID_TOKEN_COOKIE_NAME = isDevMode ? `__dev_FIREBASE_[DEFAULT]` : `__HOST-FIREBASE_[DEFAULT]`;
  const REFRESH_TOKEN_COOKIE_NAME = isDevMode
    ? '__dev_FIREBASEID_[DEFAULT]'
    : `__HOST-FIREBASEID_[DEFAULT]`;
  const ID_TOKEN_COOKIE = {
    path: '/',
    secure: !isDevMode,
    sameSite: 'strict',
    partitioned: true,
    name: ID_TOKEN_COOKIE_NAME,
    maxAge: 34560000,
    priority: 'high',
  } as const;
  const REFRESH_TOKEN_COOKIE = {
    ...ID_TOKEN_COOKIE,
    httpOnly: true,
    name: REFRESH_TOKEN_COOKIE_NAME,
  } as const;

  if (request.nextUrl.pathname === '/__cookies__') {
    console.log('Handling /__cookies__ request');
    const method = request.method;
    if (method === 'DELETE') {
      const response = new NextResponse('');
      response.cookies.delete({ ...ID_TOKEN_COOKIE, maxAge: 0 });
      response.cookies.delete({ ...REFRESH_TOKEN_COOKIE, maxAge: 0 });
      return response;
    }

    const headers: Record<string, string> = {};
        const headerNames = [
      'content-type',
      'X-Firebase-Client',
      'X-Firebase-gmpid',
      'X-Firebase-AppCheck',
      'X-Client-Version',
    ];

    headerNames.forEach(headerName => {
      const headerValue = request.headers.get(headerName);
      if (headerValue) {
        headers[headerName] = headerValue;
      }
    });

    const finalTargetParam = request.nextUrl.searchParams.get('finalTarget');

    const url = new URL(finalTargetParam || '');
    let body: ReadableStream<any> | string | null = request.body;

    const isTokenRequest = !!url.pathname.match(/^(\/securetoken\.googleapis\.com)?\/v1\/token/);
    const isSignInRequest = !!url.pathname.match(
      /^(\/identitytoolkit\.googleapis\.com)?\/v1\/accounts:signInWith/,
    );

    if (!isTokenRequest && !isSignInRequest)
      throw new Error('Could not determine the request type to proxy');

    if (isTokenRequest) {
      body = await request.text();
      const bodyParams = new URLSearchParams(body.trim());
      if (bodyParams.has('refresh_token')) {
        const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE.name)?.value;
        if (refreshToken) {
          bodyParams.set('refresh_token', refreshToken);
          body = bodyParams.toString();
        }
      }
    }

    const response = await fetch(url, { method, body, headers });
    const json = await response.json();

    if (!response.ok) {
      return NextResponse.json(json, { status: response.status, statusText: response.statusText });
    }

    let refreshToken, idToken, maxAge;
    if (isSignInRequest) {
      refreshToken = json.refreshToken;
      idToken = json.idToken;
      maxAge = json.expiresIn;
      json.refreshToken = 'REDACTED';
    } else {
      refreshToken = json.refresh_token;
      idToken = json.id_token;
      maxAge = json.expires_in;
      json.refresh_token = 'REDACTED';
    }

    const nextResponse = NextResponse.json(json);
    if (idToken) nextResponse.cookies.set({ ...ID_TOKEN_COOKIE, maxAge, value: idToken });
    if (refreshToken) nextResponse.cookies.set({ ...REFRESH_TOKEN_COOKIE, value: refreshToken });
    return nextResponse;
  }
  return null;
};
