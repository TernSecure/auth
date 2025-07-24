'use server'

import { clearSessionCookie } from "@tern-secure/backend";
import { CookieStore } from '@tern-secure/types';

const SESSION_COOKIE_NAME = '_session_cookie';

export async function clearSessionCookieServer(cookieStore: CookieStore) {
    return clearSessionCookie(cookieStore);
}