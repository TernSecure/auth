import {
  JWTPayload,
} from "jose";

import type { DecodedIdToken } from "@tern-secure/types";

export function mapJwtPayloadToDecodedIdToken(payload: JWTPayload) {
  const decodedIdToken = payload as DecodedIdToken;
  decodedIdToken.uid = decodedIdToken.sub;
  return decodedIdToken;
}