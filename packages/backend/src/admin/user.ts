import { handleFirebaseAuthError } from '@tern-secure/shared/errors';
import type { AuthErrorResponse } from '@tern-secure/types';
import type { UserRecord } from 'firebase-admin/auth';

import { getAuthForTenant } from '../utils/admin-init';

type RetrieveUserResult = {
    data: UserRecord;
    error: null;
} | {
    data: null;
    error: AuthErrorResponse;
}

export function RetrieveUser(tenantId?: string) {
    const auth = getAuthForTenant(tenantId);

    async function getUserUid(uid: string): Promise<RetrieveUserResult> {
        try {
            const user = await auth.getUser(uid);
            return { data: user, error: null };
        } catch (error) {
            return { data: null, error: handleFirebaseAuthError(error) };
        }
    }
    async function getUserByEmail(email: string): Promise<RetrieveUserResult> {
        try {
            const user = await auth.getUserByEmail(email);
            return { data: user, error: null };
        } catch (error) {
            return { data: null, error: handleFirebaseAuthError(error) };
        }
    }

    async function getUserByPhoneNumber(phoneNumber: string): Promise<RetrieveUserResult> {
        try {
            const user = await auth.getUserByPhoneNumber(phoneNumber);
            return { data: user, error: null };
        } catch (error) {
            return { data: null, error: handleFirebaseAuthError(error) };
        }
    }

    return {
        getUserUid,
        getUserByEmail,
        getUserByPhoneNumber,
    }
}