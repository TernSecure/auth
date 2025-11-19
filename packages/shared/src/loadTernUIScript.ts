import type { TernSecureAuthOptions, TernSecureSDK } from '@tern-secure/types';

import { loadScript } from './loadScript';
import { resolveVersion } from './resolveVersion';

const FAILED_TO_LOAD_ERROR = 'TernUI: Failed to load TernSecure';

export type LoadTernUISCriptOptions = TernSecureAuthOptions & {
  apiKey?: string;
  apiUrl?: string;
  authDomain?: string;
  frontEndDomain?: string;
  proxyUrl?: string;
  ternUIVersion?: string;
  sdkMetadata?: TernSecureSDK;
  scriptHost?: string;
  localPort?: string;
  nonce?: string;
};

export const loadTernUIScript = async (options?: LoadTernUISCriptOptions) => {
  const existingScript = document.querySelector<HTMLScriptElement>('script[data-ternui-script]');

  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => {
        resolve(existingScript);
      });

      existingScript.addEventListener('error', error => {
        reject(FAILED_TO_LOAD_ERROR);
      });
    });
  }

  if (!options?.authDomain) {
    throw new Error(
      'TernUI script requires a custom domain or proxy URL to be specified in options.',
    );
  }

  return loadScript(ternUIgetScriptUrl(options), {
    async: true,
    //crossOrigin: undefined,
    beforeLoad: applyLoadWithOptions(options),
  }).catch(() => {
    throw new Error('Failed to load TernUI script');
  });
};

export const ternUIgetScriptUrl = (options: LoadTernUISCriptOptions) => {
  const { ternUIVersion, isTernSecureDev } = options;
  const version = resolveVersion(ternUIVersion);

  if (isTernSecureDev) {
    const localHost = process.env.TERN_UI_HOST;
    const localPort = process.env.TERN_UI_PORT;
    const h = options.frontEndDomain;
    //return `http://${localHost}:${localPort}/ternsecure.browser.js`;
    return `${h}/ternsecure.browser.js`;
    //return `http://cdn.lifesprintcare.ca/dist/ternsecure.browser.js`
  }
  //return `https://cdn.lifesprintcare.ca/dist/ternsecure.browser.js`
  //return `https://cdn.jsdelivr.net/npm/@tern-secure/ui@${version}/dist/ternsecure.browser.js`;

  //const ternsecureCDN = options?.customDomain ||
  //(options?.proxyUrl && new URL(options.proxyUrl).host) || 'cdn.tern-secure.com';
  //return `${ternsecureCDN}/ternsecure.browser.js`;
  //return `https://${ternsecureCDN}/npm/@ternsecure/tern-ui@${version}/dist/ternsecure.browser.js`;
};

/**
 * @deprecated Use applyLoadWithOptions instead
 */
const beforeLoadWithOptions =
  (options?: LoadTernUISCriptOptions) => (script: HTMLScriptElement) => {
    const attributes = constructScriptAttributes(options);
    Object.entries(attributes).forEach(([key, value]) => {
      if (value) script.setAttribute(key, String(value));
    });
    console.log('[TernSecure-shared] Script attributes set:', attributes);
  };

/**
 * @deprecated Use constructTernUIScriptAttributes instead
 */
export const constructScriptAttributes = (options?: LoadTernUISCriptOptions) => {
  return {
    'data-auth-domain': options?.authDomain || '',
    'data-apikey': options?.apiKey || '',
    'data-api-url': options?.apiUrl || '',
    'data-proxy-url': options?.proxyUrl || '',
    ...(options?.nonce ? { nonce: options.nonce } : {}),
  };
};


const constructTernUIScriptAttributes = (options: LoadTernUISCriptOptions) => {
  const obj: Record<string, string> = {};

  if (options.authDomain) {
    obj['data-auth-domain'] = options.authDomain;
  }
  if (options.apiKey) {
    obj['data-apikey'] = options.apiKey;
  }
  if (options.apiUrl) {
    obj['data-api-url'] = options.apiUrl;
  }
  if (options.proxyUrl) {
    obj['data-proxy-url'] = options.proxyUrl;
  }

  if (options.nonce) {
    obj.nonce = options.nonce;
  }

  return obj;
}

const applyLoadWithOptions =
  (options: LoadTernUISCriptOptions) => (script: HTMLScriptElement) => {
    const attributes = constructTernUIScriptAttributes(options);
    for (const attribute in attributes) {
      script.setAttribute(attribute, attributes[attribute]);
    }
  };


export { constructTernUIScriptAttributes, applyLoadWithOptions };

