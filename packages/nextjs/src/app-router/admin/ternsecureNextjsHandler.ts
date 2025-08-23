import { NextRequest, NextResponse } from "next/server";
import {
  createSessionCookie,
  clearSessionCookie,
} from "@tern-secure/backend/admin";
import { ternDecodeJwtUnguarded } from "@tern-secure/backend/jwt";
import { NextCookieStore } from "../../utils/NextCookieAdapter";

type AuthEndpoint = 'sessions';
type SessionSubEndpoint = 'verify' | 'createsession' | 'refresh' | 'revoke';

const AUTH_ENDPOINT_METHODS: Record<AuthEndpoint, ('GET' | 'POST')[]> = {
  sessions: ['GET', 'POST'],
};

const SESSION_ENDPOINT_METHODS: Record<SessionSubEndpoint, ('GET' | 'POST')[]> = {
  verify: ['GET'],
  createsession: ['POST'],
  refresh: ['POST'],
  revoke: ['POST'],
};

export function createTernSecureNextJsHandler() {
  const handler = async (request: NextRequest): Promise<NextResponse> => {
    const method = request.method as 'GET' | 'POST';
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    
    // Expected route structure: /api/auth/{endpoint} or /api/auth/{endpoint}/{subEndpoint}
    // pathSegments should be ['api', 'auth', 'endpoint'] or ['api', 'auth', 'endpoint', 'subEndpoint']
    if (pathSegments.length < 3) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid route structure. Expected: /api/auth/{endpoint}",
          error: "INVALID_ROUTE",
        },
        { status: 404 }
      );
    }

    const endpoint = pathSegments[2] as AuthEndpoint; // 'sessions', etc.
    const subEndpoint = pathSegments[3] as SessionSubEndpoint; // 'verify', 'createsession', etc.

    // Check if main endpoint exists
    if (!AUTH_ENDPOINT_METHODS[endpoint]) {
      return NextResponse.json(
        {
          success: false,
          message: `Auth endpoint '${endpoint}' not found`,
          error: "ENDPOINT_NOT_FOUND",
          availableEndpoints: Object.keys(AUTH_ENDPOINT_METHODS),
        },
        { status: 404 }
      );
    }

    // Route to appropriate handler based on endpoint
    switch (endpoint) {
      case 'sessions':
        return handleSessionsEndpoint(request, method, subEndpoint);
      default:
        return NextResponse.json(
          {
            success: false,
            message: `Endpoint '${endpoint}' not implemented`,
            error: "ENDPOINT_NOT_IMPLEMENTED",
          },
          { status: 501 }
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
  method: 'GET' | 'POST',
  subEndpoint?: SessionSubEndpoint
): Promise<NextResponse> {
  // If no subEndpoint, this could be a general sessions endpoint
  if (!subEndpoint) {
    return NextResponse.json(
      {
        success: false,
        message: "Session sub-endpoint required. Available: " + Object.keys(SESSION_ENDPOINT_METHODS).join(', '),
        error: "SUB_ENDPOINT_REQUIRED",
        availableSubEndpoints: Object.keys(SESSION_ENDPOINT_METHODS),
      },
      { status: 400 }
    );
  }

  // Check if session sub-endpoint exists
  if (!SESSION_ENDPOINT_METHODS[subEndpoint]) {
    return NextResponse.json(
      {
        success: false,
        message: `Session sub-endpoint '${subEndpoint}' not found`,
        error: "SUB_ENDPOINT_NOT_FOUND",
        availableSubEndpoints: Object.keys(SESSION_ENDPOINT_METHODS),
      },
      { status: 404 }
    );
  }

  // Check if method is allowed for this sub-endpoint
  if (!SESSION_ENDPOINT_METHODS[subEndpoint].includes(method)) {
    return NextResponse.json(
      {
        success: false,
        message: `Method ${method} not allowed for endpoint '/sessions/${subEndpoint}'`,
        error: "METHOD_NOT_ALLOWED",
        allowedMethods: SESSION_ENDPOINT_METHODS[subEndpoint],
      },
      { status: 405 }
    );
  }

  if (method === 'GET') {
    return handleSessionGetRequest(request, subEndpoint);
  } else if (method === 'POST') {
    return handleSessionPostRequest(request, subEndpoint);
  } else {
    return NextResponse.json(
      {
        success: false,
        message: "Method not allowed",
        error: "METHOD_NOT_ALLOWED",
      },
      { status: 405 }
    );
  }
}

async function handleSessionGetRequest(
  request: NextRequest,
  subEndpoint: SessionSubEndpoint
): Promise<NextResponse> {
  switch (subEndpoint) {
    case 'verify':
      try {
        const sessionCookie = request.cookies.get('__session')?.value;
        if (!sessionCookie) {
          return NextResponse.json(
            {
              success: false,
              message: "No session found",
              error: "NO_SESSION",
            },
            { status: 401 }
          );
        }

        const decodedSession = ternDecodeJwtUnguarded(sessionCookie);
        if (decodedSession.errors) {
          return NextResponse.json(
            {
              success: false,
              message: "Invalid session",
              error: "INVALID_SESSION",
            },
            { status: 401 }
          );
        }

        return NextResponse.json({
          success: true,
          valid: true,
          session: decodedSession.data,
        });
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            message: "Session verification failed",
            error: "SESSION_VERIFICATION_FAILED",
          },
          { status: 500 }
        );
      }
    default:
      return NextResponse.json(
        {
          success: false,
          message: "Sub-endpoint not supported for GET method",
          error: "SUB_ENDPOINT_NOT_SUPPORTED",
        },
        { status: 400 }
      );
  }
}

async function handleSessionPostRequest(
  request: NextRequest,
  subEndpoint: SessionSubEndpoint
): Promise<NextResponse> {
  const cookieStore = new NextCookieStore();
  
  try {
    const body = await request.json();
    const { idToken, csrfToken } = body;
    const csrfCookieValue = request.cookies.get("_session_terncf")?.value;

    const csrfValidationError = validateCsrfToken(csrfToken, csrfCookieValue);
    if (csrfValidationError) {
      return csrfValidationError;
    }

    switch (subEndpoint) {
      case 'createsession':
        if (!idToken) {
          return NextResponse.json(
            {
              success: false,
              message: "ID token is required for creating session",
              error: "INVALID_TOKEN",
            },
            { status: 400 }
          );
        }
        
        try {
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
          return NextResponse.json(
            {
              success: false,
              message: "Session creation failed",
              error: "SESSION_CREATION_FAILED",
            },
            { status: 500 }
          );
        }

      case 'refresh':
        const currentSessionCookie = request.cookies.get('__session')?.value;
        if (!currentSessionCookie) {
          return NextResponse.json(
            {
              success: false,
              message: "No session to refresh",
              error: "NO_SESSION",
            },
            { status: 401 }
          );
        }

        try {
          const decodedSession = ternDecodeJwtUnguarded(currentSessionCookie);
          if (decodedSession.errors) {
            return NextResponse.json(
              {
                success: false,
                message: "Invalid session for refresh",
                error: "INVALID_SESSION",
              },
              { status: 401 }
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
          return NextResponse.json(
            {
              success: false,
              message: "Session refresh failed",
              error: "REFRESH_FAILED",
            },
            { status: 500 }
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
        return NextResponse.json(
          {
            success: false,
            message: "Sub-endpoint not supported for POST method",
            error: "SUB_ENDPOINT_NOT_SUPPORTED",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid request format",
        error: "INVALID_REQUEST_FORMAT",
      },
      { status: 400 }
    );
  }
}

const validateCsrfToken = (
  csrfToken: string,
  csrfCookieValue: string | undefined
): NextResponse | null => {
  if (!csrfToken) {
    return NextResponse.json(
      {
        success: false,
        message: "CSRF token is required",
        error: "INVALID_CSRF_TOKEN",
      },
      { status: 400 }
    );
  }

  if (!csrfCookieValue) {
    return NextResponse.json(
      {
        success: false,
        message: "CSRF token cookie not found",
        error: "CSRF_COOKIE_MISSING",
      },
      { status: 403 }
    );
  }

  if (csrfToken !== csrfCookieValue) {
    return NextResponse.json(
      {
        success: false,
        message: "CSRF token mismatch",
        error: "CSRF_TOKEN_MISMATCH",
      },
      { status: 403 }
    );
  }

  return null;
};