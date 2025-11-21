import { getAuthForTenant } from '../utils/admin-init';

export function RetrieveUser() {
    const auth = getAuthForTenant();

    async function getUserUid(uid: string) {
        return auth.getUser(uid);
    }
    async function getUserByEmail(email: string) {
        return auth.getUserByEmail(email);
    }

    return {
        getUserUid,
        getUserByEmail,
    }
}