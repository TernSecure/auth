import type { TernSecureAuth, AuthCookieManager } from './internal';
import { coreApiClient } from '../instance/coreApiClient';
import type { ApiRequestInit, ApiResponse, ApiResponseJSON } from '../instance/coreApiClient';
import type { TernSecureApiErrorJSON } from '@tern-secure/types';
import { isValidBrowserOnline } from '@tern-secure/shared/browser';
import { TernSecureAPIResponseError } from './Error';

export type HTTPMethod = 'CONNECT' | 'DELETE' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT' | 'TRACE';

export type PostMutateParams = {
  action?: string | undefined;
  body?: any;
  method?: HTTPMethod | undefined;
  path?: string;
};

export abstract class TernSecureBase {
  static ternsecure: TernSecureAuth;

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
  static async fetchFromCoreApi(requestInit: ApiRequestInit): Promise<ApiResponseJSON<any> | null> {
    if (!this.ternsecure?.apiUrl) {
      throw new Error('API URL is not defined. Make sure TernSecureAuth is properly initialized.');
    }

    const apiUrl = this.ternsecure.apiUrl;

    let apiResponse: ApiResponse<any>;
    try {
      apiResponse = await coreApiClient.request(requestInit, { apiUrl });
    } catch (error) {
      if (!isValidBrowserOnline()) {
        console.warn(error);
        return null;
      }
      throw error;
    }

    const { payload, status, statusText, headers } = apiResponse;

    if (headers) {
      const country = headers.get('x-country');
      console.log('Request country:', country);
    }

    if (status >= 200 && status <= 299) {
      return payload;
    }

    if (status >= 400) {
      const errors = payload?.errors as TernSecureApiErrorJSON[];
      const message = errors?.[0]?.message;

      const apiResponseOptions: ConstructorParameters<typeof TernSecureAPIResponseError>[1] = { data: errors, status };
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
  protected async fetchFromCoreApi(requestInit: ApiRequestInit): Promise<ApiResponseJSON<any> | null> {
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
  protected async _post(params: { path: string; body?: any }): Promise<ApiResponseJSON<any> | null> {
    return this.basePost({
      path: params.path,
      body: params.body,
      method: 'POST',
    });
  }

  // Legacy method names for backward compatibility
  static async makeApiRequest(requestInit: ApiRequestInit): Promise<ApiResponseJSON<any> | null> {
    return this.fetchFromCoreApi(requestInit);
  }

  protected async makeApiRequest(requestInit: ApiRequestInit): Promise<ApiResponseJSON<any> | null> {
    return this.fetchFromCoreApi(requestInit);
  }
}
