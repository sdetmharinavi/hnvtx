// hooks/data/useUsersData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_user_profiles_extendedRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb, StoredVUserProfilesExtended } from '@/hooks/data/localDb'; // THE FIX: Import StoredVUserProfilesExtended
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

  // THE FIX: The local query now fetches from the complete view data.
  const localQueryFn = useCallback(() => {
    return localDb.v_user_profiles_extended.toArray();
  }, []);
  
  const {
    data: allUsers = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLocalFirstQuery<'v_user_profiles_extended', V_user_profiles_extendedRowSchema, StoredVUserProfilesExtended>({
    queryKey: ['admin-users-data', searchQuery, filters],
    onlineQueryFn, 
    localQueryFn,
    // THE FIX: Point to the new, correctly typed Dexie table.
    dexieTable: localDb.v_user_profiles_extended,
  });

  const processedData = useMemo(() => {
    if (!allUsers) {
      return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };
    }
    
    // THE FIX: Remove the manual data reconstruction. The view data is already complete.
    let filtered = allUsers as V_user_profiles_extendedRowSchema[];

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