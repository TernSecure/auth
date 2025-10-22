import { camelToSnake } from '@tern-secure/shared/caseUtils';
import { applyFunctionToObj, filterProps, removeUndefined } from '@tern-secure/shared/object';
import type { RedirectOptions, TernSecureAuthOptions } from '@tern-secure/types';

import { isAllowedRedirect, relativeToAbsoluteUrl } from './construct';

/**
 * RedirectUrls class handles all redirect URL construction logic
 * for sign-in, sign-up, and post-authentication flows.
 *
 * This class centralizes the redirect logic previously scattered across
 * multiple methods, making it reusable and maintainable.
 */
export class RedirectUrls {
  private static keys: (keyof RedirectOptions)[] = [
    'signInForceRedirectUrl',
    'signInFallbackRedirectUrl',
    'signUpForceRedirectUrl',
    'signUpFallbackRedirectUrl',
    'afterSignInUrl',
    'afterSignUpUrl',
    'redirectUrl',
  ];

  private static preserved = ['redirectUrl'];

  private readonly options: TernSecureAuthOptions;
  private readonly fromOptions: RedirectOptions;
  private readonly fromProps: RedirectOptions;
  private readonly fromSearchParams: RedirectOptions & { redirectUrl?: string | null };

  constructor(options: TernSecureAuthOptions, props: RedirectOptions = {}, searchParams: any = {}) {
    this.options = options;
    this.fromOptions = this.#parse(options || {});
    this.fromProps = this.#parse(props || {});
    this.fromSearchParams = this.#parseSearchParams(searchParams || {});
  }

  getAfterSignInUrl() {
    return this.#getRedirectUrl('signIn');
  }

  getAfterSignUpUrl() {
    return this.#getRedirectUrl('signUp');
  }

  getPreservedSearchParams() {
    return this.#toSearchParams(this.#flattenPreserved());
  }

  toSearchParams() {
    return this.#toSearchParams(this.#flattenAll());
  }

  #toSearchParams(obj: Record<string, string | undefined | null>): URLSearchParams {
    const camelCased = Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [camelToSnake(key), value]),
    );
    return new URLSearchParams(removeUndefined(camelCased) as Record<string, string>);
  }

  #flattenPreserved() {
    return Object.fromEntries(
      Object.entries({ ...this.fromSearchParams }).filter(([key]) =>
        RedirectUrls.preserved.includes(key),
      ),
    );
  }

  #flattenAll() {
    const signUpForceRedirectUrl =
      this.fromSearchParams.signUpForceRedirectUrl ||
      this.fromProps.signUpForceRedirectUrl ||
      this.fromOptions.signUpForceRedirectUrl;
    const signUpFallbackRedirectUrl =
      this.fromSearchParams.signUpFallbackRedirectUrl ||
      this.fromProps.signUpFallbackRedirectUrl ||
      this.fromOptions.signUpFallbackRedirectUrl;
    const signInForceRedirectUrl =
      this.fromSearchParams.signInForceRedirectUrl ||
      this.fromProps.signInForceRedirectUrl ||
      this.fromOptions.signInForceRedirectUrl;
    const signInFallbackRedirectUrl =
      this.fromSearchParams.signInFallbackRedirectUrl ||
      this.fromProps.signInFallbackRedirectUrl ||
      this.fromOptions.signInFallbackRedirectUrl;
    const afterSignInUrl =
      this.fromSearchParams.afterSignInUrl ||
      this.fromProps.afterSignInUrl ||
      this.fromOptions.afterSignInUrl;
    const afterSignUpUrl =
      this.fromSearchParams.afterSignUpUrl ||
      this.fromProps.afterSignUpUrl ||
      this.fromOptions.afterSignUpUrl;
    const redirectUrl =
      this.fromSearchParams.redirectUrl ||
      this.fromProps.redirectUrl ||
      this.fromOptions.redirectUrl;

    const res: RedirectOptions = {
      signUpForceRedirectUrl,
      signUpFallbackRedirectUrl,
      signInForceRedirectUrl,
      signInFallbackRedirectUrl,
      afterSignInUrl,
      afterSignUpUrl,
      redirectUrl,
    };
    return res;
  }

  #getRedirectUrl(prefix: 'signIn' | 'signUp') {
    const forceKey = `${prefix}ForceRedirectUrl` as const;
    const fallbackKey = `${prefix}FallbackRedirectUrl` as const;

    let newKeyInUse: string | undefined;

    let result;
    // Prioritize forceRedirectUrl
    result =
      this.fromSearchParams[forceKey] || this.fromProps[forceKey] || this.fromOptions[forceKey];
    if (result) {
      newKeyInUse = forceKey;
    }

    // Try to get redirect_url, only allowed as a search param
    result ||= this.fromSearchParams.redirectUrl;
    if (result) {
      newKeyInUse = 'redirectUrl';
    }

    // Otherwise, fallback to fallbackRedirectUrl
    result ||=
      this.fromSearchParams[fallbackKey] ||
      this.fromProps[fallbackKey] ||
      this.fromOptions[fallbackKey];
    if (result) {
      newKeyInUse = fallbackKey;
    }

    if (!result) {
      if (typeof window === 'undefined') {
        return '/';
      }
      return window.location.href;
    }
    return result || '/';
  }

  #parse(obj: unknown) {
    const res = {} as RedirectOptions;
    RedirectUrls.keys.forEach(key => {
      // @ts-expect-error
      res[key] = obj[key];
    });

    //const absoluteUrls = this.#toAbsoluteUrls(filterProps(res, Boolean));
    //const filtered = this.#filterRedirects(absoluteUrls);
    //return applyFunctionToObj(filtered, val => val.toString());

    return applyFunctionToObj(
      this.#filterRedirects(this.#toAbsoluteUrls(filterProps(res, Boolean))),
      val => val.toString(),
    );
  }

  #parseSearchParams(obj: any) {
    const res = {} as typeof this.fromSearchParams;
    RedirectUrls.keys.forEach(key => {
      if (obj instanceof URLSearchParams) {
        res[key] = obj.get(camelToSnake(key));
      } else {
        res[key] = obj[camelToSnake(key)];
      }
    });

    return applyFunctionToObj(
      this.#filterRedirects(this.#toAbsoluteUrls(filterProps(res, Boolean))),
      val => val.toString(),
    );
  }

  #toAbsoluteUrls(obj: RedirectOptions) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return applyFunctionToObj(obj, (url: string) => relativeToAbsoluteUrl(url, origin));
  }

  #filterRedirects = (obj: RedirectOptions) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return filterProps(obj, isAllowedRedirect(this.options?.allowedRedirectOrigins, origin));
  };
}
