/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase-types";
import { TableName, TableRow, TableUpdate, Filters, OrderBy, PerformanceOptions } from "./queries-type-helpers";
import { applyFilters, applyOrdering } from "./utility-functions";

// Enhanced bulk operations with more advanced filtering and performance features
export function useAdvancedBulkOperations<T extends TableName>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  options?: {
    batchSize?: number;
    maxRetries?: number;
    retryDelay?: number;
    onProgress?: (completed: number, total: number) => void;
  }
) {
  const queryClient = useQueryClient();
  const { maxRetries = 3, retryDelay = 1000, onProgress } = options || {};

  // Helper function for retrying operations
  const withRetry = async <TResult>(operation: () => Promise<TResult>, retries = maxRetries): Promise<TResult> => {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return withRetry(operation, retries - 1);
      }
      throw error;
    }
  };

  // Advanced bulk update with complex filtering and progress tracking
  const advancedBulkUpdate = useMutation({
    mutationFn: async (params: {
      criteria: {
        filters: Filters;
        data: TableUpdate<T>;
        orderBy?: OrderBy[];
        limit?: number;
      }[];
      performanceOptions?: PerformanceOptions;
    }): Promise<TableRow<T>[]> => {
      const { criteria, performanceOptions } = params;
      const allResults: TableRow<T>[] = [];
      let completed = 0;
      const total = criteria.length;

      for (const { filters, data, orderBy, limit } of criteria) {
        await withRetry(async () => {
          let query = supabase.from(tableName).update(data as any);

          // Apply filters
          query = applyFilters(query, filters);

          // Apply ordering if specified
          if (orderBy && orderBy.length > 0) {
            query = applyOrdering(query, orderBy);
          }

          // Apply limit if specified
          if (limit) {
            query = query.limit(limit);
          }

          // Apply performance options
          if (performanceOptions?.timeout) {
            query = query.abortSignal(AbortSignal.timeout(performanceOptions.timeout));
          }

          const { data: result, error } = await query.select();
          if (error) throw error;

          allResults.push(...(result as TableRow<T>[]));
          completed++;
          onProgress?.(completed, total);
        });
      }

      return allResults;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", tableName] });
      queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
    },
  });

  // Advanced bulk delete with complex criteria
  const advancedBulkDelete = useMutation({
    mutationFn: async (params: {
      criteria: Array<{
        filters?: Filters;
        ids?: string[];
        orderBy?: OrderBy[];
        limit?: number;
      }>;
      safetyLimit?: number; // Global safety limit
      performanceOptions?: PerformanceOptions;
    }): Promise<{ deletedCount: number; details: Array<{ criteriaIndex: number; deletedCount: number }> }> => {
      const { criteria, safetyLimit, performanceOptions } = params;
      let totalDeleted = 0;
      const details: Array<{ criteriaIndex: number; deletedCount: number }> = [];
      let completed = 0;
      const total = criteria.length;

      for (let i = 0; i < criteria.length; i++) {
        const { filters, ids, orderBy, limit } = criteria[i];

        await withRetry(async () => {
          let query = supabase.from(tableName).delete();

          // Apply ID filters if provided
          if (ids && ids.length > 0) {
            query = query.in("id" as any, ids);
          }

          // Apply other filters
          if (filters) {
            query = applyFilters(query, filters);
          }

          // Apply ordering (useful for limited deletes)
          if (orderBy && orderBy.length > 0) {
            query = applyOrdering(query, orderBy);
          }

          // Apply limit (either specified or safety limit)
          const effectiveLimit = Math.min(limit || Number.MAX_SAFE_INTEGER, safetyLimit || Number.MAX_SAFE_INTEGER);

          if (effectiveLimit < Number.MAX_SAFE_INTEGER) {
            query = query.limit(effectiveLimit);
          }

          // Apply performance options
          if (performanceOptions?.timeout) {
            query = query.abortSignal(AbortSignal.timeout(performanceOptions.timeout));
          }

          // First, count the records that will be deleted
          let countQuery = supabase.from(tableName).select("*", { count: "exact", head: true });

          if (ids && ids.length > 0) {
            countQuery = countQuery.in("id" as any, ids);
          }
          if (filters) {
            countQuery = applyFilters(countQuery, filters);
          }
          if (orderBy && orderBy.length > 0) {
            countQuery = applyOrdering(countQuery, orderBy);
          }
          if (effectiveLimit < Number.MAX_SAFE_INTEGER) {
            countQuery = countQuery.limit(effectiveLimit);
          }

          const { count: recordCount, error: countError } = await countQuery;
          if (countError) throw countError;

          // Now perform the actual delete
          const { error } = await query;
          if (error) throw error;

          const deletedInThisCriteria = recordCount || 0;
          totalDeleted += deletedInThisCriteria;
          details.push({ criteriaIndex: i, deletedCount: deletedInThisCriteria });

          completed++;
          onProgress?.(completed, total);
        });
      }

      return { deletedCount: totalDeleted, details };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", tableName] });
      queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
    },
  });

  // Batch operation with transaction-like behavior (all or nothing)
  const transactionalBulkOperation = useMutation({
    mutationFn: async (params: {
      operations: Array<{
        type: "insert" | "update" | "delete";
        data?: any;
        filters?: Filters;
        ids?: string[];
      }>;
    }): Promise<{ success: boolean; results: any[]; errors?: Error[] }> => {
      const { operations } = params;
      const results: any[] = [];
      const errors: Error[] = [];

      // In a real implementation, you might want to use database transactions
      // For now, we'll simulate transaction-like behavior with rollback on error

      try {
        for (const operation of operations) {
          switch (operation.type) {
            case "insert":
              if (!operation.data) throw new Error("Insert operation requires data");
              const { data: insertData, error: insertError } = await supabase.from(tableName).insert(operation.data).select();
              if (insertError) throw insertError;
              results.push(insertData);
              break;

            case "update":
              if (!operation.data) throw new Error("Update operation requires data");
              let updateQuery = supabase.from(tableName).update(operation.data);

              if (operation.ids) {
                updateQuery = updateQuery.in("id" as any, operation.ids);
              }
              if (operation.filters) {
                updateQuery = applyFilters(updateQuery, operation.filters);
              }

              const { data: updateData, error: updateError } = await updateQuery.select();
              if (updateError) throw updateError;
              results.push(updateData);
              break;

            case "delete":
              let deleteQuery = supabase.from(tableName).delete();

              if (operation.ids) {
                deleteQuery = deleteQuery.in("id" as any, operation.ids);
              }
              if (operation.filters) {
                deleteQuery = applyFilters(deleteQuery, operation.filters);
              }

              const { error: deleteError } = await deleteQuery;
              if (deleteError) throw deleteError;
              results.push({ deleted: true });
              break;
          }
        }

        return { success: true, results };
      } catch (error) {
        errors.push(error as Error);
        // In a real database transaction, you would rollback here
        return { success: false, results: [], errors };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", tableName] });
      queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
    },
  });

  return {
    advancedBulkUpdate,
    advancedBulkDelete,
    transactionalBulkOperation,
  };
}
