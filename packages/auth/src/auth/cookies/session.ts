import { cookieHandler, getCookieName, getCookiePrefix } from '@tern-secure/shared/cookie';

const SESSION_COOKIE_NAME = '__session';
const ID_TOKEN_COOKIE_NAME = 'TernSecure_[DEFAULT]';
const REFRESH_TOKEN_COOKIE_NAME = 'TernSecureID_[DEFAULT]';
const CUSTOM_COOKIE_NAME = '__custom';

export type SessionCookieHandler = {
  set: (token: string) => void;
  remove: () => void;
  get: () => string | undefined;
};

export const createSessionCookie = (): SessionCookieHandler => {
  const sessionCookie = cookieHandler(SESSION_COOKIE_NAME);

  const set = (token: string) => {
    sessionCookie.set(token, {
      httpOnly: false,
      secure: true,
      sameSite: 'strict',
      path: '/',
    });
  };

  const remove = () => {
    sessionCookie.remove({
      path: '/',
    });
  };

  const get = () => {
    return sessionCookie.get();
  };

  return {
    set,
    remove,
    get,
  };
};

export const createIdTokenCookie = (): SessionCookieHandler => {
  const prefix = getCookiePrefix();
  const cookieName = getCookieName(ID_TOKEN_COOKIE_NAME, prefix);
  const sessionCookie = cookieHandler(cookieName);

  const set = (token: string) => {
    sessionCookie.set(token, {
      httpOnly: false,
      secure: true,
      sameSite: 'strict',
      path: '/',
    });
  };

  const remove = () => {
    sessionCookie.remove({
      path: '/',
    });
  };

  const get = () => sessionCookie.get();

  return {
    set,
    remove,
    get,
  };
};
