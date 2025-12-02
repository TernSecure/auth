import type { DecodedAppCheckToken, DecodedIdToken } from "@tern-secure/types";
import type {
  JWTPayload,
} from "jose";

export function mapJwtPayloadToDecodedIdToken(payload: JWTPayload) {
  const decodedIdToken = payload as DecodedIdToken;
  decodedIdToken.uid = decodedIdToken.sub;
  return decodedIdToken;
}


export function mapJwtPayloadToDecodedAppCheckToken(payload: JWTPayload) {
  const decodedAppCheckToken = payload as DecodedAppCheckToken;
  decodedAppCheckToken.app_id = decodedAppCheckToken.sub;
  return decodedAppCheckToken;
}