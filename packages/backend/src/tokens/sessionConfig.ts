import type { RequestOptions } from "./types";

export const getSessionConfig = (options?: RequestOptions) => {
  const cookieConfig = options?.cookies?.session_cookie;
  
  return {
    COOKIE_NAME: cookieConfig?.name,
    DEFAULT_EXPIRES_IN_MS: cookieConfig?.attributes?.maxAge,
    DEFAULT_EXPIRES_IN_SECONDS: Math.floor((cookieConfig?.attributes?.maxAge || 0) / 1000),
    REVOKE_REFRESH_TOKENS_ON_SIGNOUT: cookieConfig?.revokeRefreshTokensOnSignOut,
  };
};


export const getCookieOptions = (options?: RequestOptions) => {
  const cookieConfig = options?.cookies?.session_cookie;
  
  return {
    httpOnly: cookieConfig?.attributes?.httpOnly,
    secure: cookieConfig?.attributes?.secure,
    sameSite: cookieConfig?.attributes?.sameSite,
    path: cookieConfig?.attributes?.path,
  };
};