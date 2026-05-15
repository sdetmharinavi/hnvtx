// components/auth/UnauthorizedModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types/user-roles';
import { FiRefreshCw, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import { Modal } from '@/components/common/ui/Modal';
import { Button } from '@/components/common/ui/Button';

interface UnauthorizedModalProps {
  allowedRoles: UserRole[];
  currentRole?: string | null;
}

export const UnauthorizedModal: React.FC<UnauthorizedModalProps> = ({
  allowedRoles,
  currentRole,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const router = useRouter();

  // Auto-close modal and redirect after 5 seconds
  useEffect(() => {
    if (isResetting) return;
    
    const timer = setTimeout(() => {
      handleGoDashboard();
    }, 5000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResetting]);

  const handleGoDashboard = () => {
    setIsOpen(false);
    router.push('/dashboard');
  };

  const handleGoBack = () => {
    router.back();
    setIsOpen(false);
  };

  const handleHardReset = async () => {
    setIsResetting(true);
    if (
      !window.confirm(
        'This will clear your browser cache, cookies, and session data to fix potential permission issues. Continue?'
      )
    ) {
      setIsResetting(false);
      return;
    }

    try {
      // 1. Clear Storage
      localStorage.clear();
      sessionStorage.clear();

      // 2. Clear Cookies
      document.cookie.split(';').forEach((c) => {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
      });

      // 3. Clear Cache Storage (Service Worker Caches)
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }

      // 4. Unregister Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      // 5. Force Reload to Login
      window.location.href = '/login';
    } catch (e) {
      console.error('Reset failed', e);
      window.location.reload();
    }
  };

  if (!isOpen) return null;

  const formatRole = (role: UserRole) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleGoDashboard} 
      title="Access Denied" 
      size="md"
      closeOnOverlayClick={false}
      showCloseButton={false}
    >
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <FiAlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>

        <div className="space-y-2">
          <p className="text-gray-600 dark:text-gray-300">
            You don&apos;t have permission to access this page.
          </p>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-sm border border-gray-200 dark:border-gray-700 text-left">
            <div className="mb-2">
              <span className="font-semibold text-gray-700 dark:text-gray-200 block">Required Roles:</span>
              <span className="text-gray-600 dark:text-gray-400">
                {allowedRoles.map(formatRole).join(', ')}
              </span>
            </div>
            {currentRole && (
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-200 block">Your Role:</span>
                <span className="text-gray-600 dark:text-gray-400 font-mono">
                  {formatRole(currentRole as UserRole)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="w-full space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleGoBack}>
              Go Back
            </Button>
            <Button variant="primary" onClick={handleGoDashboard}>
              Dashboard
            </Button>
          </div>
          
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
             <button
              onClick={handleHardReset}
              disabled={isResetting}
              className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
            >
              {isResetting ? <FiRefreshCw className="animate-spin" /> : <FiTrash2 />}
              {isResetting ? 'Clearing Data...' : 'Fix Issues (Clear App Data)'}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 animate-pulse">
          Redirecting in 5 seconds...
        </p>
      </div>
    </Modal>
  );
};