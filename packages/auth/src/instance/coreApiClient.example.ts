/**
 * Example usage of CoreApiClient
 */

import { CoreApiClient, coreApiClient } from './coreApiClient';

// Example 1: Basic usage with default instance
async function basicExample() {
  try {
    const response = await coreApiClient.request<{ users: any[] }>({
      path: '/users',
      method: 'GET',
      //search: { limit: 10, offset: 0 }
    }, {
      apiUrl: 'https://api.example.com',
      timeoutMs: 5000
    });

    console.log('Users:', response.payload?.response.users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
  }
}

// Example 2: Custom client with hooks
async function clientWithHooksExample() {
  const client = new CoreApiClient({
    apiUrl: 'https://api.example.com',
    timeoutMs: 10000,
    failureThreshold: 3,
    maxTries: 5
  });

  // Add authentication hook
  client.onBeforeRequest(() => {
    const token = localStorage.getItem('auth_token');
    return !!token; // Only proceed if token exists
  });

  // Add logging hook
  client.onAfterResponse((response) => {
    console.log(`Response: ${response.status}`);
    return true;
  });

  try {
    const response = await client.request({
      path: '/protected-resource',
      method: 'GET',
      sessionId: 'user-session-123'
    });

    console.log('Protected data:', response.payload?.response);
  } catch (error) {
    console.error('Request failed:', error);
  }
}

// Example 3: POST request with form data
async function postExample() {
  try {
    const response = await coreApiClient.request({
      path: '/users',
      method: 'POST',
      body: {
        firstName: 'John',
        lastName: 'Doe',
        emailAddress: 'john.doe@example.com'
      } as any // Cast to any since our implementation handles object-to-form conversion
    }, {
      apiUrl: 'https://api.example.com'
    });

    console.log('Created user:', response.payload?.response);
  } catch (error) {
    console.error('Failed to create user:', error);
  }
}

export { basicExample, clientWithHooksExample, postExample };
