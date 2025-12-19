// components/auth/UnauthorizedModal.tsx
"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@/types/user-roles";
import { FiRefreshCw, FiTrash2 } from "react-icons/fi";

interface UnauthorizedModalProps {
  allowedRoles: UserRole[];
  currentRole?: string | null;
}

export const UnauthorizedModal: React.FC<UnauthorizedModalProps> = ({ 
  allowedRoles, 
  currentRole 
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const router = useRouter();

  // Auto-close modal and redirect after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only auto-redirect if not interacting with reset
      if (!isResetting) {
        handleClose();
      }
    }, 5000);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResetting]);

  const handleClose = () => {
    setIsOpen(false);
    router.push("/dashboard");
  };

  const handleGoBack = () => {
    router.back();
    setIsOpen(false);
  };

  const handleHardReset = async () => {
    setIsResetting(true);
    if (!window.confirm("Troubleshooting: This will clear all local data (cache, database, login session) and reload the page. Continue?")) {
      setIsResetting(false);
      return;
    }

    try {
      // 1. Clear Storage
      localStorage.clear();
      sessionStorage.clear();

      // 2. Clear Cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // 3. Clear IndexedDB (Dexie)
      try {
        const { localDb } = await import("@/hooks/data/localDb");
        await localDb.delete();
      } catch (e) {
        console.error("DB cleanup failed", e);
      }

      // 4. Clear Cache Storage (Service Worker Caches)
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }

      // 5. Unregister Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      // 6. Force Reload to Login
      window.location.href = '/login';
      
    } catch (e) {
      console.error("Reset failed", e);
      // Fallback reload
      window.location.reload();
    }
  };

  if (!isOpen) return null;

  const formatRole = (role: UserRole) => {
    return role.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md mx-4 p-6 z-10 border border-gray-200 dark:border-gray-700">
        {/* Icon */}
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
          <svg 
            className="w-8 h-8 text-red-600 dark:text-red-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
          Access Denied
        </h3>

        {/* Message */}
        <div className="text-sm text-gray-600 dark:text-gray-300 text-center mb-6">
          <p className="mb-3">
            You don&apos;t have permission to access this page.
          </p>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3 border border-gray-100 dark:border-gray-600">
            <p className="font-medium text-gray-700 dark:text-gray-200 mb-1">Required roles:</p>
            <p className="text-gray-600 dark:text-gray-400">
              {allowedRoles.map(formatRole).join(", ")}
            </p>
            {currentRole && (
              <>
                <p className="font-medium text-gray-700 dark:text-gray-200 mt-2 mb-1">Your current role:</p>
                <p className="text-gray-600 dark:text-gray-400">{currentRole}</p>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleGoBack}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Go Back
            </button>
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Dashboard
            </button>
          </div>
          
          {/* Hard Reset Button */}
          <button
            onClick={handleHardReset}
            disabled={isResetting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none dark:bg-red-900/20 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900/30"
          >
             {isResetting ? <FiRefreshCw className="animate-spin w-4 h-4" /> : <FiTrash2 className="w-4 h-4" />}
             {isResetting ? "Resetting..." : "Reset App Data & Reload"}
          </button>
        </div>

        {/* Auto-close notice */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          Auto-redirecting in 5s unless you interact.
        </p>
      </div>
    </div>
  );
};