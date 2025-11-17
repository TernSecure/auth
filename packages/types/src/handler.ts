import type { CookieOptions } from './cookie'

export type AuthEndpoint = 'cookies' | 'sessions' | 'users' | 'sign_ins';
export type CookieSubEndpoint = 'get' | 'set' | 'delete' | 'clear' | 'list';
export type SessionSubEndpoint = 'verify' | 'createsession' | 'refresh' | 'revoke';
export type SignInSubEndpoint = 'resetPasswordEmail';
export interface CorsOptions {
  allowedOrigins: string[] | '*';
  allowedMethods?: string[];
  allowedHeaders?: string[];
  allowCredentials?: boolean;
  maxAge?: number;
  skipSameOrigin?: boolean;
}

export interface SessionCookieConfig {
  path?: string;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  partitioned?: boolean;
  maxAge?: number; // Can be set from 5 minutes (300) to 2 weeks (1209600)
  priority?: 'low' | 'medium' | 'high';
}

export interface TokenCookieConfig {
  path: string;
  httpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  partitioned?: boolean;
  maxAge: number;
  expires?: Date;
  priority?: 'low' | 'medium' | 'high';
}

export interface CookieOpts extends CookieOptions {
  domain?: string;
  namePrefix?: string;
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

export interface CookieEndpointConfig extends EndpointConfig {
  subEndpoints?: {
    [K in CookieSubEndpoint]?: Partial<EndpointConfig>;
  };
}

export interface SessionEndpointConfig extends EndpointConfig {
  subEndpoints?: {
    [K in SessionSubEndpoint]?: Partial<EndpointConfig>;
  };
}

export interface SignInEndpointConfig extends EndpointConfig {
  subEndpoints?: {
    [K in SignInSubEndpoint]?: Partial<EndpointConfig>;
  };
}
export interface TernSecureHandlerOptions {
  cors?: CorsOptions;
  cookies?: CookieOpts;
  rateLimit?: RateLimitOptions;
  security?: SecurityOptions;
  endpoints?: {
    cookies?: CookieEndpointConfig;
    sessions?: SessionEndpointConfig;
    signIns?: SignInEndpointConfig;
  };
  tenantId?: string | null;
  revokeRefreshTokensOnSignOut?: boolean;
  enableCustomToken?: boolean;
  debug?: boolean;
  environment?: 'development' | 'production' | 'test';
  basePath?: string;
}