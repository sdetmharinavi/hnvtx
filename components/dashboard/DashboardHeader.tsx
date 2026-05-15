// components/dashboard/DashboardHeader.tsx
'use client';

import AuthButton from '@/components/auth/authButton';
import Link from 'next/link';
import MenuButton from './MenuButton';
import { useAuthStore } from '@/stores/authStore';
import Image from 'next/image';
import ThemeToggle from '../common/ui/theme/ThemeToggle';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useDataSync } from '@/hooks/data/useDataSync';
import { useState, useRef, useEffect } from 'react';
import useIsMobile from '@/hooks/useIsMobile';
import { BiUser } from 'react-icons/bi';
import { motion, AnimatePresence } from 'framer-motion';
import { FontSizeToggle } from '../common/ui/FontSizeToggle';

const SyncStatusIndicator = () => {
  const { isSyncing } = useDataSync();
  const isOnline = useOnlineStatus();

  if (!isOnline) {
    return (
      <div
        className='flex items-center gap-2 px-2 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        title='No Internet Connection'>
        <WifiOff className='w-4 h-4 text-red-500' />
        <span className='text-xs font-medium text-red-600 dark:text-red-300 hidden sm:inline'>
          Offline
        </span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className='flex items-center gap-2 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 transition-all'>
        <RefreshCw className='w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin' />
        <span className='text-xs font-bold text-blue-700 dark:text-blue-300 hidden sm:inline'>
          Updating...
        </span>
      </div>
    );
  }

  return (
    <div className='flex items-center gap-2 px-2 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'>
      <Wifi className='w-4 h-4 text-green-600 dark:text-green-400' />
      <span className='text-xs font-medium text-green-700 dark:text-green-300 hidden sm:inline'>
        Online
      </span>
    </div>
  );
};

export default function DashboardHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const user = useAuthStore((state) => state.user);
  const isMobile = useIsMobile();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
      <header className='border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800'>
        <div className='mx-auto max-w-full px-4 sm:px-6 lg:px-8'>
          <div className='flex h-16 items-center justify-between'>
            {/* Left side */}
            <div className='flex items-center'>
              <MenuButton onClick={onMenuClick} />
              <Link href='/' className='ml-2 flex items-center h-full'>
                {/* THE FIX: Use maximum standard intrinsic sizes to maintain ratio cleanly */}
                {/* Responsive tailwind handles the rest (h-[30px] on mobile, h-[60px] on desktop) */}
                <Image
                  src='/logo.png'
                  alt='Harinavi Logo'
                  width={200}
                  height={60}
                  className='object-contain w-auto h-[30px] md:h-[60px]'
                  priority
                />
              </Link>
            </div>

            {/* Right side */}
            <div className='relative flex items-center space-x-2 sm:space-x-4'>
              <SyncStatusIndicator />

              {isMobile ? (
                <div ref={menuRef}>
                  <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className='block'>
                    {user?.user_metadata?.avatar_url ? (
                      <Image
                        src={user.user_metadata.avatar_url}
                        alt='User Avatar'
                        className='h-8 w-8 rounded-full ring-2 ring-gray-200 dark:ring-gray-600 object-cover'
                        width={32}
                        height={32}
                      />
                    ) : (
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 ring-2 ring-gray-200 dark:ring-gray-600'>
                        <BiUser className='h-4 w-4 text-white' />
                      </div>
                    )}
                  </button>
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className='absolute top-full right-0 mt-2 z-50 w-64'>
                        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700'>
                          <AuthButton />
                          <div className='p-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-center gap-2'>
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
                  <div className='flex items-center gap-2'>
                    <FontSizeToggle />
                    <ThemeToggle />
                  </div>
                  <div className='group'>
                    <Link
                      href='/onboarding'
                      className='flex items-center space-x-2 transition-colors hover:opacity-80'>
                      {user?.user_metadata?.avatar_url ? (
                        <Image
                          src={user.user_metadata?.avatar_url}
                          alt='User Avatar'
                          className='h-8 w-8 rounded-full object-cover'
                          width={32}
                          height={32}
                        />
                      ) : (
                        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-500'>
                          <BiUser className='h-4 w-4 text-white' />
                        </div>
                      )}
                      <span className='text-sm font-medium text-gray-700 dark:text-gray-300 hidden lg:block'>
                        {user?.user_metadata?.first_name || user?.user_metadata?.name || 'User'}
                      </span>
                    </Link>
                    <div className='absolute top-full right-0 mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50'>
                      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 w-auto min-w-64'>
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
    </>
  );
}
