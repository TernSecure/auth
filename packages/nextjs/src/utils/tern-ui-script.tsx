import { constructScriptAttributes, ternUIgetScriptUrl } from '@tern-secure/react'
import Script from 'next/script'

import { useTernNextOptions } from '../boundary/NextOptionsCtx';
import type { TernSecureNextProps } from '../types'

const isDevelopment = process.env.NODE_ENV === 'development';
const localPort = process.env.TERN_UI_PORT || '4000';

type TernUIScriptProps = Pick<TernSecureNextProps, 'domain' | 'proxyUrl'> & {
    nonce?: string;
    router: 'app' | 'pages';
}

const devDomain = isDevelopment 
    ? `http://localhost:${localPort || process.env.NEXT_PUBLIC_TERN_UI_PORT || '4000'}`
    : undefined


export function TernUIScript({
    domain,
    proxyUrl,
    nonce,
    router = 'app'
}: TernUIScriptProps) {
    const { ternUIVersion} = useTernNextOptions();
    console.log('[TernSecure] TernUIScript: Props - domain:', domain, 'proxyUrl:', proxyUrl, 'ternUIVersion:', ternUIVersion);
    const effectiveDomain = isDevelopment ? devDomain : domain
    console.log('[TernSecure] TernUIScript: Using effective domain:', effectiveDomain);

    if (!effectiveDomain) {
        console.warn('[TernSecure] TernUIScript: No custom domain or proxy URL provided. The script will not be loaded.');
        return null;
    }

    const scriptOptions = {
        domain: effectiveDomain,
        proxyUrl,
        ternUIVersion,
        nonce,
        router
    };

    const scriptUrl = ternUIgetScriptUrl(scriptOptions);
    const scriptAttributes = constructScriptAttributes(scriptOptions);

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
    )
}