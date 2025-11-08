import { ms, type StringValue } from '@tern-secure/shared/ms';
import type { DecodedIdToken } from '@tern-secure/types';

import { getAuth } from '../auth';
import { constants } from '../constants';
import { ternDecodeJwt } from '../jwt/verifyJwt';
import type { TokenCarrier } from '../utils/errors';
import {
  RefreshTokenErrorReason,
  TokenVerificationError,
  TokenVerificationErrorReason,
} from '../utils/errors';
import type { RequestState, SignedInState, SignedOutState } from './authstate';
import { AuthErrorReason, signedIn, signedOut } from './authstate';
import type { RequestProcessorContext } from './c-authenticateRequestProcessor';
import { createRequestProcessor } from './c-authenticateRequestProcessor';
import { getCookieNameEnvironment, getCookiePrefix } from './cookie';
import { createTernSecureRequest } from './ternSecureRequest';
import type { AuthenticateRequestOptions } from './types';
import { verifyToken } from './verify';


function hasAuthorizationHeader(request: Request): boolean {
  return request.headers.has('Authorization');
}

function convertToSeconds(value: StringValue) {
  return ms(value) / 1000;
}

function isRequestForRefresh(
  error: TokenVerificationError,
  context: { refreshTokenInCookie?: string },
  request: Request,
) {
  return (
    error.reason === TokenVerificationErrorReason.TokenExpired &&
    !!context.refreshTokenInCookie &&
    request.method === 'GET'
  );
}

export async function authenticateRequest(
  request: Request,
  options: AuthenticateRequestOptions,
): Promise<RequestState> {
  const context = createRequestProcessor(createTernSecureRequest(request), options);
  const { refreshTokenInCookie } = context;

  const { refreshExpiredIdToken } = getAuth(options);

  function checkSessionTimeout(authTimeValue: number): SignedOutState | null {
    const defaultMaxAgeSeconds = convertToSeconds('5 days');
    const REAUTH_PERIOD_SECONDS = context.session?.maxAge
      ? convertToSeconds(context.session.maxAge)
      : defaultMaxAgeSeconds;

    const currentTime = Math.floor(Date.now() / 1000);
    const authAge = currentTime - authTimeValue;

    console.log('Current time:', currentTime, 'Auth age:', authAge, 'Reauth period (s):', REAUTH_PERIOD_SECONDS);

    if (authTimeValue > 0 && authAge > REAUTH_PERIOD_SECONDS) {
      return signedOut(context, AuthErrorReason.AuthTimeout, 'Authentication expired');
    }

    return null;
  }

  async function refreshToken() {
    if (!refreshTokenInCookie) {
      return {
        data: null,
        error: {
          message: 'No refresh token available',
          reason: AuthErrorReason.SessionTokenMissing,
        },
      };
    }
    return await refreshExpiredIdToken(refreshTokenInCookie, {
      referer: context.ternUrl.origin,
    });
  }

  async function handleRefresh(): Promise<
    | { data: { decoded: DecodedIdToken; token: string; headers: Headers }; error: null }
    | { data: null; error: any }
  > {
    const { data: refreshedData, error } = await refreshToken();
    if (!refreshedData) {
      return { data: null, error };
    }

    const headers = new Headers();
    const { idToken } = refreshedData;

    const maxAge = 365 * 24 * 60 * 60;
    const cookiePrefix = getCookiePrefix();
    const idTokenCookieName = getCookieNameEnvironment(constants.Cookies.IdToken, cookiePrefix);
    const baseCookieAttributes = 'HttpOnly; Secure; SameSite=Strict; Max-Age=' + `${maxAge}; Path=/`;

    const idTokenCookie = `${idTokenCookieName}=${idToken}; ${baseCookieAttributes};`;
    headers.append('Set-Cookie', idTokenCookie);

    const { data: decoded, errors } = await verifyToken(idToken, options);
    if (errors) {
      return {
        data: null,
        error: errors ? errors[0] : new Error('Failed to verify refreshed token'),
      };
    }
    return { data: { decoded, token: idToken, headers }, error: null };
  }

  async function handleLocalHandshakeWithErrorCheck(
    context: RequestProcessorContext,
    reason: string,
    message: string,
    skipSessionCheck: boolean = false,
  ): Promise<SignedInState | SignedOutState> {
    const hasRefreshTokenInCookie = !!context.refreshTokenInCookie;
    if (!hasRefreshTokenInCookie) {
      return signedOut(context, reason, 'Refresh token missing in cookie');
    }

    if (reason === AuthErrorReason.TernAutWithoutSessionToken) {
      if (!skipSessionCheck) {
        const sessionTimeoutResult = checkSessionTimeout(context.ternAuth);
        if (sessionTimeoutResult) {
          return sessionTimeoutResult;
        }
      }

      const { data, error } = await handleRefresh();

      if (data) {
        return signedIn(context, data.decoded, data.headers, data.token);
      }

      return signedOut(context, reason, 'Failed to refresh idToken');
    }


    if (reason === AuthErrorReason.SessionTokenWithoutTernAUT ||
        reason === AuthErrorReason.SessionTokenIATBeforeTernAUT) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { data, errors } = ternDecodeJwt(context.idTokenInCookie!);

      if (errors) {
        throw errors[0];
      }

      const authTime = data.payload.auth_time;

      if (!authTime || typeof authTime !== 'number') {
        return signedOut(context, reason, 'Token missing auth_time');
      }

      if (!skipSessionCheck) {
        const sessionTimeoutResult = checkSessionTimeout(authTime);
        if (sessionTimeoutResult) {
          return sessionTimeoutResult;
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { data: verifiedToken, errors: verifyErrors } = await verifyToken(context.idTokenInCookie!, options);

      if (verifyErrors) {
        throw verifyErrors[0];
      }

      const headers = new Headers();
      const oneYearInSeconds = 365 * 24 * 60 * 60;
      const ternAutCookie = `${constants.Cookies.TernAut}=${authTime}; Max-Age=${oneYearInSeconds}; Secure; SameSite=Strict; Path=/`;
      headers.append('Set-Cookie', ternAutCookie);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return signedIn(context, verifiedToken, headers, context.idTokenInCookie!);
    }

    return signedOut(context, reason, message);
  }

  async function authenticateRequestWithTokenInCookie() {
    const hasTernAuth = context.ternAuth
    const hasIdTokenInCookie = !!context.idTokenInCookie;

    if (!hasTernAuth && !hasIdTokenInCookie) {
      return signedOut(context, AuthErrorReason.SessionTokenAndAuthMissing);
    }

    if (!hasTernAuth && hasIdTokenInCookie) {
      return await handleLocalHandshakeWithErrorCheck(context, AuthErrorReason.SessionTokenWithoutTernAUT, '');
    }

    if (hasTernAuth && !hasIdTokenInCookie) {
      return await handleLocalHandshakeWithErrorCheck(context, AuthErrorReason.TernAutWithoutSessionToken, '');
    }

    const sessionTimeoutResult = checkSessionTimeout(context.ternAuth);
    if (sessionTimeoutResult) {
      return sessionTimeoutResult;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { data: decodedResult, errors: decodeErrors } = ternDecodeJwt(context.idTokenInCookie!);

    if (decodeErrors) {
      return handleError(decodeErrors[0], 'cookie');
    }

    const tokenIat = decodedResult.payload.iat;
    if (!tokenIat) {
      return signedOut(context, AuthErrorReason.SessionTokenMissing, '');
    }

    if (tokenIat < context.ternAuth) {
      return await handleLocalHandshakeWithErrorCheck(context, AuthErrorReason.SessionTokenIATBeforeTernAUT, '', true);
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { data, errors } = await verifyToken(context.idTokenInCookie!, options);

      if (errors) {
        throw errors[0];
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const signedInRequestState = signedIn(context, data, undefined, context.idTokenInCookie!);

      return signedInRequestState;
    } catch (err) {
      return handleError(err, 'cookie');
    }

    return signedOut(context, AuthErrorReason.UnexpectedError);
  }

  async function authenticateRequestWithTokenInHeader() {
    const { sessionTokenInHeader } = context;
    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { data, errors } = await verifyToken(sessionTokenInHeader!, options);

      if (errors) {
        throw errors[0];
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const signedInRequestState = signedIn(context, data, undefined, sessionTokenInHeader!);
      return signedInRequestState;
    } catch (err) {
      return handleError(err, 'header');
    }
  }

  async function handleError(
    err: unknown,
    tokenCarrier: TokenCarrier,
  ): Promise<SignedInState | SignedOutState> {
    if (!(err instanceof TokenVerificationError)) {
      return signedOut(context, AuthErrorReason.UnexpectedError);
    }

    let refreshError: string | null;
    if (isRequestForRefresh(err, context, request)) {
      const { data, error } = await handleRefresh();
      if (data) {
        return signedIn(context, data.decoded, data.headers, data.token);
      }

      if (error?.cause?.reason) {
        refreshError = error.cause.reason;
      }
    } else {
      if (request.method !== 'GET') {
        refreshError = RefreshTokenErrorReason.NonEligibleNonGet;
      } else if (!context.refreshTokenInCookie) {
        refreshError = RefreshTokenErrorReason.NonEligibleNoCookie;
      } else {
        refreshError = null;
      }
    }

    err.tokenCarrier = tokenCarrier;

    return signedOut(context, err.reason, err.getFullMessage());
  }

  if (hasAuthorizationHeader(request)) {
    return authenticateRequestWithTokenInHeader();
  }

  return authenticateRequestWithTokenInCookie();
}
