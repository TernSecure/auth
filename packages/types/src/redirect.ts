/**
 * @deprecated This will be removed in a future release.
 */
export type LegacyRedirectProps = {
  /**
   * @deprecated Use `fallbackRedirectUrl` or `forceRedirectUrl` instead.
   */
  afterSignInUrl?: string | null;
  /**
   * @deprecated Use `fallbackRedirectUrl` or `forceRedirectUrl` instead.
   */
  afterSignUpUrl?: string | null;
  /**
   * @deprecated Use `fallbackRedirectUrl` or `forceRedirectUrl` instead.
   */
  redirectUrl?: string | null;
};

export type RedirectOptions = SignInForceRedirectUrl &
  SignInFallbackRedirectUrl &
  SignUpForceRedirectUrl &
  SignUpFallbackRedirectUrl &
  LegacyRedirectProps;

export type RedirectUrlProp = {
  /**
   * Full URL or path to navigate to after a successful action.
   */
  redirectUrl?: string | null;
};

export type SignInForceRedirectUrl = {
  signInForceRedirectUrl?: string | null;
};

export type SignInFallbackRedirectUrl = {
  /**
   * The fallback URL to redirect to after the user signs in, if there's no `redirect_url` in the path already.
   * @default '/'
   */
  signInFallbackRedirectUrl?: string | null;
};

export type SignUpForceRedirectUrl = {
  signUpForceRedirectUrl?: string | null;
};

export type SignUpFallbackRedirectUrl = {
  /**
   * The fallback URL to redirect to after the user signs up, if there's no `redirect_url` in the path already.
   * @default '/'
   */
  signUpFallbackRedirectUrl?: string | null;
};

export type AfterSignOutUrl = {
  /**
   * Full URL or path to navigate to after successful sign out.
   */
  afterSignOutUrl?: string | null;
};
