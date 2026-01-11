import { useEffect, useRef } from 'react';

type KeyHandler = (e: KeyboardEvent) => void;

interface HotkeyOptions {
  preventDefault?: boolean;
  enabled?: boolean;
}

export function useHotkeys(
  key: string,
  callback: KeyHandler,
  options: HotkeyOptions = { preventDefault: true, enabled: true }
) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!options.enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Parse key combination
      const keys = key.toLowerCase().split('+');
      const mainKey = keys[keys.length - 1];
      const needsCtrl = keys.includes('ctrl');
      const needsShift = keys.includes('shift');
      const needsAlt = keys.includes('alt');
      const needsMeta = keys.includes('meta') || keys.includes('cmd');

      // Check modifiers
      if (needsCtrl && !event.ctrlKey) return;
      if (needsShift && !event.shiftKey) return;
      if (needsAlt && !event.altKey) return;
      if (needsMeta && !event.metaKey) return;

      // Check main key
      if (event.key.toLowerCase() === mainKey) {
        if (options.preventDefault) {
          event.preventDefault();
        }
        callbackRef.current(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, options.enabled, options.preventDefault]);
}
