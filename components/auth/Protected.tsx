// components/auth/Protected.tsx
'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { PageSpinner } from '../common/ui/LoadingSpinner';
import { UserRole } from '@/types/user-roles';
import { UnauthorizedModal } from './UnauthorizedModal';
import { useAuthStore } from '@/stores/authStore';
import { useUser } from '@/providers/UserProvider';

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
  // THE FIX: Get all user data from the single, consolidated useUser context.
  const { canAccess, isSuperAdmin, role, isLoading: isUserLoading } = useUser();

  if (isUserLoading) {
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
