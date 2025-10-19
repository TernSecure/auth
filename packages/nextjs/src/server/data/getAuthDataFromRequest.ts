import type { AuthObject } from '@tern-secure/backend';
import { AuthStatus, signedInAuthObject, signedOutAuthObject } from '@tern-secure/backend';
import { ternDecodeJwt } from '@tern-secure/backend/jwt';

import { getAuthKeyFromRequest } from '../../server/headers-utils';
import type { RequestLike } from '../../server/types';


/**
 * Auth objects moving through the server -> client boundary need to be serializable
 * as we need to ensure that they can be transferred via the network as pure strings.
 * Some frameworks like Remix or Next (/pages dir only) handle this serialization by simply
 * ignoring any non-serializable keys, however Nextjs /app directory is stricter and
 * throws an error if a non-serializable value is found.
 * @internal
 */
export const authObjectToSerializable = <T extends Record<string, unknown>>(obj: T): T => {
  // remove any non-serializable props from the returned object

  const { require, ...rest } = obj as unknown as AuthObject;
  return rest as unknown as T;
};

export function getTernSecureAuthData(req: RequestLike, initialState = {}) {
  const authObject = getAuthDataFromRequest(req);
  return authObjectToSerializable({ ...initialState, ...authObject });
}

export function getAuthDataFromRequest(req: RequestLike): AuthObject {
  const authStatus = getAuthKeyFromRequest(req, 'AuthStatus');
  const authToken = getAuthKeyFromRequest(req, 'AuthToken');
  const authSignature = getAuthKeyFromRequest(req, 'AuthSignature');
  const authReason = getAuthKeyFromRequest(req, 'AuthReason');

  let authObject;
  if (!authStatus || authStatus !== AuthStatus.SignedIn) {
    authObject = signedOutAuthObject();
  } else {
    const jwt = ternDecodeJwt(authToken as string);

    authObject = signedInAuthObject(jwt.raw.text, jwt.payload);
  }
  return authObject;
}
