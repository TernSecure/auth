import type { CookieOptions, TernSecureHandlerOptions } from '@tern-secure/types';

import { DEFAULT_ID_REFRESH_TOKEN_COOKIE_OPTIONS, DEFAULT_SESSION_COOKIE_OPTIONS } from './types';

const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60;


export function getIdTokenCookieOptions(
): Required<Pick<CookieOptions, 'path' | 'httpOnly' | 'secure' | 'sameSite'>> &
  Pick<CookieOptions, 'maxAge' | 'priority'> {
  return {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: ONE_YEAR_IN_SECONDS,
    priority: 'high',
  };
}

export function getSessionCookieOptions(
  config?: TernSecureHandlerOptions,
): Required<Pick<CookieOptions, 'path' | 'httpOnly' | 'secure' | 'sameSite'>> &
  Pick<CookieOptions, 'maxAge' | 'priority'> {
  return {
    path: config?.cookies?.path ?? DEFAULT_SESSION_COOKIE_OPTIONS.path ?? '/',
    httpOnly: config?.cookies?.httpOnly ?? DEFAULT_SESSION_COOKIE_OPTIONS.httpOnly ?? true,
    secure:
      config?.cookies?.secure ?? DEFAULT_SESSION_COOKIE_OPTIONS.secure ?? process.env.NODE_ENV === 'production',
    sameSite: config?.cookies?.sameSite ?? DEFAULT_SESSION_COOKIE_OPTIONS.sameSite ?? 'strict',
    maxAge: config?.cookies?.maxAge ?? DEFAULT_SESSION_COOKIE_OPTIONS.maxAge,
    priority: config?.cookies?.priority ?? DEFAULT_SESSION_COOKIE_OPTIONS.priority,
  };
}


export function getDeleteOptions(options?: {
  cookies?: TernSecureHandlerOptions['cookies'];
  revokeRefreshTokensOnSignOut?: boolean;
}): {
  path: string;
  httpOnly?: boolean;
  secure?: boolean;
  domain?: string;
  sameSite?: 'lax' | 'strict' | 'none';
  revokeRefreshTokensOnSignOut?: boolean;
} {
  return {
    path: options?.cookies?.path ?? DEFAULT_ID_REFRESH_TOKEN_COOKIE_OPTIONS.path ?? '/',
    httpOnly: options?.cookies?.httpOnly ?? DEFAULT_ID_REFRESH_TOKEN_COOKIE_OPTIONS.httpOnly ?? true,
    secure:
      options?.cookies?.secure ?? DEFAULT_ID_REFRESH_TOKEN_COOKIE_OPTIONS.secure ?? process.env.NODE_ENV === 'production',
    sameSite: options?.cookies?.sameSite ?? DEFAULT_ID_REFRESH_TOKEN_COOKIE_OPTIONS.sameSite ?? 'strict',
    revokeRefreshTokensOnSignOut: options?.revokeRefreshTokensOnSignOut ?? true,
  };
}
