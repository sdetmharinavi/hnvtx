// path: providers/UserProvider.tsx
"use client";

import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useUserPermissionsExtended } from '@/hooks/useRoleFunctions';
import { UserRole } from '@/types/user-roles';
import { V_user_profiles_extendedRowSchema } from '@/schemas/zod-schemas';
import { UseQueryResult } from '@tanstack/react-query';
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
  const { mutate: updateProfile } = useTableUpdate(createClient(), 'user_profiles');

  // Effect 1: Sync from DB Profile -> Zustand Store on profile load
  useEffect(() => {
    // This effect runs when `profile` data is fetched or changes.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profileTheme = (profile?.preferences as any)?.theme;
    if (profileTheme && typeof profileTheme === 'string' && profileTheme !== theme) {
      // A theme is set in the DB profile that's different from the current store theme.
      // Update the Zustand store to match the database preference.
      setTheme(profileTheme as 'light' | 'dark' | 'system');
    }
  }, [profile, setTheme, theme]);

  // Effect 2: Sync from Zustand Store -> DB Profile on theme change
  useEffect(() => {
    // This subscribes to any changes in the Zustand store's 'theme' value.
    const unsubscribe = useThemeStore.subscribe(
      (state) => state.theme,
      // THIS IS THE FIX: Add explicit types for newTheme and oldTheme
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
                onSuccess: () => console.log(`Theme preference '${newTheme}' saved to database.`),
                onError: (err) => console.error('Failed to save theme preference:', err),
              }
            );
          }
        }
      }
    );
    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [user?.id, profile, updateProfile]);

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