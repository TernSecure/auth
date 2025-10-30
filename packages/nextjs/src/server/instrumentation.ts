/**
 * Patches global.fetch to add Referer header for Firebase Identity Toolkit requests.
 * This is required for Firebase Auth to work properly on the server side.
 * 
 * @param appUrl - Optional URL of your application. If not provided, uses NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN env variable.
 *                 You must provide either the parameter or set the environment variable.
 * 
 * @throws {Error} If no appUrl is provided and NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is not set.
 * 
 * @example
 * ```typescript
 * // In your app's instrumentation.ts
 * import { ternSecureInstrumentation } from '@tern-secure/nextjs/server';
 * 
 * export async function register() {
 *   if (process.env.NEXT_RUNTIME === 'nodejs') {
 *     // Option 1: Use environment variable
 *     ternSecureInstrumentation();
 *     
 *     // Option 2: Provide URL explicitly
 *     ternSecureInstrumentation('http://localhost:3000');
 *   }
 * }
 * ```
 */
export function ternSecureInstrumentation(appUrl?: string): void {
    const resolvedAppUrl = appUrl || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;

    if (!resolvedAppUrl) {
        throw new Error(
            'ternSecureInstrumentation: appUrl must be provided either as a parameter or via NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN environment variable.'
        );
    }

    const originalFetch = global.fetch;

    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url =
            typeof input === "string"
                ? input
                : input instanceof URL
                    ? input.href
                    : input.url;
        const urlObj = new URL(url);

        if (urlObj.hostname === "identitytoolkit.googleapis.com") {
            const modifiedInit = {
                ...init,
                headers: {
                    ...(init?.headers || {}),
                    Referer: resolvedAppUrl,
                },
            };
            return originalFetch(input, modifiedInit);
        }
        return originalFetch(input, init);
    };
}