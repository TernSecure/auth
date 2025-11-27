'use client';

import { useTernSecure } from "@tern-secure/shared/react";
import { getToken } from 'firebase/app-check';
import { useCallback, useMemo } from 'react';

/**
 * Hook to access Firebase App Check instance and retrieve tokens
 * @returns Object containing appCheck instance and getToken method
 * @throws Error if TernSecure is not initialized or App Check is not configured
 */
const useAppCheck = () => {
    const ternSecure = useTernSecure();
    const appCheckInstance = ternSecure.appCheck;

    if (!appCheckInstance) {
        throw new Error('Firebase App Check not initialized in TernSecure instance');
    }

    const getAppCheckToken = useCallback(async (forceRefresh = false): Promise<string | undefined> => {
        try {
            const result = await getToken(appCheckInstance, forceRefresh);
            return result.token;
        } catch (error) {
            console.warn('Failed to get App Check token:', error);
            return undefined;
        }
    }, [appCheckInstance]);

    return useMemo(() => ({
        appCheck: appCheckInstance,
        getToken: getAppCheckToken,
    }), [appCheckInstance, getAppCheckToken]);
};



export { useAppCheck };