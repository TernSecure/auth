import type { RequestProcessorContext } from '@tern-secure/backend';
import { constants } from '@tern-secure/backend'
import { cookies } from 'next/headers';

import { createApiErrorResponse } from './responses';

/**
 * Lightweight validators for API route handlers
 * Note: Middleware already handles CORS, security, and CSRF validation
 * These validators only handle endpoint-specific validation
 */

/**
 * Validates that the request body is valid JSON
 */
export async function validateJsonBody(request: Request): Promise<{
  body: any;
  error?: Response;
}> {
  try {
    const body = await request.json();
    return { body };
  } catch (error) {
    return {
      body: null,
      error: createApiErrorResponse('INVALID_REQUEST_FORMAT', 'Invalid JSON in request body', 400),
    };
  }
}

/**
 * Validates that an ID token is present and has correct JWT structure
 */
export function validateIdToken(idToken: string | undefined): Response | null {
  if (!idToken) {
    return createApiErrorResponse(
      'INVALID_TOKEN',
      'ID token is required',
      400,
    );
  }
  
  if (idToken.split('.').length !== 3) {
    return createApiErrorResponse(
      'INVALID_TOKEN_FORMAT',
      'ID token must be a valid JWT',
      400,
    );
  }
  
  return null;
}

/**
 * Validates CSRF token matches the cookie value
 * Note: This is only used for specific endpoints that need double-submit CSRF
 */
export async function validateCsrfToken(
  csrfToken: string | undefined,
): Promise<Response | null> {
  if (!csrfToken) {
    return createApiErrorResponse('INVALID_CSRF_TOKEN', 'CSRF token is required', 400);
  }

  const cookieStore = await cookies();
  const csrfCookieValue = cookieStore.get(constants.Cookies.CsrfToken)?.value;

  if (!csrfCookieValue) {
    return createApiErrorResponse('CSRF_MISSING', 'CSRF token cookie not found', 403);
  }

  if (csrfToken !== csrfCookieValue) {
    return createApiErrorResponse('CSRF_TOKEN_MISMATCH', 'CSRF token mismatch', 403);
  }

  return null;
}

/**
 * Validates email format (basic validation)
 */
export function validateEmail(email: string | undefined): Response | null {
  if (!email || typeof email !== 'string') {
    return createApiErrorResponse('EMAIL_REQUIRED', 'Email is required', 400);
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return createApiErrorResponse('INVALID_EMAIL', 'Invalid email format', 400);
  }

  return null;
}

/**
 * Validates password meets minimum requirements
 */
export function validatePassword(password: string | undefined): Response | null {
  if (!password || typeof password !== 'string') {
    return createApiErrorResponse('PASSWORD_REQUIRED', 'Password is required', 400);
  }

  if (password.length < 6) {
    return createApiErrorResponse(
      'PASSWORD_TOO_SHORT',
      'Password must be at least 6 characters',
      400,
    );
  }

  return null;
}

/**
 * Validates required fields are present in request body
 */
export function validateRequiredFields(
  body: any,
  fields: string[],
): Response | null {
  const missingFields = fields.filter(field => !body[field]);
  
  if (missingFields.length > 0) {
    return createApiErrorResponse(
      'MISSING_REQUIRED_FIELDS',
      `Missing required fields: ${missingFields.join(', ')}`,
      400,
    );
  }

  return null;
}

/**
 * Validates that a sub-endpoint exists in the URL
 */
export function validateSubEndpointPresent(
  context: RequestProcessorContext,
  endpointType: string,
): Response | null {
  if (!context.subEndpoint) {
    return createApiErrorResponse(
      'SUB_ENDPOINT_REQUIRED',
      `${endpointType} sub-endpoint required`,
      400,
    );
  }
  
  return null;
}

/**
 * Helper to extract and validate session request data
 */
export async function extractSessionRequestData(request: Request): Promise<{
  idToken?: string;
  csrfToken?: string;
  error?: Response;
}> {
  const { body, error } = await validateJsonBody(request);
  
  if (error) {
    return { error };
  }

  return {
    idToken: body.idToken,
    csrfToken: body.csrfToken,
  };
}
