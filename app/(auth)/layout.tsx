// app/(auth)/layout.tsx
'use client';

import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { authState } = useAuth();

  if (authState === 'authenticated') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-blue-50 bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex min-h-screen">
        {/* Left side - Branding */}
        <div className="relative hidden overflow-hidden lg:flex lg:flex-1">
          {/* FIX: Added top-0 left-0 w-full h-full and bg-blue-600 fallback */}
          <div className="absolute top-0 left-0 w-full h-full bg-blue-600 bg-linear-to-br from-blue-600 to-purple-700 opacity-90 dark:from-gray-800 dark:to-gray-900" />
          {/* <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" /> */}
          <div className="relative z-10 flex flex-col justify-center px-12 text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="mb-6 text-4xl font-bold">
                Welcome to HARINAVI TRANSMISSION MAINTENANCE DATABASE
              </h1>
              <p className="mb-8 text-xl opacity-90 dark:opacity-80">
                Secure authentication with role-based access control
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-white dark:bg-blue-400" />
                  <span>Multi-role user management</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-white dark:bg-blue-400" />
                  <span>Secure email verification</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-white dark:bg-blue-400" />
                  <span>Protected routes & permissions</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-white dark:bg-blue-400" />
                  <span>Dark mode support</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right side - Auth forms */}
        <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto w-full max-w-md"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
