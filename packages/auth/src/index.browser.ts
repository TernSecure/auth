import { TernSecureAuth } from './instance/ternsecure';
import { mountComponentRenderer } from './ui/Renderer';

//console.log('[Tern-UI index.browser.ts] Script loaded and executing.');

TernSecureAuth.mountComponentRenderer = mountComponentRenderer;


const apiKey = document.querySelector('[data-api-key]')?.getAttribute('data-api-key') || window.apiKey || '';
const apiUrl = document.querySelector('script[data-api-url]')?.getAttribute('data-api-url') || window.apiUrl || '';
const authDomain = document.querySelector('script[data-auth-domain]')?.getAttribute('data-auth-domain') || window.authDomain || '';
const proxyUrl = document.querySelector('[data-proxy-url]')?.getAttribute('data-proxy-url') || window.proxyUrl || '';


if (!window.TernSecure) {
  window.TernSecure = new TernSecureAuth(apiUrl, {
    proxyUrl,
    // @ts-expect-error
    authDomain
  });
}

if (module.hot) {
  module.hot.accept();
}