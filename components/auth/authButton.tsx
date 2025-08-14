// components/auth/authButton.tsx
'use client'
 
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import { BiLogOut, BiUser } from 'react-icons/bi'
import { CiSettings } from 'react-icons/ci'
import Image from 'next/image'
 
export default function AuthButton() {
  const { logout } = useAuth()
  const user = useAuthStore((state) => state.user)
 
  if (!user) {
    return (
      <div className="h-9 w-24 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg border border-gray-200 dark:border-gray-700"></div>
    )
  }
 
  if (user) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm min-w-[220px]">
        {/* User Info Header */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {user.user_metadata?.avatar_url ? (
                <Image
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  className="h-8 w-8 rounded-full ring-2 ring-gray-100 dark:ring-gray-800"
                  width={32}
                  height={32}
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <BiUser className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-2">
          <Link
            href="/onboarding"
            className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
          >
            <CiSettings className="h-4 w-4 mr-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
            <span className="font-medium">Update Profile</span>
          </Link>
          
          <button
            onClick={logout}
            className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
          >
            <BiLogOut className="h-4 w-4 mr-3 text-red-500 group-hover:text-red-600 dark:group-hover:text-red-400" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    )
  }
 
  return (
    <div className="flex items-center space-x-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 shadow-sm">
      <Link
        href="/login"
        className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        Sign In
      </Link>
      <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
      <Link
        href="/signup"
        className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
      >
        Get Started
      </Link>
    </div>
  )
}