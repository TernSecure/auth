'use server'

import {
    TernServerAuth
} from "@tern-secure/auth";
import type { TernServerAuthOptions } from "@tern-secure/auth";

export async function TernSecureServer(opts: TernServerAuthOptions): Promise<TernServerAuth> {
    const serverAuth = TernServerAuth.initialize(opts);
    return serverAuth;
}

export type { TernServerAuthOptions, AuthenticatedApp } from "@tern-secure/auth";