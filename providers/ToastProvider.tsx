// components/providers/ToastProvider.tsx
'use client';

import { Toaster } from 'sonner';
import { useTheme } from '@/providers/ThemeProvider';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <>
      {children}
      <Toaster
        theme={theme === 'system' ? 'system' : theme}
        className="toaster group"
        toastOptions={{
          classNames: {
            toast:
              'group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-950 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-gray-950 dark:group-[.toaster]:text-gray-50 dark:group-[.toaster]:border-gray-800',
            description: 'group-[.toast]:text-gray-500 dark:group-[.toast]:text-gray-400',
            actionButton:
              'group-[.toast]:bg-gray-900 group-[.toast]:text-gray-50 dark:group-[.toast]:bg-gray-50 dark:group-[.toast]:text-gray-900',
            cancelButton:
              'group-[.toast]:bg-gray-100 group-[.toast]:text-gray-500 dark:group-[.toast]:bg-gray-800 dark:group-[.toast]:text-gray-400',
          },
        }}
        richColors
        closeButton
        position="top-right"
      />
    </>
  );
}