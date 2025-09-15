export type DomainOrProxyUrl =
  | {
      proxyUrl?: never;
      domain?: string | ((url: URL) => string);
    }
  | {
      proxyUrl?: string | ((url: URL) => string);
      domain?: never;
    };