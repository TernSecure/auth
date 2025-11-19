import { constructTernUIScriptAttributes, ternUIgetScriptUrl } from '@tern-secure/react';
import Script from 'next/script';

import { useTernNextOptions } from '../boundary/NextOptionsCtx';
import type { TernSecureNextProps } from '../types';

const isDevelopment = process.env.NODE_ENV === 'development';
const localPort = process.env.TERN_UI_PORT || '4000';

type TernUIScriptProps = Pick<TernSecureNextProps, 'authDomain' | 'proxyUrl'> & {
  nonce?: string;
  router: 'app' | 'pages';
};

const devDomain = isDevelopment
  ? `http://localhost:${localPort || process.env.NEXT_PUBLIC_TERN_UI_PORT || '4000'}`
  : undefined;

export function TernUIScript({ authDomain, proxyUrl, nonce, router = 'app' }: TernUIScriptProps) {
  const { ternUIVersion } = useTernNextOptions();
  const effectiveDomain = isDevelopment ? devDomain : authDomain;

  if (!effectiveDomain) {
    return null;
  }

  const scriptOptions = {
    domain: effectiveDomain,
    proxyUrl,
    ternUIVersion,
    nonce,
    router,
  };

  const scriptUrl = ternUIgetScriptUrl(scriptOptions);
  const scriptAttributes = constructTernUIScriptAttributes(scriptOptions);

  return (
    <Script
      src={scriptUrl}
      data-ternui-script
      async
      nonce={nonce}
      strategy={undefined}
      {...scriptAttributes}
      //crossOrigin= {undefined}
    />
  );
}
