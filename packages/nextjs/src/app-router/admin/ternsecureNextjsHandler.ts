import { NextRequest, NextResponse } from "next/server";
import {
  createSessionCookie,
  clearSessionCookie,
} from "@tern-secure/backend/admin";
import { ternDecodeJwtUnguarded } from "@tern-secure/backend/jwt";
import { NextCookieStore } from "../../utils/NextCookieAdapter";
import {
  TernSecureHandlerOptions,
  DEFAULT_HANDLER_OPTIONS,
  AuthEndpoint,
  SessionSubEndpoint,
  CorsOptions,
  EndpointConfig,
  SessionEndpointConfig,
  SecurityOptions,
} from "./types";
import type { TernSecureApiErrorJSON } from "@tern-secure/types";

// Helper function to create consistent error responses
function createErrorResponse(
  code: string,
  message: string,
  status: number
): NextResponse {
  const errors: TernSecureApiErrorJSON[] = [{
    code,
    message
  }];
  
  return NextResponse.json(
    {
      success: false,
      message,
      error: code,
      errors // Include both formats for compatibility
    },
    { status }
  );
}

export function createTernSecureNextJsHandler(options?: TernSecureHandlerOptions) {
  // Deep merge options with defaults
  const config: Required<TernSecureHandlerOptions> = {
    ...DEFAULT_HANDLER_OPTIONS,
    ...options,
    cors: { ...DEFAULT_HANDLER_OPTIONS.cors, ...options?.cors },
    cookies: { ...DEFAULT_HANDLER_OPTIONS.cookies, ...options?.cookies },
    rateLimit: { ...DEFAULT_HANDLER_OPTIONS.rateLimit, ...options?.rateLimit },
    security: { ...DEFAULT_HANDLER_OPTIONS.security, ...options?.security },
    endpoints: {
      sessions: {
        ...DEFAULT_HANDLER_OPTIONS.endpoints.sessions,
        ...options?.endpoints?.sessions,
        subEndpoints: {
          ...DEFAULT_HANDLER_OPTIONS.endpoints.sessions?.subEndpoints,
          ...options?.endpoints?.sessions?.subEndpoints,
        },
      },
    },
  };

  const handler = async (request: NextRequest): Promise<NextResponse> => {
    const method = request.method;
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);

    // Apply CORS validation first
    const corsResult = await validateCors(request, config.cors);
    if (corsResult) {
      return corsResult;
    }

    // Handle preflight OPTIONS requests
    if (method === 'OPTIONS') {
      return handleOptionsRequest(config.cors);
    }

    // Apply global security checks
    const securityResult = await validateSecurity(request, config.security);
    if (securityResult) {
      return securityResult;
    }
    
    // Expected route structure: /api/auth/{endpoint} or /api/auth/{endpoint}/{subEndpoint}
    // pathSegments should be ['api', 'auth', 'endpoint'] or ['api', 'auth', 'endpoint', 'subEndpoint']
    if (pathSegments.length < 3) {
      return createErrorResponse(
        "INVALID_ROUTE",
        "Invalid route structure. Expected: /api/auth/{endpoint}",
        404
      );
    }

    const endpoint = pathSegments[2] as AuthEndpoint; // 'sessions', etc.
    const subEndpoint = pathSegments[3] as SessionSubEndpoint; // 'verify', 'createsession', etc.

    // Check if main endpoint exists and is enabled
    const endpointConfig = config.endpoints[endpoint as keyof typeof config.endpoints];
    if (!endpointConfig || !endpointConfig.enabled) {
      return createErrorResponse(
        "ENDPOINT_NOT_FOUND",
        "Endpoint not found",
        404
      );
    }

    // Validate HTTP method for endpoint (skip for OPTIONS)
    if (method !== 'OPTIONS' && !endpointConfig.methods.includes(method as any)) {
      return createErrorResponse(
        "METHOD_NOT_ALLOWED",
        "Method not allowed",
        405
      );
    }

    // Route to appropriate handler based on endpoint
    switch (endpoint) {
      case 'sessions':
        return handleSessionsEndpoint(request, method, subEndpoint, config);
      default:
        return createErrorResponse(
          "ENDPOINT_NOT_FOUND",
          "Endpoint not found",
          404
        );
    }
  };

  return {
    GET: handler,
    POST: handler,
  };
}

async function handleSessionsEndpoint(
  request: NextRequest,
  method: string,
  subEndpoint: SessionSubEndpoint | undefined,
  config: Required<TernSecureHandlerOptions>
): Promise<NextResponse> {
  // If no subEndpoint, this could be a general sessions endpoint
  if (!subEndpoint) {
    return createErrorResponse(
      "SUB_ENDPOINT_REQUIRED",
      "Session sub-endpoint required",
      400
    );
  }

  const sessionsConfig = config.endpoints.sessions;
  const subEndpointConfig = sessionsConfig?.subEndpoints?.[subEndpoint];
  
  // Check if session sub-endpoint exists and is enabled
  if (!subEndpointConfig || !subEndpointConfig.enabled) {
    return createErrorResponse(
      "ENDPOINT_NOT_FOUND",
      "Endpoint not found",
      404
    );
  }

  // Check if method is allowed for this sub-endpoint
  if (!subEndpointConfig.methods?.includes(method as any)) {
    return createErrorResponse(
      "METHOD_NOT_ALLOWED",
      "Method not allowed",
      405
    );
  }

  // Apply endpoint-specific security checks
  if (subEndpointConfig.security) {
    const securityResult = await validateSecurity(request, subEndpointConfig.security);
    if (securityResult) {
      return securityResult;
    }
  }

  if (method === 'GET') {
    return handleSessionGetRequest(request, subEndpoint, config);
  } else if (method === 'POST') {
    return handleSessionPostRequest(request, subEndpoint, config);
  } else {
    return createErrorResponse(
      "METHOD_NOT_ALLOWED",
      "Method not allowed",
      405
    );
  }
}

async function handleSessionGetRequest(
  request: NextRequest,
  subEndpoint: SessionSubEndpoint,
  _config: Required<TernSecureHandlerOptions>
): Promise<NextResponse> {
  switch (subEndpoint) {
    case 'verify':
      try {
        // Additional CSRF protection is already handled by validateSecurity

        const sessionCookie = request.cookies.get('_session_cookie')?.value;
        if (!sessionCookie) {
          return createErrorResponse(
            "UNAUTHORIZED",
            "Authentication required",
            401
          );
        }

        const decodedSession = ternDecodeJwtUnguarded(sessionCookie);
        if (decodedSession.errors) {
          return createErrorResponse(
            "UNAUTHORIZED",
            "Authentication required",
            401
          );
        }

        // Return minimal session info to prevent information disclosure
        return NextResponse.json({
          success: true,
          valid: true,
          uid: decodedSession.data?.payload?.sub,
          exp: decodedSession.data?.payload?.exp,
        });
      } catch (error) {
        return createErrorResponse(
          "UNAUTHORIZED",
          "Authentication required",
          401
        );
      }
    default:
      return createErrorResponse(
        "NOT_FOUND",
        "Endpoint not found",
        404
      );
  }
}

async function handleSessionPostRequest(
  request: NextRequest,
  subEndpoint: SessionSubEndpoint,
  _config: Required<TernSecureHandlerOptions>
): Promise<NextResponse> {
  const cookieStore = new NextCookieStore();
  
  try {
    console.log('[ternsecureNextjsHandler] handling session post request')
    const body = await request.json();
    const { idToken, csrfToken } = body;
    const csrfCookieValue = request.cookies.get("_session_terncf")?.value

    console.log('[ternsecureNextjsHandler] checking csrf token')
    const csrfValidationError = validateCsrfToken(csrfToken, csrfCookieValue);
    if (csrfValidationError) {
      return csrfValidationError;
    }

    console.log('[ternsecureNextjsHandler] successfully validated csrf token')

    switch (subEndpoint) {
      case 'createsession':
        if (!idToken) {
          return createErrorResponse(
            "INVALID_TOKEN",
            "ID token is required for creating session",
            400
          );
        }
        
        try {
          console.log('[ternsecureNextjsHandler] calling res to createsession cookie')
          const res = await createSessionCookie(idToken, cookieStore);

          if (!res.success) {
            console.error("[TernSecureAuthHandler] Error creating session:", {
              error: res.error,
              message: res.message,
              cookieSet: res.cookieSet,
            });
          }

          const statusCode = res.success
            ? 200
            : res.error === "INVALID_TOKEN"
              ? 400
              : res.error === "EXPIRED_TOKEN"
                ? 401
                : 500;

          return NextResponse.json(res, { status: statusCode });
        } catch (error) {
          return createErrorResponse(
            "SESSION_CREATION_FAILED",
            "Session creation failed",
            500
          );
        }

      case 'refresh':
        const currentSessionCookie = request.cookies.get('__session')?.value;
        if (!currentSessionCookie) {
          return createErrorResponse(
            "NO_SESSION",
            "No session to refresh",
            401
          );
        }

        try {
          const decodedSession = ternDecodeJwtUnguarded(currentSessionCookie);
          if (decodedSession.errors) {
            return createErrorResponse(
              "INVALID_SESSION",
              "Invalid session for refresh",
              401
            );
          }

          const refreshRes = await createSessionCookie(decodedSession.data?.payload?.sub || '', cookieStore);
          
          if (!refreshRes.success) {
            console.error("[TernSecureAuthHandler] Error refreshing session:", {
              error: refreshRes.error,
              message: refreshRes.message,
            });
          }

          const statusCode = refreshRes.success ? 200 : 401;
          return NextResponse.json(refreshRes, { status: statusCode });
        } catch (error) {
          return createErrorResponse(
            "REFRESH_FAILED",
            "Session refresh failed",
            500
          );
        }

      case 'revoke':
        const res = await clearSessionCookie(cookieStore);

        if (!res.success) {
          console.error("[TernSecureAuthHandler] Error revoking session:", {
            error: res.error,
            message: res.message,
          });
        }
        const statusCode = res.success ? 200 : 500;
        return NextResponse.json(res, { status: statusCode });

      default:
        return createErrorResponse(
          "SUB_ENDPOINT_NOT_SUPPORTED",
          "Sub-endpoint not supported for POST method",
          400
        );
    }
  } catch (error) {
    return createErrorResponse(
      "INVALID_REQUEST_FORMAT",
      "Invalid request format",
      400
    );
  }
}

const validateCsrfToken = (
  csrfToken: string,
  csrfCookieValue: string | undefined
): NextResponse | null => {
  if (!csrfToken) {
    return createErrorResponse(
      "INVALID_CSRF_TOKEN",
      "CSRF token is required",
      400
    );
  }

  if (!csrfCookieValue) {
    return createErrorResponse(
      "CSRF_COOKIE_MISSING",
      "CSRF token cookie not found",
      403
    );
  }

  if (csrfToken !== csrfCookieValue) {
    return createErrorResponse(
      "CSRF_TOKEN_MISMATCH",
      "CSRF token mismatch",
      403
    );
  }

  return null;
};

// Security validation functions
async function validateCors(
  request: NextRequest,
  corsOptions: CorsOptions
): Promise<NextResponse | null> {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  
  // Skip CORS for same-origin requests
  //if (!origin || (host && origin.includes(host))) {
  //  return null;
  //}

  // Check if origin is allowed
  if (corsOptions.allowedOrigins !== '*') {
    const isAllowed = corsOptions.allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.startsWith('*')) {
        const domain = allowedOrigin.slice(1);
        return origin?.endsWith(domain);
      }
      return origin === allowedOrigin;
    });

    if (!isAllowed) {
      return createErrorResponse(
        "CORS_ORIGIN_NOT_ALLOWED",
        "Origin not allowed",
        403
      );
    }
  }

  return null;
}

function handleOptionsRequest(corsOptions: CorsOptions): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  
  if (corsOptions.allowedOrigins === '*') {
    response.headers.set('Access-Control-Allow-Origin', '*');
  } else {
    // In a real implementation, you'd check the origin header
    response.headers.set('Access-Control-Allow-Origin', corsOptions.allowedOrigins.join(','));
  }
  
  response.headers.set('Access-Control-Allow-Methods', corsOptions.allowedMethods?.join(',') || 'GET,POST');
  response.headers.set('Access-Control-Allow-Headers', corsOptions.allowedHeaders?.join(',') || 'Content-Type,Authorization');
  
  if (corsOptions.allowCredentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  if (corsOptions.maxAge) {
    response.headers.set('Access-Control-Max-Age', corsOptions.maxAge.toString());
  }
  
  return response;
}

async function validateSecurity(
  request: NextRequest,
  securityOptions: SecurityOptions
): Promise<NextResponse | null> {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  const referer = request.headers.get('referer');
  const userAgent = request.headers.get('user-agent') || '';
  
  // CSRF Protection for cross-origin requests
  if (securityOptions.requireCSRF && origin && host && !origin.includes(host)) {
    const hasCSRFHeader = request.headers.get('x-requested-with') === 'XMLHttpRequest';
    const hasValidReferer = referer && host && referer.includes(host);
    
    if (!hasCSRFHeader && !hasValidReferer) {
      // Check if it's a valid referer from allowed list
      const isAllowedReferer = securityOptions.allowedReferers?.some((allowedRef: string) => 
        referer?.includes(allowedRef)
      );
      
      if (!isAllowedReferer) {
        return createErrorResponse(
          "CSRF_PROTECTION",
          "Access denied",
          403
        );
      }
    }
  }

  // Required headers validation
  if (securityOptions.requiredHeaders) {
    for (const [headerName, expectedValue] of Object.entries(securityOptions.requiredHeaders)) {
      const actualValue = request.headers.get(headerName);
      if (actualValue !== expectedValue) {
        return createErrorResponse(
          "INVALID_HEADERS",
          "Required header missing or invalid",
          400
        );
      }
    }
  }

  // User Agent filtering
  if (securityOptions.userAgent?.block?.length) {
    const isBlocked = securityOptions.userAgent.block.some((blocked: string) => 
      userAgent.toLowerCase().includes(blocked.toLowerCase())
    );
    
    if (isBlocked) {
      return createErrorResponse(
        "USER_AGENT_BLOCKED",
        "Access denied",
        403
      );
    }
  }

  if (securityOptions.userAgent?.allow?.length) {
    const isAllowed = securityOptions.userAgent.allow.some((allowed: string) => 
      userAgent.toLowerCase().includes(allowed.toLowerCase())
    );
    
    if (!isAllowed) {
      return createErrorResponse(
        "USER_AGENT_NOT_ALLOWED",
        "Access denied",
        403
      );
    }
  }

  return null;
}

// Helper function to get client IP (for future rate limiting implementation)
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || clientIP || 'unknown';
}