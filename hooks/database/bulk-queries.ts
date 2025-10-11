/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase-types";
import { PublicTableName, TableRow, TableInsert, TableUpdate, Filters } from "./queries-type-helpers";
import { applyFilters } from "./utility-functions";

// Enhanced bulk operations hook with filter support
export function useTableBulkOperations<T extends PublicTableName>(supabase: SupabaseClient<Database>, tableName: T, batchSize = 1000) {
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
      queryClient.invalidateQueries({ queryKey: ["table", tableName] });
      queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
    },
  });

  // Enhanced bulk update with filter support
  const bulkUpdate = useMutation({
    mutationFn: async (params: {
      updates: { id: string; data: TableUpdate<T> }[];
      filters?: Filters; // Optional filters to apply to ALL updates
    }): Promise<TableRow<T>[]> => {
      const { updates, filters } = params;
      const results: TableRow<T>[] = [];

      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);

        const batchPromises = batch.map(async ({ id, data }) => {
          let query = supabase
            .from(tableName)
            .update(data as any)
            .eq("id" as any, id);

          // Apply additional filters if provided
          if (filters) {
            query = applyFilters(query, filters);
          }

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
      queryClient.invalidateQueries({ queryKey: ["table", tableName] });
      queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
    },
  });

  // Enhanced bulk delete with filter support
  const bulkDelete = useMutation({
    mutationFn: async (params: {
      ids?: string[];
      filters?: Filters; // Optional: delete by filters instead of/in addition to IDs
      deleteAll?: boolean; // Safety flag for deleting all records
    }): Promise<void> => {
      const { ids, filters, deleteAll = false } = params;

      // Safety check: require either IDs, filters, or explicit deleteAll flag
      if (!ids && !filters && !deleteAll) {
        throw new Error("Must provide either ids, filters, or set deleteAll to true");
      }

      if (ids && ids.length > 0) {
        // Delete by IDs (existing behavior, but with optional additional filters)
        for (let i = 0; i < ids.length; i += batchSize) {
          const batch = ids.slice(i, i + batchSize);
          let query = supabase
            .from(tableName)
            .delete()
            .in("id" as any, batch);

          // Apply additional filters if provided
          if (filters) {
            query = applyFilters(query, filters);
          }

          const { error } = await query;
          if (error) throw error;
        }
      } else if (filters || deleteAll) {
        // Delete by filters only
        let query = supabase.from(tableName).delete();

        if (filters) {
          query = applyFilters(query, filters);
        }

        const { error } = await query;
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", tableName] });
      queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
    },
  });

  const bulkUpsert = useMutation({
    mutationFn: async (data: TableInsert<T>[]): Promise<TableRow<T>[]> => {
      const results: TableRow<T>[] = [];
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize) as any;
        const { data: batchResult, error } = await supabase.from(tableName).upsert(batch).select();
        if (error) throw error;
        results.push(...(batchResult as TableRow<T>[]));
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", tableName] });
      queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
    },
  });

  // New: Bulk insert with conditional logic based on existing data
  const bulkInsertByFilters = useMutation({
    mutationFn: async (params: {
      data: TableInsert<T>[];
      conflictResolution?: "skip" | "update" | "error"; // How to handle conflicts
      checkFilters?: Filters; // Check if records matching these filters exist
      onConflict?: string; // Column(s) to check for conflicts (e.g., 'email' or 'email,username')
    }): Promise<TableRow<T>[]> => {
      const { data, conflictResolution = "error", checkFilters, onConflict } = params;

      if (checkFilters) {
        // Check for existing records that match the filters
        let checkQuery = supabase.from(tableName).select("id");
        checkQuery = applyFilters(checkQuery, checkFilters);

        const { data: existingRecords, error: checkError } = await checkQuery;
        if (checkError) throw checkError;

        if (existingRecords && existingRecords.length > 0) {
          switch (conflictResolution) {
            case "skip":
              return []; // Skip insertion if records exist
            case "error":
              throw new Error(`Records matching filters already exist: ${existingRecords.length} found`);
            case "update":
              // Convert to upsert operation
              const { data: upsertResult, error: upsertError } = await supabase
                .from(tableName)
                .upsert(data as any, { onConflict })
                .select();
              if (upsertError) throw upsertError;
              return upsertResult as TableRow<T>[];
          }
        }
      }

      // Proceed with normal insertion
      const results: TableRow<T>[] = [];
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize) as any;

        let insertQuery = supabase.from(tableName).insert(batch);

        // Handle conflicts at database level if onConflict is specified
        if (conflictResolution === "skip" && onConflict) {
          insertQuery = supabase.from(tableName).upsert(batch, {
            onConflict,
            ignoreDuplicates: true,
          });
        } else if (conflictResolution === "update" && onConflict) {
          insertQuery = supabase.from(tableName).upsert(batch, { onConflict });
        }

        const { data: batchResult, error } = await insertQuery.select();
        if (error) throw error;
        results.push(...(batchResult as TableRow<T>[]));
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", tableName] });
      queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
    },
  });

  // New: Bulk update by filters (update multiple records matching criteria)
  const bulkUpdateByFilters = useMutation({
    mutationFn: async (params: {
      data: TableUpdate<T>;
      filters: Filters;
      limit?: number; // Optional safety limit
    }): Promise<TableRow<T>[]> => {
      const { data, filters, limit } = params;

      let query = supabase.from(tableName).update(data as any);

      // Apply filters
      query = applyFilters(query, filters);

      // Apply limit if provided (for safety)
      if (limit) {
        query = query.limit(limit);
      }

      const { data: result, error } = await query.select();
      if (error) throw error;
      return result as TableRow<T>[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", tableName] });
      queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
    },
  });

  // New: Bulk upsert with filter-based conflict detection
  const bulkUpsertByFilters = useMutation({
    mutationFn: async (params: {
      data: TableInsert<T>[];
      onConflict?: string; // Column(s) for conflict detection
      checkFilters?: Filters; // Pre-check existing records
      updateColumns?: string[]; // Which columns to update on conflict (if not specified, updates all)
    }): Promise<TableRow<T>[]> => {
      const { data, onConflict, checkFilters, updateColumns } = params;

      // Optional: Check existing records first
      if (checkFilters) {
        try {
          // Create a new query builder
          let checkQuery = supabase.from(tableName).select("*", { count: "exact" });

          // Apply the filters
          checkQuery = applyFilters(checkQuery, checkFilters);

          // Execute the query
          const { data: existingRecords, error: checkError, count } = await checkQuery;

          if (checkError) {
            throw checkError;
          }

          console.log(`Found ${count || 0} existing records matching filters`);
        } catch (error) {
          throw error;
        }
      }

      const results: TableRow<T>[] = [];
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize) as any;

        const upsertOptions: any = {};
        if (onConflict) {
          upsertOptions.onConflict = onConflict;
        }
        if (updateColumns) {
          upsertOptions.columns = updateColumns;
        }

        const { data: batchResult, error } = await supabase.from(tableName).upsert(batch, upsertOptions).select();

        if (error) throw error;
        results.push(...(batchResult as TableRow<T>[]));
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", tableName] });
      queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
    },
  });

  // New: Conditional bulk operations (perform operation only if conditions are met)
  const conditionalBulkUpdate = useMutation({
    mutationFn: async (params: {
      updates: Array<{
        id: string;
        data: TableUpdate<T>;
        conditions?: Filters; // Conditions that must be met for this specific update
      }>;
      globalFilters?: Filters; // Filters applied to all updates
    }): Promise<TableRow<T>[]> => {
      const { updates, globalFilters } = params;
      const results: TableRow<T>[] = [];

      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);

        const batchPromises = batch.map(async ({ id, data, conditions }) => {
          let query = supabase
            .from(tableName)
            .update(data as any)
            .eq("id" as any, id);

          // Apply global filters
          if (globalFilters) {
            query = applyFilters(query, globalFilters);
          }

          // Apply individual conditions
          if (conditions) {
            query = applyFilters(query, conditions);
          }

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
      queryClient.invalidateQueries({ queryKey: ["table", tableName] });
      queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
    },
  });

  return {
    bulkInsert,
    bulkUpdate,
    bulkDelete,
    bulkUpsert,
    bulkUpdateByFilters,
    bulkInsertByFilters,
    bulkUpsertByFilters,
    conditionalBulkUpdate,
  };
}
