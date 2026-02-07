// hooks/useRoleFunctions.ts
'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { V_user_profiles_extendedRowSchema } from '@/schemas/zod-schemas';
import { Json } from '@/types/supabase-types';
import { createClient } from '@/utils/supabase/client';
import { localDb, StoredVUserProfilesExtended } from '@/hooks/data/localDb';
import { useLocalFirstQuery } from '@/hooks/data/useLocalFirstQuery';
import { UseQueryResult } from '@tanstack/react-query';
import { parseJson } from '@/config/helper-functions';

// ... (Types unchanged)
type UserPermissionsData = V_user_profiles_extendedRowSchema | null;

interface UserPermissions {
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

type UserRole = string | null;
type SuperAdminStatus = boolean | null;

export const useUserPermissionsExtended = () => {
  const supabase = createClient();
  const { user, authState } = useAuth();

  // 1. Online Query Function
  const onlineQueryFn = React.useCallback(async (): Promise<
    V_user_profiles_extendedRowSchema[]
  > => {
    if (!user?.id) return [];

    const { data, error } = await supabase.rpc('get_my_user_details');

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const profileData = data[0];

    // Transform RPC result
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
      // Fill defaults for view fields not in RPC
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

    return [transformedData as V_user_profiles_extendedRowSchema];
  }, [user?.id, supabase]);

  // 2. Local Query Function
  const localQueryFn = React.useCallback(async () => {
    if (!user?.id) return [];
    const profile = await localDb.v_user_profiles_extended.get(user.id);
    return profile ? [profile] : [];
  }, [user?.id]);

  // 3. Use Local First Hook
  const {
    data: profiles = [],
    isLoading: isQueryLoading,
    error,
    isError,
    refetch,
  } = useLocalFirstQuery<
    'v_user_profiles_extended',
    V_user_profiles_extendedRowSchema,
    StoredVUserProfilesExtended
  >({
    queryKey: ['user-full-profile', user?.id],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.v_user_profiles_extended,
    enabled: authState === 'authenticated' && !!user?.id,
    staleTime: 5 * 60 * 1000,
    autoSync: true,
  });

  const profile = profiles[0] || null;

  // OPTIMIZATION: Only report loading if we have NO profile and auth is still processing
  // This prevents the "Verifying permissions..." spinner from blocking UI if we have cached data
  const isLoading = isQueryLoading && !profile && authState !== 'unauthenticated';

  const permissions = React.useMemo(
    () => ({
      profile: profile as UserPermissionsData,
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
      // If we have a profile (even from cache), we can check logic
      if (permissions.isSuperAdmin) return true;
      if (!allowedRoles || allowedRoles.length === 0) return true;
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

// ... (Rest of file unchanged) ...
export const useHasPermission = (allowedRoles?: string[]): boolean => {
    const { canAccess } = useUserPermissionsExtended();
    return React.useMemo(() => canAccess(allowedRoles), [canAccess, allowedRoles]);
};
  
export type { UserRole, SuperAdminStatus, UserPermissions };