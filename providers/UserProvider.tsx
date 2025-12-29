// path: providers/UserProvider.tsx
"use client";

import { createContext, useContext, ReactNode, useEffect } from 'react';
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
  canAccess: (allowedRoles?: string[]) => boolean;
  refetch: () => Promise<UseQueryResult>;
  error: Error | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { profile, role, isSuperAdmin, isLoading, canAccess, refetch, error } = useUserPermissionsExtended();
  const { user } = useAuth();
  const { theme, setTheme } = useThemeStore();
  const queryClient = useQueryClient();
  const { mutate: updateProfile } = useTableUpdate(createClient(), 'user_profiles');

  // Effect 1: Sync from DB Profile -> Zustand Store on profile load
  // We want to update the local theme ONLY when the profile data arrives or changes from the server.
  // We DO NOT want to run this when 'theme' changes locally, to avoid reverting user selection before sync.
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profileTheme = (profile?.preferences as any)?.theme;
    
    // Check if profile has a theme and it is different from current
    if (profileTheme && typeof profileTheme === 'string' && profileTheme !== theme) {
      // Update the Zustand store to match the database preference.
      setTheme(profileTheme as 'light' | 'dark' | 'system');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, setTheme]); // Removed 'theme' from dependency array to prevent revert loops

  // Effect 2: Sync from Zustand Store -> DB Profile on theme change
  useEffect(() => {
    // This subscribes to any changes in the Zustand store's 'theme' value.
    const unsubscribe = useThemeStore.subscribe(
      (state) => state.theme,
      (newTheme: Theme, oldTheme: Theme) => {
        // Only save if the theme was actually changed by the user and the user is logged in.
        if (newTheme !== oldTheme && user?.id && profile) {
          const currentPreferences = (profile.preferences as Record<string, unknown>) || {};
          
          // Only trigger an update if the DB value is different from the new theme.
          // This prevents an infinite loop upon initial sync.
          if (currentPreferences.theme !== newTheme) {
            const newPreferences = { ...currentPreferences, theme: newTheme };
            
            updateProfile(
              {
                id: user.id,
                data: { preferences: newPreferences },
              },
              {
                // We don't need toast notifications for this background save.
                onSuccess: () => {
                   // Critical: Invalidate profile query to fetch new preferences and keep Effect 1 in sync
                   queryClient.invalidateQueries({ queryKey: ['user-full-profile'] });
                },
                onError: (err) => console.error('Failed to save theme preference:', err),
              }
            );
          }
        }
      }
    );
    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [user?.id, profile, updateProfile, queryClient]);

  return (
    <UserContext.Provider value={{ profile, role: role as UserRole | null, isSuperAdmin, isLoading, canAccess, refetch: refetch as () => Promise<UseQueryResult>, error }}>
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