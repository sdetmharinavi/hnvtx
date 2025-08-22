"use client";

import AuthButton from "@/components/auth/authButton";
import Link from "next/link";
import MenuButton from "./MenuButton";
import { useAuthStore } from "@/stores/authStore";
import Image from "next/image";
import ThemeToggle from "../common/ui/theme/ThemeToggle";

interface DashboardHeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export default function DashboardHeader({
  onMenuClick,
  title = "Dashboard",
}: DashboardHeaderProps) {
  const user = useAuthStore((state) => state.user);

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
                        {user.user_metadata?.name?.[0] || "U"}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user.user_metadata?.name || "User"}
                  </span>
                </Link>

                {/* Dropdown AuthButton - Responsive positioning */}
                <div
                  className="absolute top-full right-0 mt-2 mr-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 
                    sm:left-0 sm:right-auto"
                >
                  <div
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 
                      w-auto min-w-64 sm:w-auto"
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
