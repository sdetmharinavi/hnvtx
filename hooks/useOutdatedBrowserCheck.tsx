// hooks/useOutdatedBrowserCheck.tsx
import { useEffect, useState } from 'react';

const LOCAL_KEY = 'isOutdatedBrowser';

function detectOutdatedBrowser(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  // **Priority 1: Feature Detection**
  const missingFeatures = [
    () => typeof Promise?.allSettled !== 'function', // ES2020
    () => typeof window.crypto?.subtle === 'undefined', // Web Crypto API
    () => !CSS.supports('display', 'grid'),
    () => !CSS.supports('position', 'sticky'),
    () => !('IntersectionObserver' in window),
    () => !('localStorage' in window),
    () => !('structuredClone' in window), // A more modern feature
  ].some((fn) => fn());

  if (missingFeatures) {
    return true;
  }

  // **Priority 2: User-Agent Sniffing as a fallback for known legacy browsers**
  const ua = navigator.userAgent;

  // Rule out Internet Explorer immediately
  const isIE = /MSIE|Trident/.test(ua);
  if (isIE) {
    return true;
  }

  // Check for very old versions of other browsers
  const legacyEdgeMatch = ua.match(/Edge\/(\d+)/); // Non-Chromium Edge
  if (legacyEdgeMatch && parseInt(legacyEdgeMatch[1]) < 18) {
    return true;
  }

  // At this point, the browser is likely modern enough.
  return false;
}

export function useOutdatedBrowserCheck(): boolean | null {
  const [isOutdated, setIsOutdated] = useState<boolean | null>(null);

  useEffect(() => {
    // Only run on the client
    if (typeof window === 'undefined') return;

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
