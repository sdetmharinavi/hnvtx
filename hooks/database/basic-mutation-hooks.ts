/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase-types";
import { 
  PublicTableName, 
  TableRow, 
  TableInsert, 
  TableUpdate, 
  OptimisticContext, 
  UseTableMutationOptions, 
  PagedQueryResult 
} from "./queries-type-helpers";

// Helper to check if the cache data is in Paged format
function isPagedResult<T>(data: any): data is PagedQueryResult<T> {
  return data && typeof data === 'object' && 'data' in data && Array.isArray(data.data) && 'count' in data;
}

// Generic toggle status hook
export function useToggleStatus<T extends PublicTableName>(
  supabase: SupabaseClient<Database>, 
  tableName: T, 
  options?: UseTableMutationOptions<TableRow<T>, { id: string; status: boolean; nameField?: keyof TableRow<T> }, OptimisticContext>
) {
  const queryClient = useQueryClient();
  const { invalidateQueries = true, optimisticUpdate = true, ...mutationOptions } = options || {};

  return useMutation<TableRow<T>, Error, { id: string; status: boolean; nameField?: keyof TableRow<T> }, OptimisticContext>({
    mutationFn: async ({ id, status }): Promise<TableRow<T>> => {
      const { data, error } = await supabase
        .from(tableName)
        .update({ status, updated_at: new Date().toISOString() } as any)
        .eq("id" as any, id)
        .select()
        .single();
      if (error) throw error;
      return data as TableRow<T>;
    },
    onMutate: optimisticUpdate
      ? async ({ id, status }) => {
          await queryClient.cancelQueries({ queryKey: ["table", tableName] });
          const previousData = queryClient.getQueriesData({ queryKey: ["table", tableName] });
          
          queryClient.setQueriesData({ queryKey: ["table", tableName] }, (old: any) => {
            if (!old) return old;

            const updateItem = (item: any) => 
              ("id" in item && item.id === id) 
                ? { ...item, status, updated_at: new Date().toISOString() } 
                : item;

            if (isPagedResult(old)) {
               return {
                 ...old,
                 data: old.data.map(updateItem)
               };
            } else if (Array.isArray(old)) {
               return old.map(updateItem);
            }
            return old;
          });
          
          return { previousData };
        }
      : undefined,
    onError: optimisticUpdate
      ? (err, variables, context) => {
          context?.previousData?.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
        }
      : undefined,
    onSuccess: (data, variables, context) => {
      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ["table", tableName] });
        queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
      }
    },
    ...mutationOptions,
  });
}

// Optimized insert mutation with batching
export function useTableInsert<T extends PublicTableName>(
  supabase: SupabaseClient<Database>, 
  tableName: T, 
  options?: UseTableMutationOptions<TableRow<T>[], TableInsert<T> | TableInsert<T>[], OptimisticContext>
) {
  const queryClient = useQueryClient();
  const { invalidateQueries = true, optimisticUpdate = true, batchSize = 1000, ...mutationOptions } = options || {};

  return useMutation<TableRow<T>[], Error, TableInsert<T> | TableInsert<T>[], OptimisticContext>({
    mutationFn: async (data: TableInsert<T> | TableInsert<T>[]): Promise<TableRow<T>[]> => {
      const payload = (Array.isArray(data) ? data : [data]) as any;

      if (payload.length > batchSize) {
        const batches = [];
        for (let i = 0; i < payload.length; i += batchSize) {
          batches.push(payload.slice(i, i + batchSize));
        }

        const results = await Promise.all(
          batches.map(async (batch) => {
            const { data: result, error } = await supabase.from(tableName).insert(batch).select();
            if (error) throw error;
            return result as TableRow<T>[];
          })
        );

        return results.flat();
      }

      const { data: result, error } = await supabase.from(tableName).insert(payload).select();
      if (error) throw error;
      return result as TableRow<T>[];
    },
    onMutate: optimisticUpdate
      ? async (newData) => {
          await queryClient.cancelQueries({ queryKey: ["table", tableName] });
          const previousData = queryClient.getQueriesData({ queryKey: ["table", tableName] });

          const newItems = Array.isArray(newData) ? newData : [newData];
          const optimisticItems = newItems.map((item, index) => ({
            ...item,
            id: `temp-${Date.now()}-${index}`, // Temp ID
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          queryClient.setQueriesData({ queryKey: ["table", tableName] }, (old: any) => {
            if (!old) {
                // If cache is empty, we must guess the structure. 
                // Defaulting to array is safer for 'getQueriesData' unless we know it's a paged query key.
                // However, returning just the array might break components expecting { data, count }.
                // Safe bet: if it's undefined, let the query refetch. But for optimistic, return array.
                return optimisticItems; 
            }

            if (isPagedResult(old)) {
               return {
                 ...old,
                 data: [...old.data, ...optimisticItems],
                 count: (old.count || 0) + optimisticItems.length
               };
            } else if (Array.isArray(old)) {
               return [...old, ...optimisticItems];
            }
            return old;
          });

          return { previousData };
        }
      : undefined,
    onError: optimisticUpdate
      ? (err, newData, context) => {
          context?.previousData?.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
        }
      : undefined,
    onSuccess: (data, variables, context) => {
      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ["table", tableName] });
        queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
      }
    },
    ...mutationOptions,
  });
}

// Enhanced update mutation with optimizations
export function useTableUpdate<T extends PublicTableName>(
  supabase: SupabaseClient<Database>, 
  tableName: T, 
  options?: UseTableMutationOptions<TableRow<T>[], { id: string; data: TableUpdate<T> }, OptimisticContext>
) {
  const queryClient = useQueryClient();
  const { invalidateQueries = true, optimisticUpdate = true, ...mutationOptions } = options || {};

  return useMutation<TableRow<T>[], Error, { id: string; data: TableUpdate<T> }, OptimisticContext>({
    mutationFn: async ({ id, data }: { id: string; data: TableUpdate<T> }): Promise<TableRow<T>[]> => {
      const { data: result, error } = await supabase
        .from(tableName)
        .update(data as any)
        .eq("id" as any, id)
        .select();

      if (error) throw error;
      return result as TableRow<T>[];
    },
    onMutate: optimisticUpdate
      ? async ({ id, data: newData }) => {
          await queryClient.cancelQueries({ queryKey: ["table", tableName] });
          const previousData = queryClient.getQueriesData({ queryKey: ["table", tableName] });

          const updateItem = (item: any) => 
            ("id" in item && item.id === id) 
              ? { ...item, ...newData, updated_at: new Date().toISOString() } 
              : item;

          queryClient.setQueriesData({ queryKey: ["table", tableName] }, (old: any) => {
            if (!old) return old;
            
            if (isPagedResult(old)) {
              return {
                ...old,
                data: old.data.map(updateItem)
              };
            } else if (Array.isArray(old)) {
              return old.map(updateItem);
            }
            return old;
          });

          return { previousData };
        }
      : undefined,
    onError: optimisticUpdate
      ? (err, variables, context) => {
          context?.previousData?.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
        }
      : undefined,
    onSuccess: (data, variables, context) => {
      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ["table", tableName] });
        queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
      }
    },
    ...mutationOptions,
  });
}

// Enhanced delete mutation
export function useTableDelete<T extends PublicTableName>(
  supabase: SupabaseClient<Database>, 
  tableName: T, 
  options?: UseTableMutationOptions<void, string | string[], OptimisticContext>
) {
  const queryClient = useQueryClient();
  const { invalidateQueries = true, optimisticUpdate = true, batchSize = 1000, ...mutationOptions } = options || {};

  return useMutation<void, Error, string | string[], OptimisticContext>({
    mutationFn: async (id: string | string[]): Promise<void> => {
      const ids = Array.isArray(id) ? id : [id];

      if (ids.length > batchSize) {
        const batches = [];
        for (let i = 0; i < ids.length; i += batchSize) {
          batches.push(ids.slice(i, i + batchSize));
        }

        await Promise.all(
          batches.map(async (batch) => {
            const { error } = await supabase.from(tableName).delete().in("id" as any, batch);
            if (error) throw error;
          })
        );
        return;
      }

      const { error } = await supabase.from(tableName).delete().in("id" as any, ids);
      if (error) throw error;
    },
    onMutate: optimisticUpdate
      ? async (id) => {
          await queryClient.cancelQueries({ queryKey: ["table", tableName] });
          const previousData = queryClient.getQueriesData({ queryKey: ["table", tableName] });
          
          const idsToDelete = Array.isArray(id) ? id : [id];

          queryClient.setQueriesData({ queryKey: ["table", tableName] }, (old: any) => {
            if (!old) return old;

            const filterItem = (item: any) => !idsToDelete.includes(item.id);

            if (isPagedResult(old)) {
               const newData = old.data.filter(filterItem);
               return {
                 ...old,
                 data: newData,
                 count: (old.count || 0) - (old.data.length - newData.length)
               };
            } else if (Array.isArray(old)) {
               return old.filter(filterItem);
            }
            return old;
          });

          return { previousData };
        }
      : undefined,
    onError: optimisticUpdate
      ? (err, variables, context) => {
          context?.previousData?.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
        }
      : undefined,
    onSuccess: (data, variables, context) => {
      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ["table", tableName] });
        queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
      }
    },
    ...mutationOptions,
  });
}