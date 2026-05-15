// components/auth/Protected.tsx
'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { PageSpinner } from '../common/ui/LoadingSpinner';
import { UserRole } from '@/types/user-roles';
import { UnauthorizedModal } from './UnauthorizedModal';
import { useAuthStore } from '@/stores/authStore';
import { useUser } from '@/providers/UserProvider';
import { ErrorDisplay } from '@/components/common/ui'; // Added import

interface ProtectedProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

const ProtectedContent = ({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles?: UserRole[];
}) => {
  // THE FIX: Destructure isError and error from useUser
  const { canAccess, isSuperAdmin, role, isLoading: isUserLoading, error } = useUser();

  // THE FIX: Catch network timeouts gracefully and prompt user
  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full">
          <ErrorDisplay 
            error={error?.message || "Failed to communicate with the database. Please check your network connection."} 
            title="Connection Error"
            variant="alert"
            actions={[
              { label: "Retry Connection", onClick: () => window.location.reload(), variant: "primary" }
            ]}
          />
        </div>
      </div>
    );
  }

  // Spinner is only shown if it's genuinely loading and hasn't errored out
  if (isUserLoading || !role) {
    return <PageSpinner text="Verifying permissions..." />;
  }

  // Security check for roles
  if (allowedRoles && !canAccess(allowedRoles) && !isSuperAdmin) {
    return <UnauthorizedModal allowedRoles={allowedRoles} currentRole={role} />;
  }

  return <>{children}</>;
};

export const Protected: React.FC<ProtectedProps> = ({
  children,
  allowedRoles,
  redirectTo = '/login',
}) => {
  const authState = useAuthStore((state) => state.authState);
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (authState === 'unauthenticated' && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace(redirectTo);
    }
  }, [authState, router, redirectTo]);

  if (authState === 'loading') {
    return <PageSpinner text="Verifying session..." />;
  }

  if (authState === 'unauthenticated') {
    return <PageSpinner text="Redirecting..." />;
  }

  if (authState === 'authenticated') {
    return <ProtectedContent allowedRoles={allowedRoles}>{children}</ProtectedContent>;
  }

  return <PageSpinner text="Finalizing..." />;
};