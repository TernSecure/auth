import { camelToSnake } from '@tern-secure/shared/caseUtils'

import { joinPaths } from './path';
import { getQueryParams } from './querystring';

const DUMMY_URL_BASE = 'http://ternsecure-dummy';

export type constructUrlWithRedirectProps = {
  signInUrl: string;
  signInPathParam?: string;
  currentPath: string;
  signUpUrl?: string;
  signUpPathParam?: string;
};

interface BuildURLParams extends Partial<URL> {
  base?: string;
  hashPath?: string;
  hashSearch?: string;
  hashSearchParams?:
    | URLSearchParams
    | Record<string, string>
    | Array<URLSearchParams | Record<string, string>>;
}

interface BuildURLOptions<T> {
  skipOrigin?: boolean;
  stringify?: T;
}

/**
 *
 * buildURL(params: URLParams, options: BuildURLOptions): string
 *
 * Builds a URL safely by using the native URL() constructor. It can
 * also build a secondary path and search URL that lives inside the hash
 * of the main URL. For example:
 *
 * https://foo.com/bar?qux=42#/hash-bar?hash-qux=42
 *
 * References:
 * https://developer.mozilla.org/en-US/docs/Web/API/URL
 *
 * @param {BuildURLParams} params
 * @param {BuildURLOptions} options
 * @returns {URL | string} Returns the URL href
 */
export function buildURL<B extends boolean>(
  params: BuildURLParams,
  options?: BuildURLOptions<B>,
): B extends true ? string : URL;

/**
 * Builds a URL from given parameters, handling search and hash parameters
 * @param params - The parameters to construct the URL
 * @param options - Options for building the URL
 * @returns The constructed URL as a string or URL object
 */
export function buildURL(
  params: BuildURLParams,
  options: BuildURLOptions<boolean> = {},
): URL | string {
  const { base, hashPath, hashSearch, searchParams, hashSearchParams, ...rest } = params;
  const { stringify, skipOrigin } = options;

  let baseFallback = '';
  if (typeof window !== 'undefined' && !!window.location) {
    baseFallback = window.location.href;
  } else {
    baseFallback = 'http://react-native-fake-base-url';
  }

  const url = new URL(base || '', baseFallback);

  // Handle search parameters
  // params.searchParams comes from Partial<URL>, so it's URLSearchParams | undefined
  if (searchParams instanceof URLSearchParams) {
    searchParams.forEach((value, key) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, value); //camelToSnake(key), value
      }
    });
  }

  Object.assign(url, rest);

  // Handle hash-related parameters
  if (hashPath || hashSearch || hashSearchParams) {
    const dummyUrlForHash = new URL(DUMMY_URL_BASE + url.hash.substring(1));

    dummyUrlForHash.pathname = joinPaths(dummyUrlForHash.pathname, hashPath || '');

    const searchParamsFromHashSearchString = getQueryParams(hashSearch || '');

    for (const [key, val] of Object.entries(searchParamsFromHashSearchString)) {
      dummyUrlForHash.searchParams.append(key, val);
    }
    const finalHashPath = hashPath || '';
    const queryForHash = new URLSearchParams(hashSearch || '');

    if (hashSearchParams) {
      const paramsArr = Array.isArray(hashSearchParams) ? hashSearchParams : [hashSearchParams];
      for (const _params of paramsArr) {
        if (!(_params instanceof URLSearchParams) && typeof _params !== 'object') {
          continue;
        }
        const params = new URLSearchParams(_params);
        params.forEach((value, key) => {
          if (value !== null && value !== undefined) {
            dummyUrlForHash.searchParams.set(camelToSnake(key), value);
          }
        });
      }
    }

    const newHash = dummyUrlForHash.href.replace(DUMMY_URL_BASE, '');
    if (newHash !== '/') {
      // Assign them to the hash of the main url
      url.hash = newHash;
    }
  }

  if (stringify) {
    return skipOrigin ? url.href.replace(url.origin, '') : url.href;
  }
  return url;
}

/**
 * Constructs a full URL with the current origin
 * @param path - The path to construct the URL for
 * @returns The full URL with origin
 */
export const constructFullUrl = (path: string) => {
  if (typeof window === 'undefined') return path;
  const baseUrl = window.location.origin;
  if (path.startsWith('http')) {
    return path;
  }
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

/**
 * Checks if the current URL has a redirect loop
 * @param currentPath - The current pathname
 * @param redirectPath - The path we're trying to redirect to
 * @returns boolean indicating if there's a redirect loop
 */
export const hasRedirectLoop = (currentPath: string, redirectPath: string): boolean => {
  if (!currentPath || !redirectPath) return false;

  // Remove any query parameters for comparison
  const cleanCurrentPath = currentPath.split('?')[0];
  const cleanRedirectPath = redirectPath.split('?')[0];

  return cleanCurrentPath === cleanRedirectPath;
};

export const urlWithRedirect = (options: constructUrlWithRedirectProps): string => {
  const {
    signInUrl,
    signInPathParam = '/sign-in',
    currentPath,
    signUpUrl,
    signUpPathParam = '/sign-up',
  } = options;

  const baseUrl = window.location.origin;

  if (typeof window === 'undefined') {
    return signInUrl;
  }

  const url = new URL(signInUrl, baseUrl);

  if (!currentPath.includes(signInPathParam) && !currentPath.includes(signUpPathParam)) {
    url.searchParams.set('redirect', currentPath);
  }

  return url.toString();
};

/**
 * Stores the current path before signing out
 */
export const storePreviousPath = (path: string): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('previousPath', path);
  }
};

/**
 * Gets the stored previous path
 */
export const getPreviousPath = (): string | null => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('previousPath');
  }
  return null;
};

/**
 * Gets a validated redirect URL ensuring it's from the same origin
 * @param redirectUrl - The URL to validate
 * @param searchParams - The search parameters to check for redirect
 * @returns A validated redirect URL
 */
export const getValidRedirectUrl = (
  searchParams: URLSearchParams,
  configuredRedirect?: string,
): string => {
  // Check URL search param first (highest priority)
  const urlRedirect = searchParams.get('redirect');
  if (urlRedirect) {
    return validateUrl(urlRedirect);
  }

  // Then check configured redirect (for first visits)
  if (configuredRedirect) {
    return validateUrl(configuredRedirect);
  }

  // Default fallback
  return '/';
};

/**
 * Validates and sanitizes URLs
 */
const validateUrl = (url: string): string => {
  try {
    // For absolute URLs
    if (url.startsWith('http')) {
      const urlObj = new URL(url);
      if (typeof window !== 'undefined' && urlObj.origin !== window.location.origin) {
        return '/';
      }
    }

    // For relative URLs
    return '/';
  } catch {
    return '/';
  }
};

export function toURL(url: string | URL): URL {
  return new URL(url.toString(), window.location.origin);
}

/**
 *
 * stripOrigin(url: URL | string): string
 *
 * Strips the origin part of a URL and preserves path, search and hash is applicable
 *
 * References:
 * https://developer.mozilla.org/en-US/docs/Web/API/URL
 *
 * @param {URL | string} url
 * @returns {string} Returns the URL href without the origin
 */
export function stripOrigin(url: URL | string): string {
  url = toURL(url);
  return url.href.replace(url.origin, '');
}
