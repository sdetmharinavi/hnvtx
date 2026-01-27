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
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getTable } from '@/hooks/data/localDb'; // For local DB access
import { addMutationToQueue } from '@/hooks/data/useMutationQueue';
import { toast } from 'sonner';
import React from 'react';
import { FiWifiOff } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';

// Enhanced bulk operations hook with filter support
export function useTableBulkOperations<T extends PublicTableName>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  batchSize = 1000,
) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  const bulkInsert = useMutation({
    mutationFn: async (data: TableInsert<T>[]): Promise<TableRow<T>[]> => {
      // NOTE: bulkInsert logic kept online-only for now as it's rarely used directly
      // Most features use upsert or specific specialized hooks.
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
      queryClient.invalidateQueries({ queryKey: ['table', tableName] });
      queryClient.invalidateQueries({ queryKey: ['unique', tableName] });
    },
  });

  const bulkUpdate = useMutation({
    mutationFn: async (params: {
      updates: { id: string; data: TableUpdate<T> }[];
      filters?: Filters;
    }): Promise<TableRow<T>[]> => {
      // NOTE: Complex bulk update logic kept online-only for simplicity
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
      queryClient.invalidateQueries({ queryKey: ['table', tableName] });
      queryClient.invalidateQueries({ queryKey: ['unique', tableName] });
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async (params: {
      ids?: string[];
      filters?: Filters;
      deleteAll?: boolean;
    }): Promise<void> => {
      // NOTE: Delete manager hooks typically handle offline deletes better per-item
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
      queryClient.invalidateQueries({ queryKey: ['table', tableName] });
      queryClient.invalidateQueries({ queryKey: ['unique', tableName] });
    },
  });

  // --- UPDATED BULK UPSERT ---
  const bulkUpsert = useMutation({
    mutationFn: async (params: {
      data: TableInsert<T>[];
      onConflict?: string;
    }): Promise<TableRow<T>[]> => {
      const { data, onConflict } = params;

      // 1. OFFLINE LOGIC
      if (!isOnline) {
        const table = getTable(tableName);
        const now = new Date().toISOString();

        // Prepare data for local DB
        const dataWithIds = data.map((item: any) => ({
          ...item,
          id: item.id || uuidv4(), // Generate ID if missing
          created_at: item.created_at || now,
          updated_at: now,
        }));

        // Perform local upsert (put)
        await table.bulkPut(dataWithIds);

        // Queue operation for sync
        await addMutationToQueue({
          tableName,
          type: 'bulk_upsert',
          payload: {
            data: dataWithIds, // Send the pre-processed data with IDs
            onConflict,
          },
        });

        return dataWithIds as TableRow<T>[];
      }

      // 2. ONLINE LOGIC
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onSuccess: (data) => {
      if (!isOnline) {
        toast.warning(`Bulk operation queued locally. Sync pending.`, {
          icon: React.createElement(FiWifiOff),
        });
      }
      queryClient.invalidateQueries({ queryKey: ['table', tableName] });
      queryClient.invalidateQueries({ queryKey: ['unique', tableName] });
      // Invalidate potential view hooks
      queryClient.invalidateQueries({ queryKey: [`${tableName}-data`] });
      queryClient.invalidateQueries({ queryKey: [`v_${tableName}`] });
    },
  });

  return {
    bulkInsert,
    bulkUpdate,
    bulkDelete,
    bulkUpsert,
  };
}
