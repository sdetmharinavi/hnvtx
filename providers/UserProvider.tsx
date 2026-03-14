// providers/UserProvider.tsx
'use client';

import { createContext, useContext, ReactNode, useEffect, useRef } from 'react';
import { useUserPermissionsExtended } from '@/hooks/useRoleFunctions';
import { UserRole } from '@/types/user-roles';
import { V_user_profiles_extendedRowSchema } from '@/schemas/zod-schemas';
import { useThemeStore, Theme } from '@/stores/themeStore';
import { useAuth } from '@/hooks/useAuth';
import { useDataSync } from '@/hooks/data/useDataSync';

interface UserContextType {
  profile: V_user_profiles_extendedRowSchema | null;
  role: UserRole | null;
  isSuperAdmin: boolean | null;
  isLoading: boolean;
  canAccess: (allowedRoles?: readonly string[]) => boolean;
  refetch: () => Promise<unknown>;
  error: Error | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { profile, role, isSuperAdmin, isLoading, canAccess, refetch, error } =
    useUserPermissionsExtended();
  const { user } = useAuth();

  const { setTheme } = useThemeStore();
  const { sync: syncData } = useDataSync();

  const hasInitializedThemeRef = useRef<string | null>(null);
  const syncedUserIdRef = useRef<string | null>(null);

  // Initialize theme from profile on first load
  useEffect(() => {
    if (!profile || !user?.id) return;

    if (hasInitializedThemeRef.current !== user.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profileTheme = (profile.preferences as any)?.theme;
      if (profileTheme && typeof profileTheme === 'string') {
        setTheme(profileTheme as Theme);
      }
      hasInitializedThemeRef.current = user.id;
    }
  }, [profile, user?.id, setTheme]);

  // Sync user profile data automatically when user changes
  useEffect(() => {
    const currentUserId = user?.id;
    if (!currentUserId) {
      syncedUserIdRef.current = null;
      hasInitializedThemeRef.current = null;
      return;
    }
    if (syncedUserIdRef.current !== currentUserId) {
      syncedUserIdRef.current = currentUserId;
      syncData(['v_user_profiles_extended']);
    }
  }, [user?.id, syncData]);

  return (
    <UserContext.Provider
      value={{
        profile,
        role: role as UserRole | null,
        isSuperAdmin,
        isLoading,
        canAccess,
        refetch: refetch as () => Promise<unknown>,
        error,
      }}
    >
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
