// path: providers/UserProvider.tsx
"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useUserPermissionsExtended } from '@/hooks/useRoleFunctions';
import { UserRole } from '@/types/user-roles';
import { PageSpinner } from '@/components/common/ui';

interface UserContextType {
  role: UserRole | null;
  isSuperAdmin: boolean | null;
  isLoading: boolean;
  canAccess: (allowedRoles?: string[]) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { role, isSuperAdmin, isLoading, canAccess } = useUserPermissionsExtended();

  // While fetching the essential role/admin status, show a full-page loader
  // to prevent any child components from rendering with incorrect permissions.
  if (isLoading) {
    return <PageSpinner text="Verifying user permissions..." />;
  }

  return (
    <UserContext.Provider value={{ role: role as UserRole | null, isSuperAdmin, isLoading, canAccess }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};