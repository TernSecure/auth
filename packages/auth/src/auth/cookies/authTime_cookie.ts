import { cookieHandler } from '@tern-secure/shared/cookie';
import { addYears } from '@tern-secure/shared/date';

const TERN_AUT = 'tern_aut';

export type TernAUTCookie = {
    get: () => number;
    set: (aut: number) => void;
    initialize: () => void;
}

export const createTernAUT = (): TernAUTCookie => {
    const ternAutCookie = cookieHandler(TERN_AUT);

    const get = (): number => {
        const value = ternAutCookie.get();
        return value ? parseInt(value, 10) : 0;
    }

    const set = (uat: number): void => {
        const expires = addYears(Date.now(), 1);

        if (!Number.isInteger(uat) || uat < 0) {
            console.warn('[tern_aut] Invalid auth_time value provided:', uat);
            return;
        }

        // Get current value to check if we should update
        const currentValue = get();

        // If trying to set 0 but cookie already has a non-zero value, don't overwrite
        // This prevents client from resetting server-set auth_time
        if (uat === 0 && currentValue > 0) {
            return;
        }

        ternAutCookie.set(uat.toString(), { secure: true, expires });
    }

    const initialize = (): void => {
        const currentValue = ternAutCookie.get();
        if (currentValue === undefined || currentValue === null) {
            const expires = addYears(Date.now(), 1);
            ternAutCookie.set('0', { secure: true, expires });
        }
    }

    return {
        get,
        set,
        initialize,
    };
}