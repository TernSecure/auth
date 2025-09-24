import { isValidBrowserOnline } from '@tern-secure/shared/browser';
import type { TernSecureApiErrorJSON } from '@tern-secure/types';

import type { ApiRequestInit, ApiResponse, ApiResponseJSON } from '../instance/coreApiClient';
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
};

export abstract class TernSecureBase {
  static ternsecure: TernSecureAuth;

  static get apiClient() {
    return TernSecureBase.ternsecure.getApiClient();
  }

  static get authCookieManager(): AuthCookieManager | undefined {
    return this.ternsecure.authCookieManager();
  }
  protected get authCookieManager(): AuthCookieManager | undefined {
    return TernSecureBase.authCookieManager;
  }

  /**
   * Core method to fetch data from API endpoints using coreApiClient
   * This method handles the complete request lifecycle including error handling
   */
  protected static async fetchFromCoreApi<J>(
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

  /**
   * Convenience method for making POST requests
   */
  static async basePost(params: PostMutateParams): Promise<ApiResponseJSON<any> | null> {
    return this.fetchFromCoreApi({ ...params, method: 'POST' });
  }

  /**
   * Instance method to fetch data from API endpoints
   */
  protected async fetchFromCoreApi(
    requestInit: ApiRequestInit,
  ): Promise<ApiResponseJSON<any> | null> {
    return TernSecureBase.fetchFromCoreApi(requestInit);
  }

  /**
   * Instance method for making POST requests
   */
  protected async basePost(params: PostMutateParams): Promise<ApiResponseJSON<any> | null> {
    return TernSecureBase.basePost(params);
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

  static async makeApiRequest(requestInit: ApiRequestInit): Promise<ApiResponseJSON<any> | null> {
    return this.fetchFromCoreApi(requestInit);
  }

  protected async makeApiRequest(
    requestInit: ApiRequestInit,
  ): Promise<ApiResponseJSON<any> | null> {
    return this.fetchFromCoreApi(requestInit);
  }

  private static shouldRethrowofflineNetworkError(): boolean {
    const experimental = TernSecureBase.ternsecure?._internal_getOption?.('experimental');
    return experimental?.rethrowOfflineNetworkErrors || false;
  }
}
