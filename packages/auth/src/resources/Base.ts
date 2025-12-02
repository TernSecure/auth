import { isValidBrowserOnline } from '@tern-secure/shared/browser';
import type { TernSecureApiErrorJSON, TernSecureResourceJSON } from '@tern-secure/types';

import type { ApiRequestInit, ApiResponse, ApiResponseJSON } from '../instance/coreApiClient';
import { FraudProtection } from '../instance/fraudProtection';
//import { coreApiClient} from '../instance/coreApiClient';
import { TernSecureAPIResponseError, TernSecureRuntimeError } from './Error';
import type { AuthCookieManager, TernSecureAuth } from './internal';

export type HTTPMethod =
  | 'CONNECT'
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'OPTIONS'
  | 'PATCH'
  | 'POST'
  | 'PUT'
  | 'TRACE';

export type PostMutateParams = {
  action?: string | undefined;
  body?: any;
  method?: HTTPMethod | undefined;
  path?: string;
  search?: ConstructorParameters<typeof URLSearchParams>[0];
};


export type BaseMutateParams = {
  action?: string;
  body?: any;
  method?: HTTPMethod;
  path?: string;
};


export abstract class TernSecureBase {
  static ternsecure: TernSecureAuth;
  id?: string;
  pathRoot = '';

  static get apiClient() {
    return TernSecureBase.ternsecure.getApiClient();
  }

  static get authCookieManager(): AuthCookieManager | undefined {
    return this.ternsecure.authCookieManager();
  }
  protected get authCookieManager(): AuthCookieManager | undefined {
    return TernSecureBase.authCookieManager;
  }

  public isNew(): boolean {
    return !this.id;
  }

  static async _fetch<J extends TernSecureResourceJSON | null>(
    requestInit: ApiRequestInit,
  ): Promise<ApiResponseJSON<J> | null> {
    return FraudProtection.getInstance().execute(this.ternsecure, token => {
      const newRequestInit = { ...requestInit };
      if (token) {
        newRequestInit.headers = new Headers(newRequestInit.headers);
        newRequestInit.headers.set('x-ternsecure-appcheck', token);
      }
      
      return this._baseFetch<J>(newRequestInit);
    });
  }

  /**
   * Core method to fetch data from API endpoints using coreApiClient
   * This method handles the complete request lifecycle including error handling
   */
  protected static async _baseFetch<J extends TernSecureResourceJSON | null>(
    requestInit: ApiRequestInit,
  ): Promise<ApiResponseJSON<J> | null> {
    let apiResponse: ApiResponse<J>;
    try {
      apiResponse = await TernSecureBase.apiClient.request<J>(requestInit, { timeoutMs: 10000 });
    } catch (error) {
      if (this.shouldRethrowofflineNetworkError()) {
        throw new TernSecureRuntimeError((error as Error)?.message || String(error), {
          code: 'OFFLINE_NETWORK_ERROR',
        });
      } else if (!isValidBrowserOnline()) {
        console.warn(error);
        return null;
      } else {
        throw error;
      }
    }

    const { payload, status, statusText, headers } = apiResponse;

    if (headers) {
      const country = headers.get('x-country');
      this.ternsecure.__internal_setCountry(country ? country.toLowerCase() : null);
    }

    if (status >= 200 && status <= 299) {
      return payload;
    }

    if (status >= 400) {
      const errors = payload?.errors as TernSecureApiErrorJSON[];
      const message = errors?.[0]?.message;

      const apiResponseOptions: ConstructorParameters<typeof TernSecureAPIResponseError>[1] = {
        data: errors,
        status,
      };
      if (status === 429 && headers) {
        const retryAfter = headers.get('retry-After');
        if (retryAfter) {
          const value = parseInt(retryAfter, 10);
          if (!isNaN(value)) {
            apiResponseOptions.retryAfter = value;
          }
        }
      }

      throw new TernSecureAPIResponseError(message || statusText, apiResponseOptions);
    }

    return null;
  }


  protected path(action?: string): string {
    const base = this.pathRoot;

    if (this.isNew()) {
      return base;
    }
    const baseWithId = base.replace(/[^/]$/, '$&/') + encodeURIComponent(this.id as string);

    if (!action) {
      return baseWithId;
    }

    return baseWithId.replace(/[^/]$/, '$&/') + encodeURIComponent(action);
  }

  protected abstract fromJSON(data: TernSecureResourceJSON | null): this;

  /**
   * Convenience method for making POST requests
   */
  static async basePost(params: PostMutateParams): Promise<ApiResponseJSON<any> | null> {
    return this._fetch({ ...params, method: 'POST' });
  }

  /**
   * Instance method to fetch data from API endpoints
   */
  protected async _fetch<J extends TernSecureResourceJSON>(
    requestInit: ApiRequestInit,
  ): Promise<ApiResponseJSON<any> | null> {
    return TernSecureBase._fetch(requestInit);
  }

  /**
   * Instance method for making POST requests
   */
  protected async basePost(params: PostMutateParams): Promise<ApiResponseJSON<any> | null> {
    return TernSecureBase.basePost(params);
  }

  protected async _baseMutate<J extends TernSecureResourceJSON>(params: BaseMutateParams = {}): Promise<this> {
    const { action, body, method, path } = params;
    const json = await TernSecureBase._fetch<J>({ method, path: path || this.path(action), body });
    return this.fromJSON((json?.response || json) as J);
  }

  /**
   * Instance method to make GET requests
   * This is a convenience method that sets the HTTP method to GET
   */
  protected async baseGet(params: Omit<PostMutateParams, 'method'>): Promise<ApiResponseJSON<any> | null> {
    return this._fetch({ ...params, method: 'GET' });
  }

  /**
   * Protected instance method for making POST requests with specific path and body
   * This is designed to be used by child classes like SignIn
   */
  protected async _post(params: PostMutateParams): Promise<ApiResponseJSON<any> | null> {
    return this.basePost({
      path: params.path,
      body: params.body,
    });
  }

  protected async _basePost<J extends TernSecureResourceJSON>(params: BaseMutateParams = {}): Promise<this> {
    return this._baseMutate<J>({ ...params, method: 'POST' });
  }

  static async makeApiRequest(requestInit: ApiRequestInit): Promise<ApiResponseJSON<any> | null> {
    return this._fetch(requestInit);
  }

  protected async makeApiRequest(
    requestInit: ApiRequestInit,
  ): Promise<ApiResponseJSON<any> | null> {
    return this._fetch(requestInit);
  }

  private static shouldRethrowofflineNetworkError(): boolean {
    const experimental = TernSecureBase.ternsecure?._internal_getOption?.('experimental');
    return experimental?.rethrowOfflineNetworkErrors || false;
  }
}
