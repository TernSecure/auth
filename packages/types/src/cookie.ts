export interface CookieStore {
  get(name: string): Promise<{ value: string | undefined }>;
  set(name: string, value: string, options: CookieOptions): Promise<void>;
  delete(name: string): Promise<void>;
}

export interface CookieOptions {
  httpOnly?: boolean | undefined;
  path?: string | undefined;
  partitioned?: boolean | undefined;
  maxAge?: number | undefined;
  expires?: Date | undefined;
  priority?: 'low' | 'medium' | 'high' | undefined;
  sameSite?: 'strict' | 'lax' | 'none' | undefined;
  secure?: boolean | undefined;
}


export interface CookieResource {
  idToken?: string;
  sessionToken?: string;
  refreshToken?: string;
  customToken?: string;
}
