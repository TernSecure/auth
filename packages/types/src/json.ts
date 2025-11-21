import type { IdTokenResult, TernSecureUser } from 'all';

import type { SessionStatus } from './session';

export interface TernSecureApiErrorJSON {
  code: string;
  message: string;
}

export interface TernSecureFireRestErrorJSON extends TernSecureApiErrorJSON {
  domain: string;
  reason: string;
}

export interface SessionJson extends IdTokenResult {
  status: SessionStatus;
  user?: TernSecureUser;
}

/**
 * Currently representing API DTOs in their JSON form.
*/
export interface TernSecureResourceJSON {
  id: string;
  object: string;
}