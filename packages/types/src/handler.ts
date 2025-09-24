import type { CookieOptions } from './cookie'

export type AuthEndpoint = 'sessions' | 'users';
export type SessionSubEndpoint = 'verify' | 'createsession' | 'refresh' | 'revoke';
export interface CorsOptions {
  allowedOrigins: string[] | '*';
  allowedMethods?: string[];
  allowedHeaders?: string[];
  allowCredentials?: boolean;
  maxAge?: number;
  skipSameOrigin?: boolean;
}

export interface SessionCookieConfig {
  domain?: string;
  path?: string;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number; // Can be set from 5 minutes (300) to 2 weeks (1209600)
}

export interface TokenCookieConfig {
  domain?: string;
  path: string;
  httpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
}

export interface CookieOpts extends CookieOptions {
  namePrefix?: string;
  domain?: string;
  session?: SessionCookieConfig;
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
  methods: ('GET' | 'POST' | 'PUT' | 'DELETE')[];
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
  cookies?: CookieOpts;
  rateLimit?: RateLimitOptions;
  security?: SecurityOptions;
  endpoints?: {
    sessions?: SessionEndpointConfig;
  };
  tenantId?: string | null;
  enableCustomToken?: boolean;
  debug?: boolean;
  environment?: 'development' | 'production' | 'test';
  basePath?: string;
}