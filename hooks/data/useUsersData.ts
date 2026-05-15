// hooks/data/useUsersData.ts
import { useMemo } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_user_profiles_extendedRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { DEFAULTS } from '@/constants/constants';

export const useUsersData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_user_profiles_extendedRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;
  const supabase = createClient();

  const {
    data: response,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-users-list', searchQuery, filters, currentPage, pageLimit],
    queryFn: async () => {
      // Use the admin RPC which returns paginated data directly
      // Note: The existing RPC `admin_get_all_users_extended` does internal pagination.
      // We pass 5000 limit to fetch "all" for client side filtering if preferred, 
      // OR use the RPC's pagination.
      
      // Let's use standard get_paged_data for consistency if possible, 
      // but users requires auth schema joins so `admin_get_all_users_extended` is specific.
      
      const { data, error } = await supabase.rpc('admin_get_all_users_extended', {
        search_query: searchQuery || undefined,
        filter_role: (filters.role as string) || undefined,
        filter_status: (filters.status as string) || undefined,
        // We will fetch large set and paginate client side for consistency with other hooks
        // or let the RPC handle it. The current UI assumes client pagination on full list for filtering flexibility.
        page_limit: 5000, 
        page_offset: 0,
      });

      if (error) throw error;
      
      // The RPC returns { data: [], counts: {...} }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any) || { data: [], counts: { total: 0 } };
    },
    staleTime: DEFAULTS.CACHE_TIME,
  });

  const processedData = useMemo(() => {
    const allUsers = (response?.data || []) as V_user_profiles_extendedRowSchema[];

    // If client-side searching is needed on top of server search:
    const filtered = allUsers;
    
    // (Optional: Additional client filtering if RPC params are insufficient)
    
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
  }, [response, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};