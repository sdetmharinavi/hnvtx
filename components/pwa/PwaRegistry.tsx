"use client";

import { useEffect } from "react";

const PwaRegistry = () => {
  useEffect(() => {
    if (
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      const registerServiceWorker = async () => {
        try {
          await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
          });
          console.log("Service worker registered successfully.");
        } catch (error) {
          console.error("Service worker registration failed:", error);
        }
      };
      registerServiceWorker();
    }
  }, []);

  return null; // This component does not render anything.
};

export default PwaRegistry;