import type { RequestOptions } from '@tern-secure/backend';
import { clearSessionCookie, createSessionCookie } from '@tern-secure/backend/admin';
import { ternDecodeJwtUnguarded} from '@tern-secure/backend/jwt';
import { cookies } from 'next/headers';

import { NextCookieStore } from '../../utils/NextCookieAdapter';
import { createApiErrorResponse, HttpResponseHelper, SessionResponseHelper } from './responses';
import type {
  SessionSubEndpoint,
  TernSecureHandlerOptions,
  TernSecureInternalHandlerConfig,
} from './types';
import { CsrfValidator, RequestValidator } from './validators';

/**
 * Session GET request handlers
 */
export class SessionGetHandler {
  static async handle(
    subEndpoint: SessionSubEndpoint,
    _config: Required<TernSecureHandlerOptions>,
  ): Promise<Response> {
    switch (subEndpoint) {
      case 'verify':
        return this.handleVerify();
      default:
        return HttpResponseHelper.createNotFoundResponse();
    }
  }

  private static async handleVerify(): Promise<Response> {
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
  }
}

/**
 * Session POST request handlers
 */
export class SessionPostHandler {
  static async handle(
    request: Request,
    subEndpoint: SessionSubEndpoint,
    _config: TernSecureInternalHandlerConfig,
  ): Promise<Response> {
    const cookieStore = new NextCookieStore();

    const { idToken, csrfToken, error } = await RequestValidator.validateSessionRequest(request);
    if (error) return error;

    const csrfCookieValue = await cookieStore.get('_session_terncf');
    const csrfValidationError = CsrfValidator.validate(csrfToken || '', csrfCookieValue.value);
    if (csrfValidationError) return csrfValidationError;

    const options = {
      tenantId: _config.tenantId,
    };

    switch (subEndpoint) {
      case 'createsession':
        return this.handleCreateSession(options, idToken, cookieStore);
      case 'refresh':
        return this.handleRefreshSession(cookieStore);
      case 'revoke':
        return this.handleRevokeSession(cookieStore);
      default:
        return HttpResponseHelper.createSubEndpointNotSupportedResponse();
    }
  }

  private static async handleCreateSession(
    options: RequestOptions,
    idToken: string | undefined,
    cookieStore: NextCookieStore,
  ): Promise<Response> {
    const validationError = RequestValidator.validateIdToken(idToken);
    if (validationError) return validationError;
    if (!idToken) {
      return createApiErrorResponse('ID_TOKEN_REQUIRED', 'ID token is required', 400);
    }

    try {
      const res = await createSessionCookie(idToken, cookieStore, options);
      return SessionResponseHelper.createSessionCreationResponse(res);
    } catch (error) {
      return createApiErrorResponse('SESSION_CREATION_FAILED', 'Session creation failed', 500);
    }
  }

  private static async handleRefreshSession(
    cookieStore: NextCookieStore,
  ): Promise<Response> {
    const currentSessionCookie = await cookieStore.get('__session');
    if (!currentSessionCookie) {
      return createApiErrorResponse('NO_SESSION', 'No session to refresh', 401);
    }

    try {
      const decodedSession = ternDecodeJwtUnguarded(currentSessionCookie.value || '');
      if (decodedSession.errors) {
        return createApiErrorResponse('INVALID_SESSION', 'Invalid session for refresh', 401);
      }

      const refreshRes = await createSessionCookie(
        decodedSession.data?.payload?.sub || '',
        cookieStore,
      );

      return SessionResponseHelper.createRefreshResponse(refreshRes);
    } catch (error) {
      return createApiErrorResponse('REFRESH_FAILED', 'Session refresh failed', 500);
    }
  }

  private static async handleRevokeSession(cookieStore: NextCookieStore): Promise<Response> {
    const res = await clearSessionCookie(cookieStore);
    return SessionResponseHelper.createRevokeResponse(res);
  }
}

/**
 * Main session endpoint orchestrator
 */
export class SessionEndpointHandler {
  static async handle(
    request: Request,
    method: string,
    subEndpoint: SessionSubEndpoint | undefined,
    config: Required<TernSecureHandlerOptions>,
  ): Promise<Response> {
    const sessionsConfig = config.endpoints.sessions;

    if (!subEndpoint) {
      return createApiErrorResponse('SUB_ENDPOINT_REQUIRED', 'Session sub-endpoint required', 400);
    }

    const subEndpointConfig = sessionsConfig?.subEndpoints?.[subEndpoint];

    const subEndpointValidation = this.validateSubEndpoint(subEndpoint, subEndpointConfig, method);
    if (subEndpointValidation) return subEndpointValidation;

    if (subEndpointConfig?.security) {
      const { SecurityValidator } = await import('./validators.js');
      const securityResult = await SecurityValidator.validate(request, subEndpointConfig.security);
      if (securityResult) return securityResult;
    }

    switch (method) {
      case 'GET':
        return SessionGetHandler.handle(subEndpoint, config);
      case 'POST':
        return SessionPostHandler.handle(request, subEndpoint, config);
      default:
        return HttpResponseHelper.createMethodNotAllowedResponse();
    }
  }

  private static validateSubEndpoint(
    subEndpoint: SessionSubEndpoint | undefined,
    subEndpointConfig: any,
    method: string,
  ): Response | null {
    if (!subEndpoint) {
      return createApiErrorResponse('SUB_ENDPOINT_REQUIRED', 'Session sub-endpoint required', 400);
    }

    if (!subEndpointConfig || !subEndpointConfig.enabled) {
      return createApiErrorResponse('ENDPOINT_NOT_FOUND', 'Endpoint not found', 404);
    }

    if (!subEndpointConfig.methods?.includes(method as any)) {
      return createApiErrorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
    }

    return null;
  }
}
