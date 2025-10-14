import { TernSecureBase } from './Base';

export class UserData extends TernSecureBase {
  pathRoot = '/accounts/lookup';

  private idToken: string | undefined;

  constructor(idToken?: string) {
    super();
    this.idToken = idToken;
  }

  get = async () => {
    return this._post({
      path: this.pathRoot,
      method: 'POST',
    });
  }
}
