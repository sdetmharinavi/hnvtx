import { useLayoutEffect, useEffect } from 'react';

// Use useLayoutEffect in the browser, and useEffect on the server.
// This silences the "useLayoutEffect does nothing on the server" warning.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default useIsomorphicLayoutEffect;