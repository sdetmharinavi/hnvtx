import { useEffect, useState } from 'react';

const LOCAL_KEY = 'isOutdatedBrowser';

function detectOutdatedBrowser(): boolean {
  const ua = navigator.userAgent;
  let isOutdated = false;

  const isIE = /MSIE|Trident/.test(ua);
  const legacyEdgeMatch = ua.match(/Edge\/(\d+)/);
  const chromeMatch = ua.match(/Chrome\/(\d+)/);
  const firefoxMatch = ua.match(/Firefox\/(\d+)/);
  const safariMatch = ua.match(/Version\/(\d+).+Safari/);
  const edgeMatch = ua.match(/Edg\/(\d+)/);

  if (isIE) {
    isOutdated = true;
  } else if (legacyEdgeMatch) {
    const version = parseInt(legacyEdgeMatch[1]);
    if (version < 80) isOutdated = true;
  } else if (chromeMatch) {
    const version = parseInt(chromeMatch[1]);
    if (version < 110) isOutdated = true;
  } else if (firefoxMatch) {
    const version = parseInt(firefoxMatch[1]);
    if (version < 100) isOutdated = true;
  } else if (safariMatch) {
    const version = parseInt(safariMatch[1]);
    if (version < 15) isOutdated = true;
  } else if (edgeMatch) {
    const version = parseInt(edgeMatch[1]);
    if (version < 110) isOutdated = true;
  }

  const missingFeatures = [
    () => typeof Promise !== 'function' || typeof Symbol !== 'function',
    () => !CSS.supports('display', 'flex'),
    () => !CSS.supports('position', 'sticky'),
    () => !CSS.supports('backdrop-filter', 'blur(1px)'),
    () => typeof IntersectionObserver === 'undefined',
    () => typeof localStorage === 'undefined',
    () => typeof sessionStorage === 'undefined',
  ].some(fn => fn());

  return isOutdated || missingFeatures;
}

export function useOutdatedBrowserCheck(): boolean | null {
  const [isOutdated, setIsOutdated] = useState<boolean | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem(LOCAL_KEY);
    if (cached !== null) {
      setIsOutdated(cached === 'true');
      return;
    }

    const result = detectOutdatedBrowser();
    localStorage.setItem(LOCAL_KEY, String(result));
    setIsOutdated(result);
  }, []);

  return isOutdated;
}
