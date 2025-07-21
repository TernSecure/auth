'use server'

import {
    createSessionCookie, 
    clearSessionCookie, 
    SetNextServerSession, 
    SetNextServerToken
} from "@tern-secure/backend";
import { NextCookieStore } from "../../utils/NextCookieAdapter";

export async function createSessionCookieServer(idToken: string) {
    const cookieStore = new NextCookieStore();
    return createSessionCookie(idToken, cookieStore);
}

export async function clearSessionCookieServer() {
    const cookieStore = new NextCookieStore();
    return clearSessionCookie(cookieStore);
}

export async function setNextServerSession(idToken: string) {
    return SetNextServerSession(idToken);
}

export async function setNextServerToken(token: string) {
    return SetNextServerToken(token);
}