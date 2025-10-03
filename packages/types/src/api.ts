export interface TernSecureAPIError {
  code: string;
  message: string;
}

export interface TernSecureFireRestError extends TernSecureAPIError {
  domain: string;
  reason: string;
}