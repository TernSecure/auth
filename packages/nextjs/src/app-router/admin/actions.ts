'use server'

import {
    CreateNextSessionCookie,
    createSessionCookie, 
    clearSessionCookie, 
    SetNextServerSession, 
    SetNextServerToken,
    ClearNextSessionCookie,
} from "@tern-secure/backend/admin";
import { NextCookieStore } from "../../utils/NextCookieAdapter";
import { TENANT_ID } from "./constants";

export async function createSessionCookieServer(idToken: string) {
    const cookieStore = new NextCookieStore();
    return createSessionCookie(idToken, cookieStore);
}

export async function clearSessionCookieServer() {
    const cookieStore = new NextCookieStore();
    return clearSessionCookie(cookieStore);
}

export async function clearNextSessionCookie() {
    return ClearNextSessionCookie(TENANT_ID);
}

export async function setNextServerSession(idToken: string) {
    return SetNextServerSession(idToken);
}

export async function setNextServerToken(token: string) {
    return SetNextServerToken(token);
}

export async function createNextSessionCookie(idToken: string) {
    return CreateNextSessionCookie(idToken);
}