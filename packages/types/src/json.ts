export interface TernSecureApiErrorJSON {
  code: string;
  message: string;
}

export interface TernSecureFireRestErrorJSON extends TernSecureApiErrorJSON {
  domain: string;
  reason: string;
}