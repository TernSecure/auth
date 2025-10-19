import { createEventBus } from '@tern-secure/shared/eventBus';
import type { IdTokenResult } from '@tern-secure/types';

export const events = {
  UserSignOut: 'user:userSignOut',
  SessionChanged: 'session:sessionChanged',
  TokenRefreshed: 'token:tokenRefreshed',
  TokenUpdate: 'token:tokenUpdate',
  TokenJwt: 'token:tokenJwt',
} as const;

type TokenUpdatePayload = { token: IdTokenResult | null };
type TokenJwt = { tokenType: 'idToken' | 'sessionToken' | 'refreshToken' | 'customToken', response: string };

type InternalEvents = {
  [events.UserSignOut]: null;
  [events.SessionChanged]: null;
  [events.TokenRefreshed]: TokenUpdatePayload;
  [events.TokenUpdate]: TokenUpdatePayload;
  [events.TokenJwt]: TokenJwt;
};

export const eventBus = createEventBus<InternalEvents>();
