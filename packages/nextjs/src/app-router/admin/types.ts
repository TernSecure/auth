import type {
  AuthEndpoint,
  CookieOpts as CookieOptions,
  CorsOptions,
  EndpointConfig,
  SecurityOptions,
  SessionEndpointConfig,
  SessionSubEndpoint,
  TernSecureHandlerOptions,
  TokenCookieConfig,
} from '@tern-secure/types';
import { type NextResponse } from 'next/server';

export const DEFAULT_CORS_OPTIONS: CorsOptions = {
  allowedOrigins: [],
  allowedMethods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  allowCredentials: true,
  maxAge: 86400, // 24 hours
};

export const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  namePrefix: '__session',
  path: '/',
  httpOnly: true,
  sameSite: 'lax',
  session: {
    maxAge: 3600 * 24 * 7, // Default: 1 week (consumer can set 5 mins to 2 weeks)
  },
};

export const FIXED_TOKEN_CONFIGS = {
  id: {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 3600, // 1 hour
  },
  refresh: {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 3600 * 24 * 30, // 30 days (changes when user events occur)
  },
  signature: {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 3600 * 24 * 7, // 1 week (as needed)
  },
  custom: {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 3600 * 24 * 7, // 1 week (as needed)
  },
} as const;

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
  methods: ['GET', 'POST'],
  requireAuth: false,
  security: DEFAULT_SECURITY_OPTIONS,
};

export const DEFAULT_SESSIONS_CONFIG: SessionEndpointConfig = {
  ...DEFAULT_ENDPOINT_CONFIG,
  subEndpoints: {
    verify: {
      enabled: true,
      methods: ['GET'],
      requireAuth: false,
      security: {
        requireCSRF: true,
        allowedReferers: [],
      },
    },
    createsession: {
      enabled: true,
      methods: ['POST'],
      requireAuth: false,
      security: {
        requireCSRF: true,
      },
    },
    refresh: {
      enabled: true,
      methods: ['POST'],
      requireAuth: true,
      security: {
        requireCSRF: true,
      },
    },
    revoke: {
      enabled: true,
      methods: ['POST'],
      requireAuth: true,
      security: {
        requireCSRF: true,
      },
    },
  },
};

export const DEFAULT_HANDLER_OPTIONS: Required<TernSecureHandlerOptions> & {
  endpoints: Required<NonNullable<TernSecureHandlerOptions['endpoints']>>;
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
  tenantId: '',
  enableCustomToken: false,
  debug: false,
  environment: 'production',
  basePath: '/api/auth',
};

export interface ValidationResult {
  error?: NextResponse;
  data?: any;
}

export interface ValidationConfig {
  cors?: CorsOptions;
  security?: SecurityOptions;
  endpoint?: {
    name: AuthEndpoint;
    config: EndpointConfig;
  };
  subEndpoint?: {
    name: SessionSubEndpoint;
    config: EndpointConfig;
  };
  requireIdToken?: boolean;
  requireCsrfToken?: boolean;
}

export interface ComprehensiveValidationResult {
  isValid: boolean;
  error?: Response;
  corsResponse?: Response;
  sessionData?: {
    body: any;
    idToken?: string;
    csrfToken?: string;
  };
}

export type suffix = 'session' | 'id' | 'refresh' | 'signature' | 'custom';

export class CookieUtils {
  static getCookieName(namePrefix: string, tokenType: suffix): string {
    return `${namePrefix}.${tokenType}`;
  }

  static getCookieNames(namePrefix: string) {
    return {
      session: this.getCookieName(namePrefix, 'session'),
      id: this.getCookieName(namePrefix, 'id'),
      refresh: this.getCookieName(namePrefix, 'refresh'),
      signature: this.getCookieName(namePrefix, 'signature'),
      custom: this.getCookieName(namePrefix, 'custom'),
    };
  }

  static getSessionConfig(cookieOptions: CookieOptions): TokenCookieConfig {
    const sessionConfig = cookieOptions.session || {};
    const defaultSession = DEFAULT_COOKIE_OPTIONS.session || {};

    return {
      domain: sessionConfig.domain ?? cookieOptions.domain,
      path: sessionConfig.path ?? cookieOptions.path ?? '/',
      httpOnly: sessionConfig.httpOnly ?? cookieOptions.httpOnly ?? true,
      sameSite: sessionConfig.sameSite ?? cookieOptions.sameSite ?? 'lax',
      maxAge: sessionConfig.maxAge ?? defaultSession.maxAge ?? 3600 * 24 * 7,
    };
  }

  static getFixedTokenConfig(
    cookieOptions: CookieOptions,
    tokenType: Exclude<suffix, 'session'>,
  ): TokenCookieConfig {
    const fixedConfig = FIXED_TOKEN_CONFIGS[tokenType];

    return {
      domain: cookieOptions.domain,
      path: fixedConfig.path,
      httpOnly: fixedConfig.httpOnly,
      sameSite: fixedConfig.sameSite,
      maxAge: fixedConfig.maxAge,
    };
  }

  static validateSessionMaxAge(maxAge: number): boolean {
    const minAge = 300; // 5 minutes
    const maxAgeLimit = 3600 * 24 * 14; // 2 weeks
    return maxAge >= minAge && maxAge <= maxAgeLimit;
  }
}

export {
  AuthEndpoint,
  CookieOptions,
  CorsOptions,
  SecurityOptions,
  SessionSubEndpoint,
  EndpointConfig,
  SessionEndpointConfig,
  TernSecureHandlerOptions,
};
