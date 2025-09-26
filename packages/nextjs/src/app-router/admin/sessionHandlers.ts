import { clearSessionCookie, createSessionCookie } from '@tern-secure/backend/admin';
import { ternDecodeJwtUnguarded } from '@tern-secure/backend/jwt';
import { cookies } from 'next/headers';

import { NextCookieStore } from '../../utils/NextCookieAdapter';
import { type RequestProcessorContext } from './c-authenticateRequestProcessor';
import { createValidators } from './fnValidators';
import { createApiErrorResponse, HttpResponseHelper, SessionResponseHelper } from './responses';
import type { SessionSubEndpoint, TernSecureHandlerOptions } from './types';

export async function sessionEndpointHandler(
  context: RequestProcessorContext,
  options: TernSecureHandlerOptions,
): Promise<Response> {
  const { subEndpoint, method } = context;
  
  const validators = createValidators(context);

  const {
    validateSubEndpoint,
    validateSecurity,
    validateSessionRequest,
    validateCsrfToken,
    validateIdToken,
  } = validators;

  if (!subEndpoint) {
    return createApiErrorResponse('SUB_ENDPOINT_REQUIRED', 'Session sub-endpoint required', 400);
  }

  const sessionsConfig = options.endpoints?.sessions;
  const subEndpointConfig = sessionsConfig?.subEndpoints?.[subEndpoint];

  validateSubEndpoint(subEndpoint, subEndpointConfig);

  if (subEndpointConfig?.security) {
    await validateSecurity(subEndpointConfig.security);
  }

  const SessionGetHandler = async (subEndpoint: SessionSubEndpoint): Promise<Response> => {
    const handleSessionVerify = async (): Promise<Response> => {
      try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('_session_cookie')?.value;
        if (!sessionCookie) {
          return SessionResponseHelper.createUnauthorizedResponse();
        }

        const { data: decodedSession, errors } = ternDecodeJwtUnguarded(sessionCookie);
        if (errors) {
          return SessionResponseHelper.createUnauthorizedResponse();
        }

        return SessionResponseHelper.createVerificationResponse(decodedSession);
      } catch (error) {
        return SessionResponseHelper.createUnauthorizedResponse();
      }
    };

    switch (subEndpoint) {
      case 'verify':
        return handleSessionVerify();
      default:
        return HttpResponseHelper.createNotFoundResponse();
    }
  };

  const SessionPostHandler = async (subEndpoint: SessionSubEndpoint): Promise<Response> => {
    const cookieStore = new NextCookieStore();

    const { idToken, csrfToken, error } = await validateSessionRequest();
    if (error) return error;

    const csrfCookieValue = await cookieStore.get('_session_terncf');
    validateCsrfToken(csrfToken || '', csrfCookieValue.value);

    const handleCreateSession = async (
      cookieStore: NextCookieStore,
      idToken: string,
    ): Promise<Response> => {
      try {
        const res = await createSessionCookie(idToken, cookieStore, options);
        return SessionResponseHelper.createSessionCreationResponse(res);
      } catch (error) {
        return createApiErrorResponse('SESSION_CREATION_FAILED', 'Session creation failed', 500);
      }
    };

    const handleRefreshSession = async (
      cookieStore: NextCookieStore,
      idToken: string,
    ): Promise<Response> => {
      try {
        const decodedSession = ternDecodeJwtUnguarded(idToken);
        if (decodedSession.errors) {
          return createApiErrorResponse('INVALID_SESSION', 'Invalid session for refresh', 401);
        }

        const refreshRes = await createSessionCookie(idToken, cookieStore, options);
        return SessionResponseHelper.createRefreshResponse(refreshRes);
      } catch (error) {
        return createApiErrorResponse('REFRESH_FAILED', 'Session refresh failed', 500);
      }
    };

    const handleRevokeSession = async (cookieStore: NextCookieStore): Promise<Response> => {
      const res = await clearSessionCookie(cookieStore);
      return SessionResponseHelper.createRevokeResponse(res);
    };

    switch (subEndpoint) {
      case 'createsession': {
        validateIdToken(idToken);
        //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return handleCreateSession(cookieStore, idToken!);
      }

      case 'refresh':
        //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return handleRefreshSession(cookieStore, idToken!);

      case 'revoke':
        return handleRevokeSession(cookieStore);

      default:
        return HttpResponseHelper.createSubEndpointNotSupportedResponse();
    }
  };

  switch (method) {
    case 'GET':
      return SessionGetHandler(subEndpoint);

    case 'POST':
      return SessionPostHandler(subEndpoint);

    default:
      return HttpResponseHelper.createMethodNotAllowedResponse();
  }
}
