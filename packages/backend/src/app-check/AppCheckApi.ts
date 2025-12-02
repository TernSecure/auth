import type { Credential } from '../auth'
import type { AppCheckParams, AppCheckToken } from './types'

export function getSdkVersion(): string {
    return '12.7.0';
}

const FIREBASE_APP_CHECK_CONFIG_HEADERS = {
    'X-Firebase-Client': `fire-admin-node/${getSdkVersion()}`
};

/**
 * App Check API for managing Firebase App Check tokens via REST
 * Firebase REST API endpoint: https://firebaseappcheck.googleapis.com/v1beta/projects/{projectId}/apps/{appId}:exchangeCustomToken
 */
export class AppCheckApi {
    constructor(private credential: Credential) { }

    public async exchangeToken(params: AppCheckParams): Promise<AppCheckToken> {
        const { projectId, appId, customToken, limitedUse = false } = params;
        const token = await this.credential.getAccessToken(false);
        if (!projectId || !appId) {
            throw new Error('Project ID and App ID are required for App Check token exchange');
        }

        const endpoint = `https://firebaseappcheck.googleapis.com/v1/projects/${projectId}/apps/${appId}:exchangeCustomToken`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.accessToken}`,
        };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({ customToken, limitedUse }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`App Check token exchange failed: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            return {
                token: data.token,
                ttl: data.ttl,
            };
        } catch (error) {
            console.warn('[ternsecure - appcheck api]unexpected error:', error);
            throw error;
        }
    }
    public async exchangeDebugToken(params: AppCheckParams): Promise<AppCheckToken> {
        const { projectId, appId, customToken, accessToken, limitedUse = false } = params;
        if (!projectId || !appId) {
            throw new Error('Project ID and App ID are required for App Check token exchange');
        }

        const endpoint = `https://firebaseappcheck.googleapis.com/v1beta/projects/${projectId}/apps/${appId}:exchangeDebugToken`;

        const headers: Record<string, string> = {
            ...FIREBASE_APP_CHECK_CONFIG_HEADERS,
            'Authorization': `Bearer ${accessToken}`,
        };

        const body = {
            customToken,
            limitedUse,
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`App Check token exchange failed: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            return {
                token: data.token,
                ttl: data.ttl,
            };
        } catch (error) {
            console.warn('[ternsecure - appcheck api]unexpected error:', error);
            throw error;
        }
    }
}
