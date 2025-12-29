// hooks/useOnlineStatus.ts
'use client';

import { useState, useEffect } from 'react';
import { useAppSettingsStore } from '@/stores/appSettingsStore';

export function useOnlineStatus() {
  const [isBrowserOnline, setIsBrowserOnline] = useState(true);
  const isSimulatedOffline = useAppSettingsStore((state) => state.isSimulatedOffline);

  useEffect(() => {
    // Check status on initial client-side render
    if (typeof window !== 'undefined') {
      setIsBrowserOnline(navigator.onLine);
    }

    const handleOnline = () => setIsBrowserOnline(true);
    const handleOffline = () => setIsBrowserOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Return false if either the browser is offline OR the user has simulated offline mode
  return isBrowserOnline && !isSimulatedOffline;
}