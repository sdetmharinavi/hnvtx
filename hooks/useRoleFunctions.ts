// hooks/database/functions.ts - Hooks for Supabase functions
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import React from 'react'
import { useAuth } from '@/hooks/useAuth'

// Types for better type safety
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

/**
 * Hook to get the current user's role with automatic session refresh if needed
 */
export const useMyRole = (): UseQueryResult<UserRole, Error> => {
  const supabase = createClient()
  const { user, authState, syncSession } = useAuth()
  
  return useQuery({
    queryKey: ['my-role', user?.id],
    queryFn: async (): Promise<UserRole> => {
      try {
        const { data, error } = await supabase.rpc('get_my_role')

        // If we get null data, try refreshing the session and retry
        if (data === null) {
          const sessionRefreshed = await syncSession()
          if (sessionRefreshed) {
            const { data: retryData, error: retryError } = await supabase.rpc('get_my_role')
            if (retryError) throw retryError
            return retryData as UserRole
          }
        }

        if (error) {
          console.error('Role fetch error:', error)
          throw new Error(`Failed to get user role: ${error.message}`)
        }
        
        return data as UserRole
      } catch (err) {
        console.error('Role query error:', err)
        throw err
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error.message.includes('JWT') || error.message.includes('auth')) {
        return false
      }
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: authState === "authenticated" && !!user?.id,
    refetchOnWindowFocus: false,
    networkMode: 'offlineFirst'
  })
}

/**
 * Hook to check if the current user is a super admin
 */
export const useIsSuperAdmin = (): UseQueryResult<SuperAdminStatus, Error> => {
  const supabase = createClient()
  const { user, authState, syncSession } = useAuth()
  
  return useQuery({
    queryKey: ['is-super-admin', user?.id],
    queryFn: async (): Promise<SuperAdminStatus> => {
      try {
        const { data, error } = await supabase.rpc('is_super_admin')

        // If we get null data, try refreshing the session and retry
        if (data === null) {
          const sessionRefreshed = await syncSession()
          if (sessionRefreshed) {
            const { data: retryData, error: retryError } = await supabase.rpc('is_super_admin')
            if (retryError) throw retryError
            return retryData as SuperAdminStatus
          }
        }
        
        if (error) {
          console.error('Super admin check error:', error)
          throw new Error(`Failed to check super admin status: ${error.message}`)
        }
        
        return data as SuperAdminStatus
      } catch (err) {
        console.error('Super admin query error:', err)
        throw err
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: (failureCount, error) => {
      if (error.message.includes('JWT') || error.message.includes('auth')) {
        return false
      }
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: authState === "authenticated" && !!user?.id,
    refetchOnWindowFocus: false,
    networkMode: 'offlineFirst'
  })
}

/**
 * Combined hook that returns both role and super admin status
 * with optimized refetching and error handling
 */
export const useUserPermissions = (): UserPermissions => {
  const roleQuery = useMyRole()
  const superAdminQuery = useIsSuperAdmin()
  
  const refetch = React.useCallback(() => {
    return Promise.allSettled([
      roleQuery.refetch(),
      superAdminQuery.refetch()
    ])
  }, [roleQuery, superAdminQuery])
  
  return {
    role: roleQuery.data ?? null,
    isSuperAdmin: superAdminQuery.data ?? null,
    isLoading: roleQuery.isLoading || superAdminQuery.isLoading,
    error: roleQuery.error || superAdminQuery.error || null,
    isError: roleQuery.isError || superAdminQuery.isError,
    refetch
  }
}

/**
 * Extended version of user permissions with utility methods
 */
export const useUserPermissionsExtended = () => {
  const permissions = useUserPermissions()
  
  const hasRole = React.useCallback((requiredRole: string): boolean => {
    return permissions.role === requiredRole
  }, [permissions.role])
  
  const hasAnyRole = React.useCallback((requiredRoles: string[]): boolean => {
    return permissions.role ? requiredRoles.includes(permissions.role) : false
  }, [permissions.role])
  
  const canAccess = React.useCallback((allowedRoles?: string[]): boolean => {
    // Super admin can access everything
    if (permissions.isSuperAdmin) return true
    
    // If no roles specified, just check if authenticated
    if (!allowedRoles || allowedRoles.length === 0) return !!permissions.role
    
    // Check if user has required role
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

/**
 * Optimized hook for role-based conditional rendering
 * Uses memoization to prevent unnecessary re-renders
 */
export const useHasPermission = (allowedRoles?: string[]): boolean => {
  const { canAccess } = useUserPermissionsExtended()
  return React.useMemo(() => canAccess(allowedRoles), [canAccess, allowedRoles])
}

// Export types for use in other files
export type { UserRole, SuperAdminStatus, UserPermissions }