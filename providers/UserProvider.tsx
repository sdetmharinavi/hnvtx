// path: providers/UserProvider.tsx
'use client';

import { createContext, useContext, ReactNode, useEffect, useRef } from 'react';
import { useUserPermissionsExtended } from '@/hooks/useRoleFunctions';
import { UserRole } from '@/types/user-roles';
import { V_user_profiles_extendedRowSchema } from '@/schemas/zod-schemas';
import { UseQueryResult, useQueryClient } from '@tanstack/react-query';
import { useThemeStore, Theme } from '@/stores/themeStore';
import { useTableUpdate } from '@/hooks/database';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserContextType {
  profile: V_user_profiles_extendedRowSchema | null;
  role: UserRole | null;
  isSuperAdmin: boolean | null;
  isLoading: boolean;
  canAccess: (allowedRoles?: readonly string[]) => boolean;
  refetch: () => Promise<UseQueryResult>;
  error: Error | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { profile, role, isSuperAdmin, isLoading, canAccess, refetch, error } =
    useUserPermissionsExtended();
  const { user } = useAuth();
  const { setTheme } = useThemeStore();
  const queryClient = useQueryClient();
  const { mutate: updateProfile } = useTableUpdate(createClient(), 'user_profiles');

  const hasInitializedThemeRef = useRef<string | null>(null);

  // 1. Theme Initialization
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

  // 2. Sync Theme Changes to Database
  useEffect(() => {
    const unsubscribe = useThemeStore.subscribe(
      (state) => state.theme,
      (newTheme: Theme, oldTheme: Theme) => {
        if (newTheme !== oldTheme && user?.id && profile) {
          const currentPreferences = (profile.preferences as Record<string, unknown>) || {};
          if (currentPreferences.theme !== newTheme) {
            const newPreferences = { ...currentPreferences, theme: newTheme };
            updateProfile(
              { id: user.id, data: { preferences: newPreferences } },
              {
                onSuccess: () => {
                  queryClient.invalidateQueries({ queryKey: ['user-full-profile'] });
                },
                onError: (err) => console.error('Failed to save theme preference:', err),
              },
            );
          }
        }
      },
    );
    return () => unsubscribe();
  }, [user?.id, profile, updateProfile, queryClient]);

  // REMOVED: Automatic syncData effect.
  // React Query's `useQuery` in `useUserPermissionsExtended` handles fetching data on mount.
  // Triggering `syncData` here caused a double-fetch loop.

  return (
    <UserContext.Provider
      value={{
        profile,
        role: role as UserRole | null,
        isSuperAdmin,
        isLoading,
        canAccess,
        refetch: refetch as () => Promise<UseQueryResult>,
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