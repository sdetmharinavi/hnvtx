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
import { useDataSync } from '@/hooks/data/useDataSync';

interface UserContextType {
  profile: V_user_profiles_extendedRowSchema | null;
  role: UserRole | null;
  isSuperAdmin: boolean | null;
  isLoading: boolean;
  canAccess: (allowedRoles?: string[]) => boolean;
  refetch: () => Promise<UseQueryResult>;
  error: Error | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { profile, role, isSuperAdmin, isLoading, canAccess, refetch, error } =
    useUserPermissionsExtended();
  const { user } = useAuth();
  const { theme, setTheme } = useThemeStore();
  const queryClient = useQueryClient();
  const { mutate: updateProfile } = useTableUpdate(createClient(), 'user_profiles');
  const { sync: syncData } = useDataSync();

  // THE FIX: Track the last synced user ID to prevent duplicate syncs on navigation
  const syncedUserIdRef = useRef<string | null>(null);

  // Effect 1: Sync from DB Profile -> Zustand Store on profile load
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profileTheme = (profile?.preferences as any)?.theme;

    if (profileTheme && typeof profileTheme === 'string' && profileTheme !== theme) {
      setTheme(profileTheme as 'light' | 'dark' | 'system');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, setTheme]);

  // Effect 2: Sync from Zustand Store -> DB Profile on theme change
  useEffect(() => {
    const unsubscribe = useThemeStore.subscribe(
      (state) => state.theme,
      (newTheme: Theme, oldTheme: Theme) => {
        if (newTheme !== oldTheme && user?.id && profile) {
          const currentPreferences = (profile.preferences as Record<string, unknown>) || {};
          if (currentPreferences.theme !== newTheme) {
            const newPreferences = { ...currentPreferences, theme: newTheme };
            updateProfile(
              {
                id: user.id,
                data: { preferences: newPreferences },
              },
              {
                onSuccess: () => {
                  queryClient.invalidateQueries({ queryKey: ['user-full-profile'] });
                },
                onError: (err) => console.error('Failed to save theme preference:', err),
              }
            );
          }
        }
      }
    );
    return () => unsubscribe();
  }, [user?.id, profile, updateProfile, queryClient]);

  // Effect 3: Auto-Sync User Profiles on Login (Once per session)
  useEffect(() => {
    const currentUserId = user?.id;

    // If user logs out, reset the ref so they sync again upon next login
    if (!currentUserId) {
      syncedUserIdRef.current = null;
      return;
    }

    // Only sync if we haven't synced for this specific user ID yet
    if (syncedUserIdRef.current !== currentUserId) {
      syncedUserIdRef.current = currentUserId;

      // Fire and forget - background sync
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
