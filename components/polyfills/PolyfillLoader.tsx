// components/polyfills/PolyfillLoader.tsx
"use client";

import { useEffect } from "react";

export default function PolyfillLoader() {
  // We use a layout effect or immediate execution pattern where possible
  // to ensure these exist before children mount.
  
  if (typeof window !== "undefined") {
    // 1. ResizeObserver (Critical for Tooltips & Charts)
    if (!("ResizeObserver" in window)) {
      // We allow this to be async, but components using it should guard against it being missing
      // or we accept a small flash of unstyled content on very old browsers.
      import("resize-observer-polyfill").then((module) => {
        window.ResizeObserver = module.default;
      });
    }

    // 2. Crypto (Critical for UUID generation in Excel uploads)
    if (!window.crypto || !window.crypto.randomUUID) {
      // Simple polyfill for randomUUID if missing
      if (!window.crypto) {
        // @ts-expect-error - polyfilling crypto
        window.crypto = {};
      }
      if (!window.crypto.randomUUID) {
        window.crypto.randomUUID = () => {
          return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
            (
              Number(c) ^
              (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))
            ).toString(16)
          ) as `${string}-${string}-${string}-${string}-${string}`;
        };
      }
    }
  }

  useEffect(() => {
    const loadPolyfills = async () => {
      const promises = [];

      // 3. Core JS (Array.flat, Promise.allSettled, etc.)
      // Check for a common modern feature; if missing, load core-js
      if (!("flat" in Array.prototype) || !("allSettled" in Promise)) {
        promises.push(import("core-js/stable"));
      }

      // 4. Fetch (Network)
      if (!("fetch" in window)) {
        promises.push(import("whatwg-fetch"));
      }

      // 5. Intersection Observer (Scroll animations)
      if (!("IntersectionObserver" in window)) {
        promises.push(import("intersection-observer"));
      }

      // 6. URL Polyfill (Parsing query params)
      if (!("URL" in window) || !("searchParams" in URL.prototype)) {
        promises.push(import("url-polyfill"));
      }

      if (promises.length > 0) {
        await Promise.all(promises);
        console.log("Legacy browser detected: Polyfills loaded.");
      }
    };

    loadPolyfills();
  }, []);

  return null;
}