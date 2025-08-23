import type { TernSecureAuth, AuthCookieManager } from "./internal";

export abstract class TernSecureBase {
  static ternsecure: TernSecureAuth;

  static get authCookieManager(): AuthCookieManager | undefined {
    return this.ternsecure.authCookieManager();
  }
  protected get authCookieManager(): AuthCookieManager | undefined {
    return TernSecureBase.authCookieManager;
  }
}