// components/dashboard/DashboardHeader.tsx
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
import { useCallback } from "react";
import { toast } from "sonner";

interface DashboardHeaderProps {
  onMenuClick: () => void;
  title?: string;
}

// New Sync Status Indicator Component
const SyncStatusIndicator = () => {
  const { pendingCount, failedCount } = useMutationQueue();
  const isOnline = useOnlineStatus();

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600" title="You are currently offline.">
        <CloudOff className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Offline</span>
      </div>
    );
  }

  if (failedCount > 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700" title={`${failedCount} changes failed to sync.`}>
        <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
        <span className="text-xs font-bold text-red-700 dark:text-red-300">{failedCount} Failed</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 animate-pulse-sync" title={`Syncing ${pendingCount} changes...`}>
        <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span className="text-xs font-bold text-blue-700 dark:text-blue-300">{pendingCount} Pending</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700" title="All changes are synced.">
      <Cloud className="w-4 h-4 text-green-600 dark:text-green-400" />
      <span className="text-xs font-medium text-green-700 dark:text-green-300">Synced</span>
    </div>
  );
};


export default function DashboardHeader({
  onMenuClick,
  title = "Dashboard",
}: DashboardHeaderProps) {
  const user = useAuthStore((state) => state.user);
    const { isSyncing, refetchSync } = useDataSync();
  const handleRefresh = useCallback(() => {
    toast.promise(refetchSync(), {
      loading: 'Starting manual data sync with the server...',
      success: 'Local data successfully synced!',
      error: (err: Error) => `Sync failed: ${err.message}`,
    });
  }, [refetchSync]);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <MenuButton onClick={onMenuClick} />
            <h1 className="hidden text-2xl font-bold text-gray-900 md:block dark:text-white">
              {title}
            </h1>
          </div>

          <div className="space-x-4 relative flex items-center">
            <SyncStatusIndicator />
            <button
              onClick={handleRefresh}
              disabled={isSyncing}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh all data"
            >
              <RefreshCw className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
            {user && (
              <div className="group">
                <Link
                  href="/onboarding"
                  className="flex items-center space-x-2 transition-colors hover:opacity-80"
                >
                  {user.user_metadata?.avatar_url ? (
                    <Image
                      src={user.user_metadata?.avatar_url}
                      alt="User Avatar"
                      className="h-8 w-8 rounded-full"
                      width={32}
                      height={32}
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                      <span className="text-sm font-medium text-white">
                        {user.user_metadata?.first_name?.[0] || "U"}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user.user_metadata?.first_name || "User"}
                  </span>
                </Link>

                <div
                  className="absolute top-full right-0 mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
                >
                  <div
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 w-auto min-w-64"
                  >
                    <AuthButton />
                  </div>
                </div>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}