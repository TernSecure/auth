import type { CookieOptions, CookieStore } from '@tern-secure/types';
import Cookies from 'js-cookie';

type removeCookieParams = {
  path?: string;
  domain?: string;
};

export function cookieHandler(cookieNanme: string) {
  return {
    set(value: string, options: Cookies.CookieAttributes = {}): void {
      Cookies.set(cookieNanme, value, options);
    },
    get() {
      return Cookies.get(cookieNanme);
    },
    remove(removeCookieParams?: removeCookieParams) {
      Cookies.remove(cookieNanme, removeCookieParams);
    },
  };
}

export type CookieAttributes = Cookies.CookieAttributes;

export function serverCookieHandler(response: Response): CookieStore {
  const getCookie = async (name: string): Promise<{ value: string | undefined }> => {
    const cookies = response.headers.get('cookie');
    if (!cookies) return { value: undefined };

    const match = cookies.match(new RegExp(`${name}=([^;]+)`));
    return { value: match ? decodeURIComponent(match[1]) : undefined };
  };

  const setCookie = async (
    name: string,
    value: string,
    options: CookieOptions = {},
  ): Promise<void> => {
    const { maxAge, httpOnly = true, secure = true, sameSite = 'strict', path = '/' } = options;

    let cookieString = `${name}=${encodeURIComponent(value)}`;

    if (maxAge) cookieString += `; Max-Age=${maxAge}`;
    if (httpOnly) cookieString += '; HttpOnly';
    if (secure) cookieString += '; Secure';
    if (sameSite) cookieString += `; SameSite=${sameSite}`;
    if (path) cookieString += `; Path=${path}`;

    response.headers.append('Set-Cookie', cookieString);
  };

  const deleteCookie = async (name: string): Promise<void> => {
    await setCookie(name, '', {
      maxAge: 0,
      httpOnly: true,
      secure: true,
      path: '/',
    });
  };

  return {
    get: getCookie,
    set: setCookie,
    delete: deleteCookie,
  };
}

export const getCookiePrefix = (): string => {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction ? '__HOST-' : '__dev_';
};

export const getCookieName = (baseName: string, prefix?: string): string => {
  return prefix ? `${prefix}${baseName}` : baseName;
};

