// path: components/dashboard/DashboardHeader.tsx
"use client";

import AuthButton from "@/components/auth/authButton";
import Link from "next/link";
import MenuButton from "./MenuButton";
import { useAuthStore } from "@/stores/authStore";
import Image from "next/image";
import ThemeToggle from "../common/ui/theme/ThemeToggle";
import { useMutationQueue } from "@/hooks/data/useMutationQueue";
import { Cloud, CloudOff, AlertTriangle, RefreshCw } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useDataSync } from "@/hooks/data/useDataSync";
import { useCallback, useState, useRef, useEffect } from "react";
import useIsMobile from "@/hooks/useIsMobile";
import { BiUser } from "react-icons/bi";
import { motion, AnimatePresence } from "framer-motion";
import { SyncStatusModal } from "./SyncStatusModal";
import { FontSizeToggle } from "../common/ui/FontSizeToggle";

interface DashboardHeaderProps {
  onMenuClick: () => void;
  // title?: string;
}

const SyncStatusIndicator = ({ onClick }: { onClick: () => void }) => {
  const { pendingCount, failedCount } = useMutationQueue();
  const isOnline = useOnlineStatus();

  if (!isOnline) {
    return (
      <button onClick={onClick} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
        <CloudOff className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <span className="text-xs font-medium text-gray-600 dark:text-gray-300 hidden sm:inline">Offline</span>
        {(pendingCount > 0 || failedCount > 0) && (
           <span className="bg-gray-500 text-white text-[10px] px-1.5 rounded-full">{pendingCount + failedCount}</span>
        )}
      </button>
    );
  }

  if (failedCount > 0) {
    return (
      <button onClick={onClick} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors animate-pulse">
        <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
        <span className="text-xs font-bold text-red-700 dark:text-red-300">{failedCount} Failed</span>
      </button>
    );
  }

  if (pendingCount > 0) {
    return (
      <button onClick={onClick} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
        <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-bounce" />
        <span className="text-xs font-bold text-blue-700 dark:text-blue-300">{pendingCount} Pending</span>
      </button>
    );
  }

  return (
    <button onClick={onClick} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
      <Cloud className="w-4 h-4 text-green-600 dark:text-green-400" />
      <span className="text-xs font-medium text-green-700 dark:text-green-300 hidden sm:inline">Synced</span>
    </button>
  );
};

export default function DashboardHeader({
  onMenuClick,
  // title,
}: DashboardHeaderProps) {
  const user = useAuthStore((state) => state.user);
  const { isSyncing, sync } = useDataSync();
  const isMobile = useIsMobile();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleRefresh = useCallback(() => {
    sync();
  }, [sync]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left side - Only Menu Button (no title) */}
            <div className="flex items-center">
              <MenuButton onClick={onMenuClick} />
              <Link href="/">
                {/* THE FIX: Use width=0/height=0 + sizes="100vw" + CSS width/height: auto to fully control aspect ratio via CSS without prop conflict */}
                <Image 
                  src="/logo.png" 
                  alt="Logo" 
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="ml-2" 
                  style={{ width: 'auto', height: isMobile ? '30px' : '60px' }} 
                  priority // Good practice for LCP element
                />
              </Link>
            </div>
            {/* Logo */}

            {/* Right side - Actions and User Menu */}
            <div className="relative flex items-center space-x-2 sm:space-x-4">
              <SyncStatusIndicator onClick={() => setIsSyncModalOpen(true)} />

              <button
                onClick={handleRefresh}
                disabled={isSyncing}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh all data"
              >
                <RefreshCw className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>

              {isMobile ? (
                <div ref={menuRef}>
                  <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="block">
                    {user?.user_metadata?.avatar_url ? (
                      <Image
                        src={user.user_metadata.avatar_url}
                        alt="User Avatar"
                        className="h-8 w-8 rounded-full ring-2 ring-gray-200 dark:ring-gray-600"
                        width={32}
                        height={32}
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 ring-2 ring-gray-200 dark:ring-gray-600">
                        <BiUser className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </button>
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full right-0 mt-2 z-50 w-64"
                      >
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                          <AuthButton />
                          <div className="p-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-center gap-2">
                            <FontSizeToggle />
                            <ThemeToggle />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <FontSizeToggle />
                    <ThemeToggle />
                  </div>
                  <div className="group">
                    <Link
                      href="/onboarding"
                      className="flex items-center space-x-2 transition-colors hover:opacity-80"
                    >
                      {user?.user_metadata?.avatar_url ? (
                        <Image
                          src={user.user_metadata?.avatar_url}
                          alt="User Avatar"
                          className="h-8 w-8 rounded-full"
                          width={32}
                          height={32}
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                          <BiUser className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden lg:block">
                        {user?.user_metadata?.first_name || user?.user_metadata?.name || "User"}
                      </span>
                    </Link>
                    <div className="absolute top-full right-0 mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 w-auto min-w-64">
                        <AuthButton />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <SyncStatusModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} />
    </>
  );
}