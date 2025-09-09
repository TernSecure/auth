import { NextRequest, NextResponse } from 'next/server';
import { createSessionCookie, clearSessionCookie } from '@tern-secure/backend/admin';
import { RequestOptions } from '@tern-secure/backend';
import { ternDecodeJwtUnguarded } from '@tern-secure/backend/jwt';
import { NextCookieStore } from '../../utils/NextCookieAdapter';
import type { SessionSubEndpoint, TernSecureHandlerOptions, TernSecureInternalHandlerConfig} from './types';
import {
  createApiErrorResponse,
  SessionResponseHelper,
  HttpResponseHelper
} from './responses';
import { CsrfValidator, RequestValidator} from './validators' 

/**
 * Session GET request handlers
 */
export class SessionGetHandler {
  static async handle(
    request: NextRequest,
    subEndpoint: SessionSubEndpoint,
    _config: Required<TernSecureHandlerOptions>,
  ): Promise<NextResponse> {
    switch (subEndpoint) {
      case 'verify':
        return this.handleVerify(request);
      default:
        return HttpResponseHelper.createNotFoundResponse();
    }
  }

  private static async handleVerify(request: NextRequest): Promise<NextResponse> {
    try {
      const sessionCookie = request.cookies.get('_session_cookie')?.value;
      if (!sessionCookie) {
        return SessionResponseHelper.createUnauthorizedResponse();
      }

      const decodedSession = ternDecodeJwtUnguarded(sessionCookie);
      if (decodedSession.errors) {
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
    request: NextRequest,
    subEndpoint: SessionSubEndpoint,
    _config: TernSecureInternalHandlerConfig,
  ): Promise<NextResponse> {
    const cookieStore = new NextCookieStore();

    const { body, idToken, csrfToken, error } = await RequestValidator.validateSessionRequest(request);
    if (error) return error;

    const csrfCookieValue = request.cookies.get('_session_terncf')?.value;
    const csrfValidationError = CsrfValidator.validate(csrfToken || '', csrfCookieValue);
    if (csrfValidationError) return csrfValidationError;

    const options = {
      tenantId: _config.tenantId,
    }

    switch (subEndpoint) {
      case 'createsession':
        return this.handleCreateSession(options, idToken, cookieStore);
      case 'refresh':
        return this.handleRefreshSession(request, cookieStore);
      case 'revoke':
        return this.handleRevokeSession(cookieStore);
      default:
        return HttpResponseHelper.createSubEndpointNotSupportedResponse();
    }
  }

  private static async handleCreateSession(
    options: RequestOptions,
    idToken: string | undefined,
    cookieStore: NextCookieStore
  ): Promise<NextResponse> {
    const validationError = RequestValidator.validateIdToken(idToken);
    if (validationError) return validationError;

    try {
      const res = await createSessionCookie(idToken!, cookieStore, options);
      return SessionResponseHelper.createSessionCreationResponse(res);
    } catch (error) {
      return createApiErrorResponse('SESSION_CREATION_FAILED', 'Session creation failed', 500);
    }
  }

  private static async handleRefreshSession(
    request: NextRequest,
    cookieStore: NextCookieStore
  ): Promise<NextResponse> {
    const currentSessionCookie = request.cookies.get('__session')?.value;
    if (!currentSessionCookie) {
      return createApiErrorResponse('NO_SESSION', 'No session to refresh', 401);
    }

    try {
      const decodedSession = ternDecodeJwtUnguarded(currentSessionCookie);
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

  private static async handleRevokeSession(cookieStore: NextCookieStore): Promise<NextResponse> {
    const res = await clearSessionCookie(cookieStore);
    return SessionResponseHelper.createRevokeResponse(res);
  }
}

/**
 * Main session endpoint orchestrator
 */
export class SessionEndpointHandler {
  static async handle(
    request: NextRequest,
    method: string,
    subEndpoint: SessionSubEndpoint | undefined,
    config: Required<TernSecureHandlerOptions>,
  ): Promise<NextResponse> {
    const sessionsConfig = config.endpoints.sessions;
    const subEndpointConfig = sessionsConfig?.subEndpoints?.[subEndpoint!];

    // Validate sub-endpoint
    const subEndpointValidation = this.validateSubEndpoint(subEndpoint, subEndpointConfig, method);
    if (subEndpointValidation) return subEndpointValidation;

    // Apply endpoint-specific security checks
    if (subEndpointConfig?.security) {
      const { SecurityValidator } = await import('./validators.js');
      const securityResult = await SecurityValidator.validate(request, subEndpointConfig.security);
      if (securityResult) return securityResult;
    }

    // Route to appropriate method handler
    switch (method) {
      case 'GET':
        return SessionGetHandler.handle(request, subEndpoint!, config);
      case 'POST':
        return SessionPostHandler.handle(request, subEndpoint!, config);
      default:
        return HttpResponseHelper.createMethodNotAllowedResponse();
    }
  }

  private static validateSubEndpoint(
    subEndpoint: SessionSubEndpoint | undefined,
    subEndpointConfig: any,
    method: string
  ): NextResponse | null {
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