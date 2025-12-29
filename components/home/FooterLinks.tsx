// path: components/home/FooterLinks.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { FiRefreshCw, FiTrash2 } from "react-icons/fi";

const footerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      delay: 1.2,
      ease: "easeInOut",
    },
  },
};

export default function FooterLinks() {
  const currentYear = new Date().getFullYear();
  const [isResetting, setIsResetting] = useState(false);

  // --- HARD RESET LOGIC ---
  const handleHardReset = async () => {
    const confirmed = window.confirm(
      "⚠️ RECOVERY MODE ⚠️\n\n" +
      "This will wipe all local data (Database, Cache, Login Session) to fix loading issues.\n\n" +
      "Are you sure you want to proceed?"
    );

    if (!confirmed) return;

    setIsResetting(true);
    const toastId = toast.loading("Resetting application data...");

    try {
      // 1. Dynamic import to avoid SSR issues with Dexie
      const { localDb } = await import("@/hooks/data/localDb");
      
      // 2. Delete IndexedDB
      await localDb.delete();
      console.log("Database deleted");

      // 3. Clear Local/Session Storage
      localStorage.clear();
      sessionStorage.clear();

      // 4. Clear Cookies (for middleware/server session)
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // 5. Clear Service Worker Caches
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
        console.log("Caches cleared");
      }

      // 6. Unregister Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        console.log("Service Worker unregistered");
      }

      toast.success("Reset complete. Reloading...", { id: toastId });

      // 7. Force Hard Reload
      setTimeout(() => {
         window.location.reload();
      }, 1000);
      
    } catch (e) {
      console.error("Reset failed", e);
      toast.error("Reset failed. Please clear browser site data manually.", { id: toastId });
      setIsResetting(false);
    }
  };

  return (
    <motion.footer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      variants={footerVariants as any}
      initial="hidden"
      animate="visible"
      className="absolute bottom-0 left-0 right-0 z-10 p-4 text-center"
    >
      <div className="flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-400 dark:text-gray-500">
        <span>&copy; {currentYear} Harinavi. All Rights Reserved.</span>
        
        <div className="flex items-center gap-x-4">
          <Link
            href="/terms"
            className="transition-colors hover:text-white dark:hover:text-gray-300"
          >
            Terms
          </Link>
          <span className="opacity-50">|</span>
          <Link
            href="/privacy"
            className="transition-colors hover:text-white dark:hover:text-gray-300"
          >
            Privacy
          </Link>
          <span className="opacity-50">|</span>
          
          {/* RESET BUTTON */}
          <button
            onClick={handleHardReset}
            disabled={isResetting}
            className="flex items-center gap-1.5 transition-colors hover:text-red-400 text-gray-400"
            title="Fix loading issues by clearing local data"
          >
            {isResetting ? (
               <FiRefreshCw className="animate-spin" />
            ) : (
               <FiTrash2 />
            )}
            <span>{isResetting ? "Resetting..." : "Reset Data"}</span>
          </button>
        </div>
      </div>
    </motion.footer>
  );
}