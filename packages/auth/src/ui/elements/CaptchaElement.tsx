import { useEffect, useRef } from 'react';

interface CaptchaElementProps {
  siteKey: string;
  onVerify: (token: string) => void;
}

declare global {
  interface Window {
    grecaptcha: any;
  }
}

export const CaptchaElement = ({ siteKey, onVerify }: CaptchaElementProps) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  // Store the styles applied by the external script to persist them across React renders
  const observedStyles = useRef<{ height?: string; minHeight?: string }>({});

  useEffect(() => {
    if (!elementRef.current) return;

    // 1. Define the Observer
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'style' &&
          elementRef.current
        ) {
          // Capture the current computed styles that the widget might have set
          const style = window.getComputedStyle(elementRef.current);

          // Update our ref so we don't lose these on React updates
          if (style.height && style.height !== '0px') {
            observedStyles.current.height = style.height;
          }
          if (style.minHeight && style.minHeight !== '0px') {
            observedStyles.current.minHeight = style.minHeight;
          }
        }
      });
    });

    // 2. Start Observing
    observer.observe(elementRef.current, {
      attributes: true,
      attributeFilter: ['style'],
    });

    // 3. Render reCAPTCHA
    const renderCaptcha = () => {
      if (
        window.grecaptcha &&
        window.grecaptcha.render &&
        widgetIdRef.current === null &&
        elementRef.current
      ) {
        widgetIdRef.current = window.grecaptcha.render(elementRef.current, {
          sitekey: siteKey,
          callback: onVerify,
        });
      }
    };

    if (window.grecaptcha) {
      renderCaptcha();
    } else {
      // Handle script loading if not already present
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = renderCaptcha;
      document.head.appendChild(script);
    }

    return () => {
      observer.disconnect();
      // Optional: Reset widget on unmount if needed
      // if (widgetIdRef.current !== null) window.grecaptcha.reset(widgetIdRef.current);
    };
  }, [siteKey, onVerify]);

  return (
    <div
      ref={elementRef}
      className='min-h-[78px]' // Initial placeholder height to prevent CLS
      style={observedStyles.current} // Apply persisted styles
    />
  );
};
