import type { Aobj, TernSecureUser} from '../../server/data/getAuthDataFromRequest';
import { getAuthDataFromRequestNode } from '../../server/data/getAuthDataFromRequest';
import type { RequestLike } from '../../server/types';
import { buildRequestLike } from './utils';

/**
 * `Auth` object of the currently active user and the `redirectToSignIn()` method.
 */
type Auth = Aobj;

export interface AuthFn {
  (): Promise<Auth>;
}

const createAuthObject = () => {
  return async (req: RequestLike) => {
    return getAuthDataFromRequestNode(req);
  };
};

/**
 * Get the current authenticated user from the session cookies
 */
export const authNew: AuthFn = async () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('server-only');

  const request = await buildRequestLike();

  const authObject = await createAuthObject()(request);

  return Object.assign(authObject);
};


export { TernSecureUser }