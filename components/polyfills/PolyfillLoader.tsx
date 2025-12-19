"use client";

import { useEffect } from "react";

export default function PolyfillLoader() {
  if (typeof window !== "undefined") {
    // 1. ResizeObserver (Critical for Tooltips & Charts)
    if (!("ResizeObserver" in window)) {
      import("resize-observer-polyfill").then((module) => {
        window.ResizeObserver = module.default;
      });
    }

    // 2. Crypto (Critical for UUID generation)
    if (!window.crypto || !window.crypto.randomUUID) {
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

    // 3. structuredClone Polyfill (Critical for Data Copying)
    // This is often missing in Safari < 15.4 and older Android WebViews
    if (!("structuredClone" in window)) {
      console.warn("Polyfilling structuredClone for legacy browser support.");
      // THE FIX: Cast window to any to avoid "Property does not exist on type 'never'" error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).structuredClone = (val: any) => {
        if (val === undefined) return undefined;
        try {
          return JSON.parse(JSON.stringify(val));
        } catch (e) {
          console.error("structuredClone polyfill failed (circular dependency?)", e);
          throw e; // JSON.stringify fails on circular refs, which standard structuredClone handles, but this covers 99% of app use cases.
        }
      };
    }
  }

  useEffect(() => {
    const loadPolyfills = async () => {
      const promises = [];

      // 4. Core JS features
      if (!("flat" in Array.prototype) || !("allSettled" in Promise)) {
        promises.push(import("core-js/stable"));
      }

      // 5. Fetch
      if (!("fetch" in window)) {
        promises.push(import("whatwg-fetch"));
      }

      // 6. Intersection Observer
      if (!("IntersectionObserver" in window)) {
        promises.push(import("intersection-observer"));
      }

      // 7. URL Polyfill
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