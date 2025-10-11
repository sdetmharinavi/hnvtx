// path: hooks/useRoleFunctions.ts
"use client";

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import React from 'react'
import { useAuth } from '@/hooks/useAuth'

type UserRole = string | null
type SuperAdminStatus = boolean | null

interface UserPermissions {
  role: UserRole
  isSuperAdmin: SuperAdminStatus
  isLoading: boolean
  error: Error | null
  isError: boolean
  refetch: () => void
}

// THE FIX: The individual hooks are now removed.
// useUserPermissionsExtended is the single source of truth for data fetching.

export const useUserPermissionsExtended = () => {
  const supabase = createClient()
  const { user, authState, syncSession } = useAuth()

  const { data, isLoading, error, isError, refetch } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: async (): Promise<{ role: UserRole, isSuperAdmin: SuperAdminStatus }> => {
      try {
        let [roleRes, superAdminRes] = await Promise.all([
          supabase.rpc('get_my_role'),
          supabase.rpc('is_super_admin')
        ]);
        
        // If we get null data, try refreshing the session and retry
        if (roleRes.data === null || superAdminRes.data === null) {
          const sessionRefreshed = await syncSession();
          if (sessionRefreshed) {
            [roleRes, superAdminRes] = await Promise.all([
              supabase.rpc('get_my_role'),
              supabase.rpc('is_super_admin')
            ]);
          }
        }

        if (roleRes.error) throw new Error(`Failed to get user role: ${roleRes.error.message}`);
        if (superAdminRes.error) throw new Error(`Failed to check super admin status: ${superAdminRes.error.message}`);

        return { role: roleRes.data as UserRole, isSuperAdmin: superAdminRes.data as SuperAdminStatus };
      } catch (err) {
        console.error('Permissions query error:', err);
        throw err;
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error.message.includes('JWT') || error.message.includes('auth')) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: authState === "authenticated" && !!user?.id,
    refetchOnWindowFocus: false,
  });

  const permissions = React.useMemo(() => ({
    role: data?.role ?? null,
    isSuperAdmin: data?.isSuperAdmin ?? null,
    isLoading,
    error: error || null,
    isError,
    refetch
  }), [data, isLoading, error, isError, refetch]);
  
  const hasRole = React.useCallback((requiredRole: string): boolean => {
    return permissions.role === requiredRole
  }, [permissions.role])

  const hasAnyRole = React.useCallback((requiredRoles: string[]): boolean => {
    return permissions.role ? requiredRoles.includes(permissions.role) : false
  }, [permissions.role])

  const canAccess = React.useCallback((allowedRoles?: string[]): boolean => {
    if (permissions.isSuperAdmin) return true
    if (!allowedRoles || allowedRoles.length === 0) return !!permissions.role
    return hasAnyRole(allowedRoles)
  }, [permissions.isSuperAdmin, permissions.role, hasAnyRole])

  return {
    ...permissions,
    hasRole,
    hasAnyRole,
    canAccess,
    isReady: !permissions.isLoading && !permissions.error
  }
}

export const useHasPermission = (allowedRoles?: string[]): boolean => {
  const { canAccess } = useUserPermissionsExtended()
  return React.useMemo(() => canAccess(allowedRoles), [canAccess, allowedRoles])
}

export type { UserRole, SuperAdminStatus, UserPermissions }