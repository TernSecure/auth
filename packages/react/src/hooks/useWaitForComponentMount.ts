import { useEffect, useRef, useState } from 'react';

interface WaitForElementOptions {
  selector?: string;
  root?: HTMLElement | null;
  timeout?: number;
}

/**
 * Waits for an element to have children in the DOM.
 * Used to detect when a TernSecure component has been fully mounted.
 */
function waitForElementChildren(options: WaitForElementOptions): Promise<void> {
  const { root = document?.body, selector, timeout = 0 } = options;

  return new Promise<void>((resolve, reject) => {
    if (!root) {
      reject(new Error('No root element provided'));
      return;
    }

    let elementToWatch: HTMLElement | null = root;
    if (selector) {
      elementToWatch = root?.querySelector(selector);
    }

    // Check if element already has children
    const isElementAlreadyPresent = elementToWatch?.childElementCount && elementToWatch.childElementCount > 0;
    if (isElementAlreadyPresent) {
      resolve();
      return;
    }

    // Set up MutationObserver to watch for children
    const observer = new MutationObserver(mutationsList => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          if (!elementToWatch && selector) {
            elementToWatch = root?.querySelector(selector);
          }

          if (elementToWatch?.childElementCount && elementToWatch.childElementCount > 0) {
            observer.disconnect();
            resolve();
            return;
          }
        }
      }
    });

    observer.observe(root, { childList: true, subtree: true });

    // Optional timeout
    if (timeout > 0) {
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout waiting for element children after ${timeout}ms`));
      }, timeout);
    }
  });
}

type MountingStatus = 'rendering' | 'rendered' | 'error';

/**
 * Detect when a TernSecure component has mounted by watching DOM updates
 * to an element with a `data-ternsecure-component="${component}"` property.
 */
export const useWaitForComponentMount = (component?: string): MountingStatus => {
  const watcherRef = useRef<Promise<void> | undefined>(undefined);
  const [status, setStatus] = useState<MountingStatus>('rendering');

  useEffect(() => {
    if (!component) {
      throw new Error('TernSecure: no component name provided, unable to detect mount.');
    }

    if (typeof window !== 'undefined' && !watcherRef.current) {
      watcherRef.current = waitForElementChildren({
        selector: `[data-ternsecure-component="${component}"]`
      })
        .then(() => {
          setStatus('rendered');
        })
        .catch(() => {
          setStatus('error');
        });
    }
  }, [component]);

  return status;
};
