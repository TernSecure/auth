export const BEFORE_UNLOAD_EVENT = 'ternsecure:beforeunload';

/**
 * Additional protocols can be provided using the `allowedRedirectProtocols` option.
 */
export const ALLOWED_PROTOCOLS = [
  'http:',
  'https:',
  // Refers to https://wails.io/
  'wails:',
  'chrome-extension:',
];

/**
 * Helper utility to navigate via window.location.href. Also dispatches a ternsecure:beforeunload custom event.
 *
 * Note that this utility should **never** be called with a user-provided URL. We make no specific checks against the contents of the URL here and assume it is safe.
 */
export function windowNavigate(to: URL | string): void {
  const toURL = new URL(to, window.location.href);
  window.dispatchEvent(new CustomEvent(BEFORE_UNLOAD_EVENT));
  window.location.href = toURL.href;
}
