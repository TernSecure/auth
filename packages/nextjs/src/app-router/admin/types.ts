export interface CorsOptions {
  allowedOrigins: string[] | "*";
  allowedMethods?: string[];
  allowedHeaders?: string[];
  allowCredentials?: boolean;
  maxAge?: number;
}

export interface CookieOptions {
  name?: string;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "strict" | "lax" | "none";
  maxAge?: number;
}

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  skipSuccessful?: boolean;
  skipFailedRequests?: boolean;
}

export interface SecurityOptions {
  requireCSRF?: boolean;
  allowedReferers?: string[];
  requiredHeaders?: Record<string, string>;
  ipWhitelist?: string[];
  userAgent?: {
    block?: string[];
    allow?: string[];
  };
}

export interface EndpointConfig {
  enabled: boolean;
  methods: ("GET" | "POST" | "PUT" | "DELETE")[];
  requireAuth?: boolean;
  rateLimit?: RateLimitOptions;
  security?: SecurityOptions;
  cors?: Partial<CorsOptions>;
}

export interface SessionEndpointConfig extends EndpointConfig {
  subEndpoints?: {
    [K in SessionSubEndpoint]?: Partial<EndpointConfig>;
  };
}

export interface TernSecureHandlerOptions {
  cors?: CorsOptions;
  cookies?: CookieOptions;
  rateLimit?: RateLimitOptions;
  security?: SecurityOptions;

  // Endpoint configurations
  endpoints?: {
    sessions?: SessionEndpointConfig;
    // Future endpoints can be added here
    // users?: EndpointConfig;
    // tokens?: EndpointConfig;
  };

  // Global settings
  debug?: boolean;
  environment?: "development" | "production" | "test";
  basePath?: string;
}

// Re-export existing types
export type AuthEndpoint = "sessions";
export type SessionSubEndpoint =
  | "verify"
  | "createsession"
  | "refresh"
  | "revoke";

// Default configurations
export const DEFAULT_CORS_OPTIONS: CorsOptions = {
  allowedOrigins: [],
  allowedMethods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  allowCredentials: true,
  maxAge: 86400, // 24 hours
};

export const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  name: "__session",
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
  maxAge: 3600 * 24 * 7, // 7 days
};

export const DEFAULT_SECURITY_OPTIONS: SecurityOptions = {
  requireCSRF: true,
  allowedReferers: [],
  requiredHeaders: {},
  ipWhitelist: [],
  userAgent: {
    block: [],
    allow: [],
  },
};

export const DEFAULT_ENDPOINT_CONFIG: EndpointConfig = {
  enabled: true,
  methods: ["GET", "POST"],
  requireAuth: false,
  security: DEFAULT_SECURITY_OPTIONS,
};

export const DEFAULT_SESSIONS_CONFIG: SessionEndpointConfig = {
  ...DEFAULT_ENDPOINT_CONFIG,
  subEndpoints: {
    verify: {
      enabled: true,
      methods: ["GET"],
      requireAuth: false,
      security: {
        requireCSRF: true,
        allowedReferers: [],
      },
    },
    createsession: {
      enabled: true,
      methods: ["POST"],
      requireAuth: false,
      security: {
        requireCSRF: true,
      },
    },
    refresh: {
      enabled: true,
      methods: ["POST"],
      requireAuth: true,
      security: {
        requireCSRF: true,
      },
    },
    revoke: {
      enabled: true,
      methods: ["POST"],
      requireAuth: true,
      security: {
        requireCSRF: true,
      },
    },
  },
};

export const DEFAULT_HANDLER_OPTIONS: Required<TernSecureHandlerOptions> & {
  endpoints: Required<NonNullable<TernSecureHandlerOptions["endpoints"]>>;
} = {
  cors: DEFAULT_CORS_OPTIONS,
  cookies: DEFAULT_COOKIE_OPTIONS,
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessful: false,
    skipFailedRequests: false,
  },
  security: DEFAULT_SECURITY_OPTIONS,
  endpoints: {
    sessions: DEFAULT_SESSIONS_CONFIG,
  },
  debug: false,
  environment: "production",
  basePath: "/api/auth",
};
