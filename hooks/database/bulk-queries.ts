// hooks/database/bulk-queries.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase-types';
import {
  PublicTableName,
  TableRow,
  TableInsert,
  TableUpdate,
  Filters,
} from './queries-type-helpers';
import { applyFilters } from './utility-functions';
import { invalidateRelatedCaches } from './cache-performance';

// Enhanced bulk operations hook with filter support
export function useTableBulkOperations<T extends PublicTableName>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  batchSize = 1000,
) {
  const queryClient = useQueryClient();

  const bulkInsert = useMutation({
    mutationFn: async (data: TableInsert<T>[]): Promise<TableRow<T>[]> => {
      const results: TableRow<T>[] = [];
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize) as any;
        const { data: batchResult, error } = await supabase.from(tableName).insert(batch).select();
        if (error) throw error;
        results.push(...(batchResult as TableRow<T>[]));
      }
      return results;
    },
    onSuccess: () => {
      invalidateRelatedCaches(queryClient, tableName);
    },
  });

  const bulkUpdate = useMutation({
    mutationFn: async (params: {
      updates: { id: string; data: TableUpdate<T> }[];
      filters?: Filters;
    }): Promise<TableRow<T>[]> => {
      const { updates, filters } = params;
      const results: TableRow<T>[] = [];

      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        const batchPromises = batch.map(async ({ id, data }) => {
          let query = supabase
            .from(tableName)
            .update(data as any)
            .eq('id' as any, id);
          if (filters) query = applyFilters(query, filters);
          const { data: result, error } = await query.select();
          if (error) throw error;
          return result as TableRow<T>[];
        });
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.flat());
      }
      return results;
    },
    onSuccess: () => {
      invalidateRelatedCaches(queryClient, tableName);
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async (params: {
      ids?: string[];
      filters?: Filters;
      deleteAll?: boolean;
    }): Promise<void> => {
      const { ids, filters, deleteAll = false } = params;
      if (!ids && !filters && !deleteAll) {
        throw new Error('Must provide either ids, filters, or set deleteAll to true');
      }
      if (ids && ids.length > 0) {
        for (let i = 0; i < ids.length; i += batchSize) {
          const batch = ids.slice(i, i + batchSize);
          let query = supabase
            .from(tableName)
            .delete()
            .in('id' as any, batch);
          if (filters) query = applyFilters(query, filters);
          const { error } = await query;
          if (error) throw error;
        }
      } else if (filters || deleteAll) {
        let query = supabase.from(tableName).delete();
        if (filters) query = applyFilters(query, filters);
        const { error } = await query;
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidateRelatedCaches(queryClient, tableName);
    },
  });

  const bulkUpsert = useMutation({
    mutationFn: async (params: {
      data: TableInsert<T>[];
      onConflict?: string;
    }): Promise<TableRow<T>[]> => {
      const { data, onConflict } = params;
      const results: TableRow<T>[] = [];
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize) as any;
        const query = supabase.from(tableName).upsert(batch, { onConflict });

        const { data: batchResult, error } = await query.select();
        if (error) throw error;
        results.push(...(batchResult as TableRow<T>[]));
      }
      return results;
    },
    onSuccess: () => {
      invalidateRelatedCaches(queryClient, tableName);
    },
  });

  return {
    bulkInsert,
    bulkUpdate,
    bulkDelete,
    bulkUpsert,
  };
}
