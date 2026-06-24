// components/auth/Protected.tsx
'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { PageSpinner } from '../common/ui/LoadingSpinner';
import { UserRole } from '@/types/user-roles';
import { UnauthorizedModal } from './UnauthorizedModal';
import { useAuthStore } from '@/stores/authStore';
import { useUser } from '@/providers/UserProvider';
import { ErrorDisplay } from '@/components/common/ui';

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
  // 👇 FIX: Destructure refetch to use instead of window.location.reload
  const { canAccess, isSuperAdmin, role, isLoading: isUserLoading, error, refetch } = useUser();

  // 👇 FIX: Catch network timeouts gracefully and prompt user WITHOUT a hard reload
  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full">
          <ErrorDisplay
            error={error?.message || "Failed to communicate with the database. Please check your network connection."}
            title="Connection Error"
            variant="alert"
            actions={[
              // 👇 FIX: Changed window.location.reload() to a soft React Query refetch
              { label: "Retry Connection", onClick: () => refetch(), variant: "primary" }
            ]}
          />
        </div>
      </div>
    );
  }

  if (isUserLoading || !role) {
    return <PageSpinner text="Verifying permissions..." />;
  }

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
