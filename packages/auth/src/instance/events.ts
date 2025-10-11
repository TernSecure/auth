import { createEventBus } from "@tern-secure/shared/eventBus";
import type { IdTokenResult  } from "@tern-secure/types";

export const events = {
  UserSignOut: "user:userSignOut",
  SessionChanged: "session:sessionChanged",
  TokenRefreshed: "token:tokenRefreshed",
  TokenUpdate: "token:tokenUpdate"
} as const;

type TokenUpdatePayload = { token: IdTokenResult | null };


type InternalEvents = {
  [events.UserSignOut]: null;
  [events.SessionChanged]: null;
  [events.TokenRefreshed]: TokenUpdatePayload;
  [events.TokenUpdate]: TokenUpdatePayload;
};

export const eventBus = createEventBus<InternalEvents>();
