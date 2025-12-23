// path: providers/AppearanceProvider.tsx
'use client';

import { useEffect } from 'react';
import { useAppearanceStore } from '@/stores/appearanceStore';

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const fontSizeMultiplier = useAppearanceStore((state) => state.fontSizeMultiplier);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-size-multiplier', String(fontSizeMultiplier));
  }, [fontSizeMultiplier]);

  return <>{children}</>;
}