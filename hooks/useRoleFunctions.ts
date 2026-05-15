// hooks/useRoleFunctions.ts
'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { V_user_profiles_extendedRowSchema } from '@/schemas/zod-schemas';
import { Json } from '@/types/supabase-types';
import { createClient } from '@/utils/supabase/client';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { parseJson } from '@/config/helper-functions';

// --- Types ---
export type UserRole = string | null;
export type SuperAdminStatus = boolean | null;
type UserPermissionsData = V_user_profiles_extendedRowSchema | null;

export interface UserPermissions {
  profile: UserPermissionsData;
  role: UserRole;
  isSuperAdmin: SuperAdminStatus;
  isLoading: boolean;
  error: Error | null;
  isError: boolean;
  refetch: () => Promise<UseQueryResult<UserPermissionsData, Error>>;
  canAccess: (allowedRoles?: readonly string[]) => boolean;
  hasRole: (requiredRole: string) => boolean;
  hasAnyRole: (requiredRoles: readonly string[]) => boolean;
}

export const useUserPermissionsExtended = () => {
  const supabase = createClient();
  const { user, authState } = useAuth();

  // --- QUERY: Fetch User Profile ---
  const {
    data: profile = null,
    isLoading: isQueryLoading,
    error,
    isError,
    refetch,
  } = useQuery<UserPermissionsData, Error>({
    queryKey: ['user-full-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase.rpc('get_my_user_details');

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const profileData = data[0];

      // Transform RPC result to match the view schema expected by the UI
      const transformedData = {
        ...profileData,
        id: profileData.id,
        email: profileData.email,
        address: parseJson(profileData.address) as Json,
        preferences: parseJson(profileData.preferences) as Json,
        status: profileData.status || 'inactive',
        created_at: profileData.created_at ? new Date(profileData.created_at).toISOString() : null,
        updated_at: profileData.updated_at ? new Date(profileData.updated_at).toISOString() : null,
        last_sign_in_at: profileData.last_sign_in_at
          ? new Date(profileData.last_sign_in_at).toISOString()
          : null,
        // Fill defaults for view fields not in RPC (optional UI fields)
        computed_status: null,
        account_age_days: null,
        last_activity_period: null,
        is_phone_verified: false,
        phone_confirmed_at: null,
        email_confirmed_at: null,
        auth_updated_at: null,
        raw_app_meta_data: null,
        raw_user_meta_data: null,
        full_name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim(),
      };

      return transformedData as V_user_profiles_extendedRowSchema;
    },
    // Only run if we are authenticated and have a user ID
    enabled: authState === 'authenticated' && !!user?.id,
    
    // CRITICAL: Profile data is very static. Cache it for a long time.
    // If user roles change, we update via mutation invalidation.
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours (keep in memory)
    retry: 1,
  });

  // OPTIMIZATION: Only report loading if we have NO profile and auth is still processing
  // This prevents the "Verifying permissions..." spinner from blocking UI if we have cached data
  const isLoading = isQueryLoading && !profile && authState !== 'unauthenticated';

  const permissions = React.useMemo(
    () => ({
      profile,
      role: profile?.role ?? null,
      isSuperAdmin: profile?.is_super_admin ?? null,
      isLoading,
      error: error || null,
      isError,
      refetch: refetch as unknown as () => Promise<UseQueryResult<UserPermissionsData, Error>>,
    }),
    [profile, isLoading, error, isError, refetch]
  );

  const hasRole = React.useCallback(
    (requiredRole: string) => permissions.role === requiredRole,
    [permissions.role]
  );

  const hasAnyRole = React.useCallback(
    (requiredRoles: readonly string[]) =>
      permissions.role ? requiredRoles.includes(permissions.role) : false,
    [permissions.role]
  );

  const canAccess = React.useCallback(
    (allowedRoles?: readonly string[]): boolean => {
      // If user is super admin, they have access to everything
      if (permissions.isSuperAdmin) return true;
      // If no roles specified, everyone has access
      if (!allowedRoles || allowedRoles.length === 0) return true;
      // Otherwise check against the list
      return hasAnyRole(allowedRoles);
    },
    [permissions.isSuperAdmin, hasAnyRole]
  );

  return {
    ...permissions,
    hasRole,
    hasAnyRole,
    canAccess,
    isReady: !isLoading && !permissions.error,
  };
};

export const useHasPermission = (allowedRoles?: string[]): boolean => {
  const { canAccess } = useUserPermissionsExtended();
  return React.useMemo(() => canAccess(allowedRoles), [canAccess, allowedRoles]);
};