/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase-types";
import { TableName, TableRow, TableInsert, TableUpdate, OptimisticContext, UseTableMutationOptions } from "./queries-type-helpers";

// Generic toggle status hook
export function useToggleStatus<T extends TableName>(supabase: SupabaseClient<Database>, tableName: T, options?: UseTableMutationOptions<TableRow<T>, { id: string; status: boolean; nameField?: keyof TableRow<T> }, OptimisticContext>) {
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
          queryClient.setQueriesData({ queryKey: ["table", tableName] }, (old: TableRow<T>[] | undefined) => {
            if (!old) return [];
            return old.map((item) => ("id" in item && (item as { id: unknown }).id === id ? { ...item, status, updated_at: new Date().toISOString() } : item)) as TableRow<T>[];
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
      options?.onSuccess?.(data, variables, context);
    },
    ...mutationOptions,
  });
}

// Optimized insert mutation with batching
export function useTableInsert<T extends TableName>(supabase: SupabaseClient<Database>, tableName: T, options?: UseTableMutationOptions<TableRow<T>[], TableInsert<T> | TableInsert<T>[], OptimisticContext>) {
  const queryClient = useQueryClient();
  const { invalidateQueries = true, optimisticUpdate = false, batchSize = 1000, ...mutationOptions } = options || {};

  return useMutation<TableRow<T>[], Error, TableInsert<T> | TableInsert<T>[], OptimisticContext>({
    mutationFn: async (data: TableInsert<T> | TableInsert<T>[]): Promise<TableRow<T>[]> => {
      const payload = (Array.isArray(data) ? data : [data]) as any;

      // Batch large inserts for better performance
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

          const previousData = queryClient.getQueriesData({
            queryKey: ["table", tableName],
          });

          queryClient.setQueriesData({ queryKey: ["table", tableName] }, (old: TableRow<T>[] | undefined) => {
            if (!old) return [];
            const newItems = Array.isArray(newData) ? newData : [newData];
            return [
              ...old,
              ...newItems.map((item, index) => ({
                ...item,
                id: `temp-${Date.now()}-${index}`,
              })),
            ] as TableRow<T>[];
          });

          return { previousData };
        }
      : undefined,
    onError: optimisticUpdate
      ? (err, newData, context) => {
          if (context?.previousData) {
            context.previousData.forEach(([queryKey, data]) => {
              queryClient.setQueryData(queryKey, data);
            });
          }
        }
      : undefined,
    onSuccess: (data, variables, context) => {
      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ["table", tableName] });
        queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
      }
      options?.onSuccess?.(data, variables, context);
    },
    ...mutationOptions,
  });
}

// Enhanced update mutation with optimizations
export function useTableUpdate<T extends TableName>(supabase: SupabaseClient<Database>, tableName: T, options?: UseTableMutationOptions<TableRow<T>[], { id: string; data: TableUpdate<T> }, OptimisticContext>) {
  const queryClient = useQueryClient();
  const { invalidateQueries = true, optimisticUpdate = false, ...mutationOptions } = options || {};

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

          const previousData = queryClient.getQueriesData({
            queryKey: ["table", tableName],
          });

          queryClient.setQueriesData({ queryKey: ["table", tableName] }, (old: TableRow<T>[] | undefined) => {
            if (!old) return [];
            return old.map((item) => ("id" in item && (item as { id: unknown }).id === id ? { ...item, ...newData } : item)) as TableRow<T>[];
          });

          return { previousData };
        }
      : undefined,
    onError: optimisticUpdate
      ? (err, variables, context) => {
          if (context?.previousData) {
            context.previousData.forEach(([queryKey, data]) => {
              queryClient.setQueryData(queryKey, data);
            });
          }
        }
      : undefined,
    onSuccess: (data, variables, context) => {
      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ["table", tableName] });
        queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
      }
      options?.onSuccess?.(data, variables, context);
    },
    ...mutationOptions,
  });
}

// Enhanced delete mutation
export function useTableDelete<T extends TableName>(supabase: SupabaseClient<Database>, tableName: T, options?: UseTableMutationOptions<void, string | string[], OptimisticContext>) {
  const queryClient = useQueryClient();
  const { invalidateQueries = true, optimisticUpdate = false, batchSize = 1000, ...mutationOptions } = options || {};

  return useMutation<void, Error, string | string[], OptimisticContext>({
    mutationFn: async (id: string | string[]): Promise<void> => {
      const ids = Array.isArray(id) ? id : [id];

      // Batch large deletes for better performance
      if (ids.length > batchSize) {
        const batches = [];
        for (let i = 0; i < ids.length; i += batchSize) {
          batches.push(ids.slice(i, i + batchSize));
        }

        await Promise.all(
          batches.map(async (batch) => {
            const { error } = await supabase
              .from(tableName)
              .delete()
              .in("id" as any, batch);
            if (error) throw error;
          })
        );
        return;
      }

      const { error } = await supabase
        .from(tableName)
        .delete()
        .in("id" as any, ids);

      if (error) throw error;
    },
    onMutate: optimisticUpdate
      ? async (id) => {
          await queryClient.cancelQueries({ queryKey: ["table", tableName] });

          const previousData = queryClient.getQueriesData({
            queryKey: ["table", tableName],
          });
          const ids = Array.isArray(id) ? id : [id];

          queryClient.setQueriesData({ queryKey: ["table", tableName] }, (old: TableRow<T>[] | undefined) => {
            if (!old) return [];
            return old.filter((item) => !("id" in item) || !ids.includes((item as { id: string }).id)) as TableRow<T>[];
          });

          return { previousData };
        }
      : undefined,
    onError: optimisticUpdate
      ? (err, variables, context) => {
          if (context?.previousData) {
            context.previousData.forEach(([queryKey, data]) => {
              queryClient.setQueryData(queryKey, data);
            });
          }
        }
      : undefined,
    onSuccess: (data, variables, context) => {
      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ["table", tableName] });
        queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
      }
      options?.onSuccess?.(data, variables, context);
    },
    ...mutationOptions,
  });
}
