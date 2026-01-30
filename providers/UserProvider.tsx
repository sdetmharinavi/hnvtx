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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { theme, setTheme } = useThemeStore();
  const queryClient = useQueryClient();
  const { mutate: updateProfile } = useTableUpdate(createClient(), 'user_profiles');
  const { sync: syncData } = useDataSync();

  // Track if we have already synced the theme for the current user
  const hasInitializedThemeRef = useRef<string | null>(null);

  // Track the last synced user ID to prevent duplicate syncs on navigation
  const syncedUserIdRef = useRef<string | null>(null);

  // Effect 1: Sync from DB Profile -> Zustand Store (ONCE per user load)
  useEffect(() => {
    // If no profile or no user, nothing to do
    if (!profile || !user?.id) return;

    // If we haven't initialized theme for THIS user yet
    if (hasInitializedThemeRef.current !== user.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profileTheme = (profile.preferences as any)?.theme;

      if (profileTheme && typeof profileTheme === 'string') {
        // Apply DB theme to local store
        setTheme(profileTheme as Theme);
      }

      // Mark as initialized for this user
      hasInitializedThemeRef.current = user.id;
    }
  }, [profile, user?.id, setTheme]);

  // Effect 2: Sync from Zustand Store -> DB Profile on theme change
  useEffect(() => {
    const unsubscribe = useThemeStore.subscribe(
      (state) => state.theme,
      (newTheme: Theme, oldTheme: Theme) => {
        // Only update if theme actually changed and user is logged in
        if (newTheme !== oldTheme && user?.id && profile) {
          const currentPreferences = (profile.preferences as Record<string, unknown>) || {};

          // Only update DB if DB value differs from new Local value
          if (currentPreferences.theme !== newTheme) {
            const newPreferences = { ...currentPreferences, theme: newTheme };

            updateProfile(
              {
                id: user.id,
                data: { preferences: newPreferences },
              },
              {
                onSuccess: () => {
                  // Invalidate to keep data consistent, but Effect 1 won't run again due to ref check
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

  // Effect 3: Auto-Sync User Profiles on Login (Once per session)
  useEffect(() => {
    const currentUserId = user?.id;

    // If user logs out, reset the ref so they sync again upon next login
    if (!currentUserId) {
      syncedUserIdRef.current = null;
      hasInitializedThemeRef.current = null; // Also reset theme init
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
