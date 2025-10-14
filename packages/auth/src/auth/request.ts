import type { TernSecureUserData } from '@tern-secure/types';

import type { ApiClient } from '../instance/c_coreApiClient';

export interface UserDataParams {
  idToken: string;
}

/**
 * Client-side authentication request functionality
 * Uses backend API calls through the configured apiUrl
 */
export class ClientAuthRequest {
  constructor(private apiClient: ApiClient) {}

  /**
   * Get user data using the lookup endpoint via backend API
   */
  async getUserData(): Promise<TernSecureUserData | null> {
    try {
      const response = await this.apiClient.request<TernSecureUserData>({
        path: 'lookup',
        method: 'POST',
      });

      if (response.payload?.response) {
        return response.payload.response;
      }

      return null;
    } catch (error) {
      console.error('[ClientAuthRequest] Backend API call failed:', error);
      throw error;
    }
  }
}

/**
 * Create a client authentication request instance
 */
export function createClientAuthRequest(apiClient: ApiClient): ClientAuthRequest {
  return new ClientAuthRequest(apiClient);
}