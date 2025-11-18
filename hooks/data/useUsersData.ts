// hooks/data/useUsersData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_user_profiles_extendedRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb, StoredUserProfiles } from '@/hooks/data/localDb'; // Import StoredUserProfiles
import { useLocalFirstQuery } from './useLocalFirstQuery';

/**
 * Implements the local-first data fetching strategy for the Users page.
 */
export const useUsersData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_user_profiles_extendedRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  const onlineQueryFn = useCallback(async (): Promise<V_user_profiles_extendedRowSchema[]> => {
    const { data, error } = await createClient().rpc("admin_get_all_users_extended", {
      search_query: searchQuery || undefined,
      filter_role: (filters.role as string) || undefined,
      filter_status: (filters.status as string) || undefined,
      page_limit: 5000,
      page_offset: 0,
    });
    if (error) throw error;
    return (data?.data || []) as V_user_profiles_extendedRowSchema[];
  }, [searchQuery, filters]);

  // This function now correctly returns a promise of our specific StoredUserProfiles type.
  const localQueryFn = useCallback(() => {
    return localDb.user_profiles.toArray();
  }, []);

  // THE FIX: We now provide three generic arguments to useLocalFirstQuery:
  // 1. The base table/view name ('user_profiles').
  // 2. The type returned by the online fetcher (`V_user_profiles_extendedRowSchema`).
  // 3. The type stored in Dexie (`StoredUserProfiles`).
  const {
    data: allUsers = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLocalFirstQuery<'user_profiles', V_user_profiles_extendedRowSchema, StoredUserProfiles>({
    queryKey: ['admin-users-data', searchQuery, filters],
    onlineQueryFn, 
    localQueryFn,
    dexieTable: localDb.user_profiles,
  });

  const processedData = useMemo(() => {
    if (!allUsers) {
      return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };
    }
    
    // Transform the local StoredUserProfiles data into the extended view format the UI expects.
    const extendedUsers = allUsers.map(user => ({
      ...user,
      full_name: `${user.first_name} ${user.last_name}`,
      email: user.id, 
      is_super_admin: false,
    })) as V_user_profiles_extendedRowSchema[];
    
    let filtered = extendedUsers;

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(lowerQuery) ||
        user.email?.toLowerCase().includes(lowerQuery)
      );
    }
    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role);
    }
    if (filters.status) {
      filtered = filtered.filter(user => user.status === filters.status);
    }
    
    const totalCount = filtered.length;
    const activeCount = filtered.filter((u) => u.status === 'active').length;
    const start = (currentPage - 1) * pageLimit;
    const end = start + pageLimit;
    const paginatedData = filtered.slice(start, end);

    return {
      data: paginatedData,
      totalCount,
      activeCount,
      inactiveCount: totalCount - activeCount,
    };
  }, [allUsers, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};