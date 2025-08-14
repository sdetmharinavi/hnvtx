"use client";
 
import { useEffect } from "react";
 
export default function PolyfillLoader() {
  useEffect(() => {
    const needsPolyfills = !("fetch" in window) || !("IntersectionObserver" in window);
 
    if (needsPolyfills) {
      import("core-js/stable");
      import("regenerator-runtime/runtime");
      import("whatwg-fetch");
      import("intersection-observer");
      import("url-polyfill");
    }
  }, []);
 
  return null; // No UI needed
}