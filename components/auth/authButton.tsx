// components/auth/authButton.tsx
"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/authStore";
import { BiLogOut, BiUser } from "react-icons/bi";
import Image from "next/image";

export default function AuthButton() {
  const { logout } = useAuth();
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return (
      <div className="flex items-center space-x-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 shadow-sm">
        <Link
          href="/login"
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm min-w-[220px]">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="shrink-0">
            {user.user_metadata?.avatar_url ? (
              <Image
                src={user.user_metadata.avatar_url}
                alt="Avatar"
                className="h-8 w-8 rounded-full ring-2 ring-gray-100 dark:ring-gray-800"
                width={32}
                height={32}
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                <BiUser className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {(user.user_metadata?.first_name
                ? user.user_metadata?.first_name +
                  " " +
                  user.user_metadata?.last_name
                : user.email?.split("@")[0]) || "User"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </p>
          </div>
        </div>
      </div>
      <div className="py-2">
        <button
          onClick={logout}
          className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
        >
          <BiLogOut className="h-4 w-4 mr-3 text-red-500 group-hover:text-red-600" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
