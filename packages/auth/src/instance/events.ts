import { createEventBus } from '@tern-secure/shared/eventBus';
import {
  TernSecureUser,
} from '@tern-secure/types';

export const events = {
  UserChanged: 'user:userChanged',
  UserSignOut: 'user:userSignOut',
  SessionChanged: 'session:sessionChanged',
  TokenRefreshed: 'token:tokenRefreshed',
} as const;

type InternalEvents = {
    [events.UserChanged]: TernSecureUser | null;
    [events.UserSignOut]: null;
    [events.SessionChanged]: null;
    [events.TokenRefreshed]: null;
}

export const eventBus = createEventBus<InternalEvents>();