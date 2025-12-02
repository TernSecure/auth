export interface AppCheckTokenOptions {
    ttlMillis?: number;
}


export interface AppCheckToken {
    token: string;
    ttl: string;
}

export type AppCheckParams = {
    accessToken?: string;
    projectId: string;
    appId: string;
    customToken: string;
    limitedUse?: boolean;
}


export interface VerifyOptions {
    currentDate?: Date;
    checkRevoked?: boolean;
    referer?: string;
    experimental_enableTokenRefreshOnExpiredKidHeader?: boolean;
}