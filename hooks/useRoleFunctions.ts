// path: hooks/useRoleFunctions.ts
'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { v_user_profiles_extendedRowSchema } from '@/schemas/zod-schemas';
import { z } from 'zod';
import { Json } from '@/types/supabase-types';

type UserPermissionsData = z.infer<typeof v_user_profiles_extendedRowSchema> | null;

interface UserPermissions {
  profile: UserPermissionsData;
  role: UserRole;
  isSuperAdmin: SuperAdminStatus;
  isLoading: boolean;
  error: Error | null;
  isError: boolean;
  refetch: () => Promise<UseQueryResult<UserPermissionsData, Error>>;
}

type UserRole = string | null;
type SuperAdminStatus = boolean | null;

// Helper function to safely parse JSON strings
const safeJsonParse = (jsonString: unknown): Json | null => {
  if (typeof jsonString === 'object' && jsonString !== null) return jsonString as Json;
  if (typeof jsonString !== 'string') return null;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.log(e);

    return null;
  }
};

export const useUserPermissionsExtended = () => {
  const supabase = createClient();
  const { user, authState } = useAuth();

  const { data, isLoading, error, isError, refetch } = useQuery({
    queryKey: ['user-full-profile', user?.id],
    queryFn: async (): Promise<UserPermissionsData> => {
      if (!user?.id) return null;

      const { data, error } = await supabase.rpc('get_my_user_details');

      if (error) {
        console.error('Error fetching full user profile via RPC:', error);
        throw new Error(error.message);
      }

      if (!data || data.length === 0) {
        return null;
      }

      const profileData = data[0];

      // THE DEFINITIVE FIX: Robustly handle data transformation from the RPC result.
      const transformedData = {
        ...profileData,
        id: profileData.id,
        email: profileData.email,
        address: safeJsonParse(profileData.address), // Safely parse address
        preferences: safeJsonParse(profileData.preferences), // Safely parse preferences
        status: profileData.status || 'inactive', // Provide a default for status
        // Ensure timestamps are valid ISO strings or null
        created_at: profileData.created_at ? new Date(profileData.created_at).toISOString() : null,
        updated_at: profileData.updated_at ? new Date(profileData.updated_at).toISOString() : null,
        last_sign_in_at: profileData.last_sign_in_at
          ? new Date(profileData.last_sign_in_at).toISOString()
          : null,
        // Fill in missing fields from the view with defaults or nulls
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

      const parsed = v_user_profiles_extendedRowSchema.safeParse(transformedData);
      if (!parsed.success) {
        console.error(
          'Zod validation failed for transformed user profile:',
          parsed.error.flatten()
        );
        throw new Error('Received invalid user profile data from server RPC.');
      }
      return parsed.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: authState === 'authenticated' && !!user?.id,
    refetchOnWindowFocus: true,
  });

  const permissions = React.useMemo(
    () => ({
      profile: data ?? null,
      role: data?.role ?? null,
      isSuperAdmin: data?.is_super_admin ?? null,
      isLoading,
      error: error || null,
      isError,
      refetch: refetch as () => Promise<UseQueryResult<UserPermissionsData, Error>>,
    }),
    [data, isLoading, error, isError, refetch]
  );

  const hasRole = React.useCallback(
    (requiredRole: string): boolean => {
      return permissions.role === requiredRole;
    },
    [permissions.role]
  );

  const hasAnyRole = React.useCallback(
    (requiredRoles: string[]): boolean => {
      return permissions.role ? requiredRoles.includes(permissions.role) : false;
    },
    [permissions.role]
  );

  const canAccess = React.useCallback(
    (allowedRoles?: string[]): boolean => {
      if (permissions.isSuperAdmin) return true;
      if (!allowedRoles || allowedRoles.length === 0) return true;
      return hasAnyRole(allowedRoles);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [permissions.isSuperAdmin, permissions.role, hasAnyRole]
  );

  return {
    ...permissions,
    hasRole,
    hasAnyRole,
    canAccess,
    isReady: !permissions.isLoading && !permissions.error,
  };
};

export const useHasPermission = (allowedRoles?: string[]): boolean => {
  const { canAccess } = useUserPermissionsExtended();
  return React.useMemo(() => canAccess(allowedRoles), [canAccess, allowedRoles]);
};

export type { UserRole, SuperAdminStatus, UserPermissions };
