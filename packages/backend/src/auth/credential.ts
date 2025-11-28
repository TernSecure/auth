import type { JWTPayload } from '@tern-secure/types';

import {
    GOOGLE_AUTH_TOKEN_HOST,
    GOOGLE_AUTH_TOKEN_PATH,
    GOOGLE_TOKEN_AUDIENCE,
    ONE_HOUR_IN_SECONDS,
    TOKEN_EXPIRY_THRESHOLD_MILLIS
} from '../constants'
import { ternSignJwt } from '../jwt';
import { fetchJson } from '../utils/fetcher';


export interface GoogleOAuthAccessToken {
    access_token: string;
    expires_in: number;
}

export interface ServiceAccount {
    projectId: string;
    privateKey: string;
    clientEmail: string;
}

export interface FirebaseAccessToken {
    accessToken: string;
    expirationTime: number;
}

const accessTokenCache: Map<string, FirebaseAccessToken> = new Map();

export interface ServiceAccountCredential {
    getAccessToken: (refresh?: boolean) => Promise<FirebaseAccessToken>;
}

async function requestAccessToken(urlString: string, init: RequestInit): Promise<FirebaseAccessToken> {
    const json = await fetchJson(urlString, init);

    if (!json.access_token || !json.expires_in) {
        throw new Error('Invalid access token response');
    }

    return {
        accessToken: json.access_token,
        expirationTime: Date.now() + (json.expires_in * 1000),
    }
}

export class ServiceAccountTokenManager implements ServiceAccountCredential {
    private readonly projectId: string;
    private readonly privateKey: string;
    private readonly clientEmail: string;

    constructor(serviceAccount: ServiceAccount) {
        this.projectId = serviceAccount.projectId;
        this.privateKey = serviceAccount.privateKey;
        this.clientEmail = serviceAccount.clientEmail;
    }

    private fetchAccessToken = async (url: string): Promise<FirebaseAccessToken> => {
        const token = await this.createJwt();
        const postData =
            'grant_type=urn%3Aietf%3Aparams%3Aoauth%3A' +
            'grant-type%3Ajwt-bearer&assertion=' +
            token;

        return requestAccessToken(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
            body: postData,
        })
    }

    private fetchAndCacheAccessToken = async (url: string): Promise<FirebaseAccessToken> => {
        const accessToken = await this.fetchAccessToken(url);
        accessTokenCache.set(this.projectId, accessToken);
        return accessToken;
    }

    public getAccessToken = async (refresh?: boolean): Promise<FirebaseAccessToken> => {
        const url = `https://${GOOGLE_AUTH_TOKEN_HOST}${GOOGLE_AUTH_TOKEN_PATH}`;

        if (refresh) {
            return this.fetchAndCacheAccessToken(url);
        }

        const cachedResponse = accessTokenCache.get(this.projectId);

        if (!cachedResponse || cachedResponse.expirationTime - Date.now() <= TOKEN_EXPIRY_THRESHOLD_MILLIS) {
            return this.fetchAndCacheAccessToken(url);
        }

        return cachedResponse;
    }

    private createJwt = async (): Promise<string> => {
        const iat = Math.floor(Date.now() / 1000);

        const payload = {
            aud: GOOGLE_TOKEN_AUDIENCE,
            iat,
            exp: iat + ONE_HOUR_IN_SECONDS,
            iss: this.clientEmail,
            sub: this.clientEmail,
            scope: [
                'https://www.googleapis.com/auth/cloud-platform',
                'https://www.googleapis.com/auth/firebase.database',
                'https://www.googleapis.com/auth/firebase.messaging',
                'https://www.googleapis.com/auth/identitytoolkit',
                'https://www.googleapis.com/auth/userinfo.email'
            ].join(' ')
        } as JWTPayload;

        return ternSignJwt({
            payload,
            privateKey: this.privateKey,
        });
    }
}
