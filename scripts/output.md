<!-- path: hooks/database/bulk-queries.ts -->
```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase-types";
import { TableName, TableRow, TableInsert, TableUpdate, Filters, OrderBy, PerformanceOptions } from "./queries-type-helpers";
import { applyFilters } from "./utility-functions";

// Enhanced bulk operations hook with filter support
export function useTableBulkOperations<T extends TableName>(supabase: SupabaseClient<Database>, tableName: T, batchSize = 1000) {
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

```

<!-- path: hooks/database/path-queries.ts -->
```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useTableQuery } from "./core-queries";
import { useMemo } from "react";
import { Row } from "./queries-type-helpers";
import { FiberTraceNode } from "@/components/route-manager/types"; // Import the correct type
import { toast } from "sonner";

const supabase = createClient();

/**
 * Fetches the detailed, ordered path segments for a given logical path
 * by calling the secure RPC function.
 */
export function useSystemPath(logicalPathId: string | null) {
  return useQuery({
    queryKey: ['system-path-details', logicalPathId],
    queryFn: async () => {
      if (!logicalPathId) return [];
      const { data, error } = await supabase
        .rpc('get_system_path_details', {
          p_path_id: logicalPathId
        });
      if (error) throw error;
      return data;
    },
    enabled: !!logicalPathId,
  });
}

/**
 * Fetches available OFC cables that can be connected as the next segment in a path.
 */
export interface CableWithNodes {
  id: string;
  route_name: string;
  sn: { name: string } | null;
  en: { name: string } | null;
}

export function useAvailablePathSegments(
  sourceNodeId: string | null,
  pathSegments: Row<'v_system_ring_paths_detailed'>[] = []
) {
  const lastSegment = pathSegments?.[pathSegments.length - 1];

  const lastNodeId = useMemo(() => {
    if (!lastSegment) return sourceNodeId;
    return lastSegment.end_node_id;
  }, [lastSegment, sourceNodeId]);

  const existingCableIds = useMemo(() => pathSegments.map(p => p.ofc_cable_id).filter(Boolean), [pathSegments]);

  return useTableQuery<'ofc_cables', CableWithNodes[]>(supabase, 'ofc_cables', {
    columns: '*, sn:sn_id(name), en:en_id(name)',
    filters: {
      $or: `sn_id.eq.${lastNodeId},en_id.eq.${lastNodeId}`,
      ...(existingCableIds.length > 0 && { id: { operator: 'not.in', value: `(${existingCableIds.join(',')})` } }),
    },
    enabled: !!lastNodeId,
  });
}

/**
 * Fetches the list of continuously available fiber numbers for a given path.
 */
export function useAvailableFibers(pathId: string | null) {
  return useQuery({
    queryKey: ['available-fibers', pathId],
    queryFn: async () => {
      if (!pathId) return [];

      const { data, error } = await supabase.rpc('get_continuous_available_fibers', {
        p_path_id: pathId
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!pathId,
  });
}

/**
 * NEW: Hook to trace a fiber's complete path using the recursive RPC function.
 */
export function useFiberTrace(cableId: string | null, fiberNo: number | null) {
  return useQuery({
    queryKey: ['fiber-trace', cableId, fiberNo],
    queryFn: async (): Promise<FiberTraceNode | null> => {
      if (!cableId || !fiberNo) return null;

      const { data, error } = await supabase.rpc('trace_fiber_path', {
        p_start_cable_id: cableId,
        p_start_fiber_no: fiberNo
      });

      if (error) {
        toast.error(`Trace failed: ${error.message}`);
        throw error;
      }

      // The RPC returns a flat list; we need to build the tree structure.
      if (!data || data.length === 0) return null;

      const nodesMap = new Map<string, FiberTraceNode>();
      let rootNode: FiberTraceNode | null = null;

      // First pass: create all nodes
      data.forEach(item => {
        if (item.path_type === 'NODE' || item.path_type === 'JC') {
            const node: FiberTraceNode = {
                type: item.path_type as 'NODE' | 'JC',
                id: item.element_id,
                name: item.element_name,
                children: []
            };
            nodesMap.set(item.element_id, node);
            if (item.segment_order === 1) {
                rootNode = node;
            }
        }
      });

      // Second pass: link children
      let currentParent: FiberTraceNode | undefined;
      for (let i = 0; i < data.length; i++) {
        const item = data[i];

        if (item.path_type === 'NODE' || item.path_type === 'JC') {
            currentParent = nodesMap.get(item.element_id);
        } else if (item.path_type === 'CABLE' && currentParent) {
            const nextItem = data[i + 1];
            const downstreamNode = nextItem ? nodesMap.get(nextItem.element_id) : null;
            
            currentParent.children.push({
                cable: {
                    id: item.element_id,
                    name: item.element_name,
                    distance_km: item.distance_km,
                    is_otdr: false, // You can enhance the RPC to return this if needed
                    fiber_no: item.fiber_no,
                },
                downstreamNode: downstreamNode || null
            });
        }
      }
      
      return rootNode;
    },
    enabled: !!cableId && !!fiberNo,
  });
}
```

<!-- path: hooks/database/basic-mutation-hooks.ts -->
```typescript
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

```

<!-- path: hooks/database/file-queries.ts -->
```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { Database } from "@/types/supabase-types";

type FileRecord = Database["public"]["Tables"]["files"]["Row"];
type FileInsert = Database["public"]["Tables"]["files"]["Insert"];
type FileUpdate = Database["public"]["Tables"]["files"]["Update"];

export function useFiles(folderId?: string | null) {
  const supabase = createClient();
  
  return useQuery({
    queryKey: ["files", folderId],
    queryFn: async () => {
      let query = supabase
        .from("files")
        .select("*");
      
      if (folderId) {
        query = query.eq("folder_id", folderId);
      }
      
      const { data, error } = await query.order("uploaded_at", { ascending: false });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data || [];
    },
    enabled: true,
  });
}

export function useUploadFile() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (fileData: FileInsert) => {
      const { data, error } = await supabase
        .from("files")
        .insert(fileData)
        .select()
        .single();
        
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["files", variables.folder_id] 
      });
    },
  });
}

export function useDeleteFile() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      id,
      folderId,
    }: {
      id: string;
      folderId?: string | null;
    }) => {
      const { error } = await supabase
        .from("files")
        .delete()
        .eq("id", id);
        
      if (error) {
        throw new Error(error.message);
      }
      
      return { id };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["files", variables.folderId] 
      });
    },
  });
}

export function useUpdateFile() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: FileUpdate;
    }) => {
      const { data, error } = await supabase
        .from("files")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
        
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["files", data.folder_id] 
      });
    },
  });
}

```

<!-- path: hooks/database/utility-functions.ts -->
```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryKey } from '@tanstack/react-query';
import {
  AggregationOptions,
  DeduplicationOptions,
  EnhancedOrderBy,
  FilterOperator,
  Filters,
  OrderBy,
  PerformanceOptions,
} from './queries-type-helpers';
import { Json } from '@/types/supabase-types';

// --- UTILITY FUNCTIONS ---
export const createQueryKey = (
  tableName: string,
  filters?: Filters,
  columns?: string,
  orderBy?: OrderBy[],
  enhancedOrderBy?: EnhancedOrderBy[], // Fixed: renamed from EnhancedOrderBy to enhancedOrderBy
  deduplication?: DeduplicationOptions | undefined,
  aggregation?: AggregationOptions,
  limit?: number,
  offset?: number
): QueryKey => {
  const key: unknown[] = ['table', tableName];
  const params: Record<string, unknown> = {
    filters,
    columns,
    orderBy,
    enhancedOrderBy, // Fixed: use correct parameter name
    deduplication,
    aggregation,
    limit,
    offset,
  };
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null
    )
  );
  if (Object.keys(cleanParams).length > 0) key.push(cleanParams);
  return key;
};

export const createRpcQueryKey = (
  functionName: string,
  args?: Record<string, unknown>,
  performance?: PerformanceOptions
): QueryKey => {
  const key: unknown[] = ['rpc', functionName];
  const params = { args, performance };
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null
    )
  );
  if (Object.keys(cleanParams).length > 0) key.push(cleanParams);
  return key;
};

export const createUniqueValuesKey = (
  tableName: string,
  column: string,
  filters?: Filters,
  orderBy?: OrderBy[],
  enhancedOrderBy?: EnhancedOrderBy[] // Fixed: added missing parameter and use correct naming
): QueryKey => [
  'unique',
  tableName,
  column,
  { filters, orderBy, enhancedOrderBy }, // Fixed: include enhancedOrderBy in the key
];

export function applyFilters(query: any, filters: Filters): any {
  let modifiedQuery = query;
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (key === '$or' || key === 'or') {
      if (typeof value === 'string') {
        modifiedQuery = modifiedQuery.or(value);
      } else {
        console.warn('Unsupported $or filter format; expected a raw string.');
      }
      return;
    }

    if (
      typeof value === 'object' &&
      !Array.isArray(value) &&
      'operator' in value
    ) {
      const { operator, value: filterValue } = value as {
        operator: FilterOperator;
        value: unknown;
      };

      if (
        operator in modifiedQuery &&
        typeof (modifiedQuery as any)[operator] === 'function'
      ) {
        modifiedQuery = modifiedQuery[operator](key, filterValue);
      } else {
        console.warn(`Unsupported or dynamic operator used: ${operator}`);
      }
    } else if (Array.isArray(value)) {
      modifiedQuery = modifiedQuery.in(key, value);
    } else {
      modifiedQuery = modifiedQuery.eq(key, value);
    }
  });
  return modifiedQuery;
}

// Enhanced version with better type safety and validation
export function applyOrdering(query: any, orderBy: OrderBy[]): any {
  let modifiedQuery = query;

  orderBy.forEach(({ column, ascending = true, nullsFirst, foreignTable }) => {
    // Validate column name to prevent injection
    if (!column || typeof column !== 'string') {
      console.warn(`Invalid column name: ${column}`);
      return;
    }

    // Build the column reference
    const orderColumn = foreignTable ? `${foreignTable}.${column}` : column;

    // Build options object
    const options: { ascending: boolean; nullsFirst?: boolean } = { ascending };
    if (nullsFirst !== undefined) {
      options.nullsFirst = nullsFirst;
    }

    try {
      modifiedQuery = modifiedQuery.order(orderColumn, options);
    } catch (error) {
      console.error(`Error applying order by ${orderColumn}:`, error);
      // Continue with other orderings even if one fails
    }
  });

  return modifiedQuery;
}

// Alternative version with more explicit type handling for EnhancedOrderBy
export function applyEnhancedOrdering(
  query: any,
  orderBy: EnhancedOrderBy[]
): any {
  let modifiedQuery = query;

  orderBy.forEach(
    ({ column, ascending = true, nullsFirst, foreignTable, dataType }) => {
      // Validate column name to prevent injection
      if (!column || typeof column !== 'string') {
        console.warn(`Invalid column name: ${column}`);
        return;
      }

      const orderColumn = foreignTable ? `${foreignTable}.${column}` : column;

      const options: any = { ascending };
      if (nullsFirst !== undefined) {
        options.nullsFirst = nullsFirst;
      }

      // Optional: Add type-specific handling
      if (dataType) {
        switch (dataType) {
          case 'numeric':
            // Supabase handles numeric sorting automatically
            break;
          case 'text':
            // For case-insensitive text sorting, you'd need custom SQL
            // This is handled at the PostgreSQL level
            break;
          case 'date':
          case 'timestamp':
            // Date sorting is handled well by default
            break;
          default:
            break;
        }
      }

      try {
        modifiedQuery = modifiedQuery.order(orderColumn, options);
      } catch (error) {
        console.error(
          `Error applying enhanced order by ${orderColumn}:`,
          error
        );
      }
    }
  );

  return modifiedQuery;
}

export function buildDeduplicationQuery(
  tableName: string,
  deduplication: DeduplicationOptions,
  filters?: Filters,
  orderBy?: OrderBy[]
): string {
  const { columns, orderBy: dedupOrderBy } = deduplication;
  const partitionBy = columns.join(', ');
  const rowNumberOrder = dedupOrderBy?.length
    ? dedupOrderBy
        .map((o) => `${o.column} ${o.ascending !== false ? 'ASC' : 'DESC'}`)
        .join(', ')
    : 'id ASC';

  let finalOrderClause = '';
  if (orderBy && orderBy.length > 0) {
    const orderParts = orderBy.map(
      (o) =>
        `${o.column} ${o.ascending !== false ? 'ASC' : 'DESC'}${
          o.nullsFirst !== undefined
            ? o.nullsFirst
              ? ' NULLS FIRST'
              : ' NULLS LAST'
            : ''
        }`
    );
    finalOrderClause = `ORDER BY ${orderParts.join(', ')}`;
  }

  let whereClause = '';
  if (filters && Object.keys(filters).length > 0) {
    const conditions = Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        if (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          'operator' in value
        ) {
          const filterValue =
            typeof value.value === 'string'
              ? `'${value.value.toString().replace(/'/g, "''")}'`
              : value.value;
          return `${key} = ${filterValue}`;
        }
        if (Array.isArray(value)) {
          const arrayValues = value
            .map((v) =>
              typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v
            )
            .join(',');
          return `${key} IN (${arrayValues})`;
        }
        const filterValue =
          typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value;
        return `${key} = ${filterValue}`;
      });

    if (conditions.length > 0)
      whereClause = `WHERE ${conditions.join(' AND ')}`;
  }

  return `
    WITH deduplicated AS (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY ${partitionBy} ORDER BY ${rowNumberOrder}) as rn
      FROM ${tableName}
      ${whereClause}
    )
    SELECT * FROM deduplicated WHERE rn = 1 ${finalOrderClause}
  `;
}

/**
 * Converts a rich "Filters" object (used by the PostgREST query builder)
 * into a simple key-value JSON object suitable for RPC functions.
 * It strips out complex operators and preserves simple values.
 *
 * @param filters The rich Filters object.
 * @returns A Json-compatible object.
 */
export function convertRichFiltersToSimpleJson(filters: Filters): Json {
  const simpleFilters: { [key: string]: Json | undefined } = {};

  for (const key in filters) {
    // Skip the client-side only '$or' operator
    if (key === '$or') {
      continue;
    }

    const filterValue = filters[key];

    // Check if the value is a simple primitive (string, number, boolean, or null)
    if (
      typeof filterValue === 'string' ||
      typeof filterValue === 'number' ||
      typeof filterValue === 'boolean' ||
      filterValue === null
    ) {
      simpleFilters[key] = filterValue;
    }
    // You can also handle simple arrays if your RPCs support the 'IN' operator
    else if (Array.isArray(filterValue)) {
      simpleFilters[key] = filterValue;
    }
    // We explicitly IGNORE complex objects like { operator: 'neq', value: '...' }
    // because the RPC function doesn't know how to handle them.
  }

  return simpleFilters;
}

```

<!-- path: hooks/database/route-manager-hooks.ts -->
```typescript
// path: hooks/database/route-manager-hooks.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { JunctionClosure, RouteDetailsPayload, OfcForSelection, JcSplicingDetails, AutoSpliceResult } from '@/components/route-manager/types';
import { toast } from 'sonner';

const supabase = createClient();

/** Fetches a list of all OFC cables for the selection dropdown. */
export function useOfcRoutesForSelection() {
  return useQuery({
    queryKey: ['ofc-routes-for-selection'],
    queryFn: async (): Promise<OfcForSelection[]> => {
      const { data, error } = await supabase
        .from('ofc_cables')
        .select('id, route_name, capacity')
        .order('route_name');
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetches detailed info for a single OFC Cable, including its JCs. */
export function useRouteDetails(routeId: string | null) {
  return useQuery({
    queryKey: ['route-details', routeId],
    queryFn: async (): Promise<RouteDetailsPayload | null> => {
      if (!routeId) return null;
      // Fetch from the complete view which already has the node names
      const { data: routeData, error: routeError } = await supabase.from('v_ofc_cables_complete').select('*').eq('id', routeId).single();
      if (routeError) throw routeError;
      if (!routeData) return null;

      const { data: jcData, error: jcError } = await supabase.from('junction_closures').select('*').eq('ofc_cable_id', routeId).order('position_km');
      if (jcError) throw jcError;

      // Type-safe mapping from the view row to the payload structure
      const route: RouteDetailsPayload['route'] = {
          id: routeData.id!,
          route_name: routeData.route_name!,
          start_node: { id: routeData.sn_id!, name: routeData.sn_name || 'Unknown SN' },
          end_node: { id: routeData.en_id!, name: routeData.en_name || 'Unknown EN' },
          capacity: routeData.capacity!,
          current_rkm: routeData.current_rkm,
      };

      return { route, junction_closures: jcData as JunctionClosure[] };
    },
    enabled: !!routeId,
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetches only the relevant cables that can be spliced at a given JC. */
export function useCablesForJc(jcId: string | null) {
  return useQuery({
    queryKey: ['cables-for-jc', jcId],
    queryFn: async (): Promise<OfcForSelection[]> => {
      if (!jcId) return [];
      const { data, error } = await supabase.rpc('get_cables_at_jc', { p_jc_id: jcId });
      if (error) throw error;
      return (data as OfcForSelection[]) || [];
    },
    enabled: !!jcId,
  });
}


/** Fetches all data needed for the splice matrix editor for a single JC. */
export function useJcSplicingDetails(jcId: string | null) {
  return useQuery({
    queryKey: ['jc-splicing-details', jcId],
    queryFn: async (): Promise<JcSplicingDetails | null> => {
      if (!jcId) return null;
      const { data, error } = await supabase.rpc('get_jc_splicing_details', { p_jc_id: jcId });
      if (error) throw error;
      return data as JcSplicingDetails;
    },
    enabled: !!jcId,
  });
}

/** Hook to delete a Junction Closure. */
export function useDeleteJc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jcId: string) => {
      const { error } = await supabase.from('junction_closures').delete().eq('id', jcId);
      if (error) throw error;
    },
    onSuccess: (_, jcId) => {
      toast.success("Junction Closure deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ['route-details'] });
      queryClient.invalidateQueries({ queryKey: ['jc-splicing-details', jcId] });
    },
    onError: (error) => toast.error(`Failed to delete JC: ${error.message}`),
  });
}

/** Hook to call the `manage_splice` RPC function. */
export function useManageSplice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: {
      action: 'create' | 'delete' | 'update_otdr';
      jcId: string;
      spliceId?: string;
      incomingCableId?: string;
      incomingFiberNo?: number;
      outgoingCableId?: string;
      outgoingFiberNo?: number;
      spliceType?: 'pass_through' | 'branch' | 'termination';
      otdrLengthKm?: number;
    }) => {
      const { data, error } = await supabase.rpc('manage_splice', {
        p_action: variables.action, p_jc_id: variables.jcId, p_splice_id: variables.spliceId,
        p_incoming_cable_id: variables.incomingCableId, p_incoming_fiber_no: variables.incomingFiberNo,
        p_outgoing_cable_id: variables.outgoingCableId, p_outgoing_fiber_no: variables.outgoingFiberNo,
        p_splice_type: variables.spliceType, p_otdr_length_km: variables.otdrLengthKm
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: ['jc-splicing-details', variables.jcId] }),
  });
}

/** Hook to call the `auto_splice_straight` RPC function. */
export function useAutoSplice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: { jcId: string; cable1Id: string; cable2Id: string; }) => {
      const { data, error } = await supabase.rpc('auto_splice_straight', { p_jc_id: variables.jcId, p_cable1_id: variables.cable1Id, p_cable2_id: variables.cable2Id });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: unknown, variables) => {
      const result = data as AutoSpliceResult; // Type assertion
      const count = result?.splices_created || 0;
      toast.success(`${count} straight splices created successfully!`);
      queryClient.invalidateQueries({ queryKey: ['jc-splicing-details', variables.jcId] });
    },
    onError: (error) => toast.error(`Auto-splice failed: ${error.message}`),
  });
}
```

<!-- path: hooks/database/advanced-bulk-queries.ts -->
```typescript
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

```

<!-- path: hooks/database/core-queries.ts -->
```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useQuery,
  useInfiniteQuery,
  InfiniteData,
} from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Json } from '@/types/supabase-types';
import {
  TableOrViewName,
  TableName,
  Row,
  RowWithCount,
  DeduplicationOptions,
  InfiniteQueryPage,
  UseTableQueryOptions,
  UseTableInfiniteQueryOptions,
  UseTableRecordOptions,
  UseUniqueValuesOptions,
} from './queries-type-helpers';
import {
  applyFilters,
  applyOrdering,
  buildDeduplicationQuery,
  createQueryKey,
  createUniqueValuesKey,
} from './utility-functions';

// Generic table query hook with enhanced features
export function useTableQuery<
  T extends TableOrViewName,
  TData = RowWithCount<Row<T>>[]
>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  options?: UseTableQueryOptions<T, TData>
) {
  const {
    columns = '*',
    filters,
    orderBy,
    limit,
    offset,
    deduplication,
    aggregation,
    performance,
    includeCount = false,
    ...queryOptions
  } = options || {};

  type QueryFnData = RowWithCount<Row<T>>[];

  return useQuery({
    queryKey: createQueryKey(
      tableName,
      filters,
      columns,
      orderBy,
      undefined,
      deduplication,
      aggregation,
      limit,
      offset
    ),
    queryFn: async (): Promise<QueryFnData> => {
      if (deduplication) {
        const sql = buildDeduplicationQuery(
          tableName as string,
          deduplication,
          filters,
          orderBy
        );
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          'execute_sql',
          { sql_query: sql }
        );
        if (rpcError) throw rpcError;
        if (rpcData && (rpcData as any).error)
          throw new Error(`Database RPC Error: ${(rpcData as any).error}`);
        return (rpcData as any)?.result || [];
      }

      if (aggregation) {
        const { data, error } = await supabase.rpc('aggregate_query', {
          table_name: tableName,
          aggregation_options: aggregation as unknown as Json,
          filters: (filters || {}) as unknown as Json,
          order_by: (orderBy || []) as unknown as Json,
        });
        if (error) throw error;
        return (data as any)?.result || [];
      }

      // When includeCount is requested, use Supabase's metadata count to support relation selects.
      // We then project the count back onto each row as `total_count` for backward compatibility.
      let query = includeCount
        ? supabase
            .from(tableName as any)
            .select(columns as string, { count: 'exact' })
        : supabase.from(tableName as any).select(columns as string);

      if (filters) query = applyFilters(query, filters);
      if (orderBy?.length) query = applyOrdering(query, orderBy);
      if (limit !== undefined) query = query.limit(limit);
      if (offset !== undefined)
        query = query.range(offset, offset + (limit || 1000) - 1);
      if (performance?.timeout)
        query = query.abortSignal(AbortSignal.timeout(performance.timeout));

      const { data, error, count } = (await query) as any;
      if (error) throw error;
      const rows = (data as unknown as Row<T>[]) || [];
      if (!includeCount) return rows as unknown as QueryFnData;
      const total = typeof count === 'number' ? count : 0;
      // Attach total_count to each row to emulate window-count behavior
      const withCount = rows.map((r) => ({
        ...(r as any),
        total_count: total,
      }));
      return withCount as unknown as QueryFnData;
    },
    ...queryOptions,
  });
}

// Infinite scroll query hook for large datasets
export function useTableInfiniteQuery<
  T extends TableOrViewName,
  TData = InfiniteData<InfiniteQueryPage<T>>
>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  options?: UseTableInfiniteQueryOptions<T, TData>
) {
  const {
    columns = '*',
    filters,
    orderBy,
    pageSize = 20,
    performance,
    ...queryOptions
  } = options || {};

  return useInfiniteQuery({
    queryKey: createQueryKey(
      tableName,
      filters,
      columns,
      orderBy,
      undefined,
      undefined,
      undefined,
      pageSize
    ),
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from(tableName as any)
        .select(columns, { count: 'exact' });

      if (filters) query = applyFilters(query, filters);
      if (orderBy?.length) query = applyOrdering(query, orderBy);

      const startIdx = pageParam * pageSize;
      query = query.range(startIdx, startIdx + pageSize - 1);

      if (performance?.timeout)
        query = query.abortSignal(AbortSignal.timeout(performance.timeout));

      const { data, error, count } = await query;
      if (error) throw error;

      const results = (data as unknown as Row<T>[]) || [];

      return {
        data: results,
        nextCursor: results.length === pageSize ? pageParam + 1 : undefined,
        count: count ?? 0,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    ...queryOptions,
  });
}

// Generic single record query hook (optimized)
export function useTableRecord<
  T extends TableOrViewName,
  TData = Row<T> | null
>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  id: string | null,
  options?: UseTableRecordOptions<T, TData>
) {
  const { columns = '*', performance, ...queryOptions } = options || {};

  return useQuery({
    queryKey: createQueryKey(tableName, { id: id as any }, columns),
    queryFn: async (): Promise<Row<T> | null> => {
      if (!id) return null;

      let query = supabase
        .from(tableName as any)
        .select(columns)
        .eq('id', id);

      if (performance?.timeout)
        query = query.abortSignal(AbortSignal.timeout(performance.timeout));

      const { data, error } = await query.maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found, which is a valid null result
        throw error;
      }
      return (data as unknown as Row<T>) || null;
    },
    enabled: !!id && (queryOptions?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
    ...queryOptions,
  });
}

// Get unique values for a specific column
export function useUniqueValues<T extends TableOrViewName, TData = unknown[]>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  column: string,
  options?: UseUniqueValuesOptions<T, TData>
) {
  const { filters, orderBy, limit, ...queryOptions } = options || {};

  return useQuery({
    queryKey: createUniqueValuesKey(tableName, column, filters, orderBy),
    queryFn: async (): Promise<unknown[]> => {
      const { data, error } = await supabase.rpc('get_unique_values', {
        table_name: tableName,
        column_name: column,
        filters: (filters || {}) as unknown as Json,
        order_by: (orderBy || []) as unknown as Json,
        limit_count: limit,
      });
      if (error) {
        console.error(
          'RPC unique values failed, falling back to direct query',
          error
        );
        // Fallback implementation
        let fallbackQuery = supabase.from(tableName as any).select(column);
        if (filters) fallbackQuery = applyFilters(fallbackQuery, filters);
        if (orderBy?.length)
          fallbackQuery = applyOrdering(fallbackQuery, orderBy);
        if (limit) fallbackQuery = fallbackQuery.limit(limit);

        const { data: fallbackData, error: fallbackError } =
          await fallbackQuery;
        if (fallbackError) throw fallbackError;
        return [
          ...new Set(
            (fallbackData as any[])?.map((item) => item[column]) || []
          ),
        ];
      }
      return (data as any)?.map((item: any) => item.value) || [];
    },
    staleTime: 10 * 60 * 1000,
    ...queryOptions,
  });
}

// Deduplicated rows hook
export function useDeduplicated<T extends TableName>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  deduplicationOptions: DeduplicationOptions,
  options?: Omit<UseTableQueryOptions<T>, 'deduplication'>
) {
  return useTableQuery(supabase, tableName, {
    ...options,
    deduplication: deduplicationOptions,
  });
}

// Relationship query hook with optimizations
export function useTableWithRelations<
  T extends TableName,
  TData = RowWithCount<Row<T>>[]
>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  relations: string[],
  options?: UseTableQueryOptions<T, TData>
) {
  const columnsString =
    relations.length > 0 ? `*, ${relations.join(', ')}` : '*';

  return useTableQuery<T, TData>(supabase, tableName, {
    ...options,
    columns: columnsString,
  });
}

```

<!-- path: hooks/database/rpc-hook-factory.ts -->
```typescript
// hooks/database/rpc-hook-factory.ts
import {
    useQuery,
    UseQueryResult,
    UseQueryOptions, // Import the base options type
  } from "@tanstack/react-query";
  import { SupabaseClient } from "@supabase/supabase-js";
  import { Database, Json } from "@/types/supabase-types";
  import { RpcFunctionName } from "./queries-type-helpers";
import { DEFAULTS } from "@/config/constants";
  
  // --- START OF FIX ---
  
  // This type is now more accurate. The data returned by the hook can be `TResult` or `null`.
  type PagedRpcQueryResult<TResult> = TResult | null;
  
  // Use Omit to create the options type. We're omitting the keys that our factory provides.
  // This tells TypeScript that the user can pass any *other* valid `useQuery` option.
  type PagedRpcQueryOptions<TResult> = Omit<
    UseQueryOptions<PagedRpcQueryResult<TResult>, Error, PagedRpcQueryResult<TResult>, readonly unknown[]>,
    'queryKey' | 'queryFn'
  >;
  
  // The options for the hook itself
  type PagedRpcHookOptions<TResult> = {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDir?: "asc" | "desc";
    filters?: Json;
    queryOptions?: PagedRpcQueryOptions<TResult>; // Use the precise, new type
  };
  
  // --- END OF FIX ---
  
  
  export function createPagedRpcHook<TResult>(
    functionName: RpcFunctionName,
    viewName: string,
    defaultOrderBy: string
  ) {
    return function usePagedData(
      supabase: SupabaseClient<Database>,
      options: PagedRpcHookOptions<TResult>
    ): UseQueryResult<PagedRpcQueryResult<TResult>, Error> { // The hook's return type also includes `null`
      const {
        limit = DEFAULTS.PAGE_SIZE,
        offset = 0,
        orderBy = defaultOrderBy,
        orderDir = "asc",
        filters = {},
        queryOptions,
      } = options;
  
      return useQuery<PagedRpcQueryResult<TResult>, Error, PagedRpcQueryResult<TResult>, readonly unknown[]>({
        queryKey: [viewName, { limit, offset, orderBy, orderDir, filters }],
        queryFn: async (): Promise<PagedRpcQueryResult<TResult>> => { // The queryFn's promise now correctly includes `null`
          const { data, error } = await supabase.rpc(functionName, {
            p_limit: limit,
            p_offset: offset,
            p_order_by: orderBy,
            p_order_dir: orderDir,
            p_filters: filters,
          });
  
          if (error) {
            console.error(`Error fetching from RPC function '${String(functionName)}':`, error);
            throw new Error(error.message);
          }
  
          return (data as TResult) ?? null;
        },
        ...queryOptions,
      });
    };
  }
```

<!-- path: hooks/database/index.ts -->
```typescript
// hooks/database/index.ts - Main export file
export * from './queries-type-helpers'
export * from './utility-functions'
export * from './core-queries'
export * from './basic-mutation-hooks'
export * from './bulk-queries'
export * from './advanced-bulk-queries'

// Additional specialized hooks for complex operations
export * from './rpc-queries'
// Performance and Cache hooks
export * from './cache-performance'









```

<!-- path: hooks/database/path-mutations.ts -->
```typescript
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

const supabase = createClient();

/**
 * Hook to call the RPC function for deleting a path segment and reordering the rest.
 */
export function useDeletePathSegment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ segmentId, pathId }: { segmentId: string, pathId: string }) => {
      const { error } = await supabase.rpc('delete_path_segment_and_reorder', {
        p_segment_id: segmentId,
        p_path_id: pathId,
      });
      if (error) throw error;
    },
    onSuccess: (_, { pathId }) => {
      toast.success("Path segment deleted.");
      queryClient.invalidateQueries({ queryKey: ['system-path', pathId] });
    },
    onError: (err) => toast.error(`Failed to delete segment: ${err.message}`),
  });
}

/**
 * Hook to call the RPC function for reordering path segments via drag-and-drop.
 */
export function useReorderPathSegments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pathId, segmentIds }: { pathId: string, segmentIds: string[] }) => {
      const { error } = await supabase.rpc('reorder_path_segments', {
        p_path_id: pathId,
        p_segment_ids: segmentIds,
      });
      if (error) throw error;
    },
    onSuccess: (_, { pathId }) => {
      toast.success("Path reordered successfully.");
      queryClient.invalidateQueries({ queryKey: ['system-path', pathId] });
    },
    onError: (err) => toast.error(`Failed to reorder path: ${err.message}`),
  });
}

// ... (keep existing hooks)

/**
 * Hook to call the RPC function for provisioning a fiber onto a path.
 */
export function useProvisionFiber() {
  const queryClient = useQueryClient();
  return useMutation({
      mutationFn: async ({ pathId, fiberNo }: { pathId: string, fiberNo: number }) => {
          const { error } = await supabase.rpc('provision_fiber_on_path', {
              p_path_id: pathId,
              p_fiber_no: fiberNo
          });
          if (error) throw error;
      },
      onSuccess: (_, { pathId }) => {
          toast.success("Fiber provisioned successfully!");
          // Refetch everything related to paths and connections to update the UI state
          queryClient.invalidateQueries({ queryKey: ['system-path', pathId] });
          queryClient.invalidateQueries({ queryKey: ['available-fibers', pathId] }); 
          queryClient.invalidateQueries({ queryKey: ['ofc_connections'] });
      },
      onError: (err) => toast.error(`Provisioning failed: ${err.message}`),
  });
}

export function useProvisionRingPath() {
  const queryClient = useQueryClient();
  return useMutation({
      mutationFn: async (variables: { 
          systemId: string;
          pathName: string;
          workingFiber: number;
          protectionFiber: number;
          physicalPathId: string; 
      }) => {
          const { error } = await supabase.rpc('provision_ring_path', {
              p_system_id: variables.systemId,
              p_path_name: variables.pathName,
              p_working_fiber_no: variables.workingFiber,
              p_protection_fiber_no: variables.protectionFiber,
              p_physical_path_id: variables.physicalPathId
          });
          if (error) throw error;
      },
      onSuccess: (_, variables) => {
          toast.success("Ring path provisioned successfully!");
          // Invalidate all related queries to refresh the UI state completely
          queryClient.invalidateQueries({ queryKey: ['system-path', variables.physicalPathId] });
          queryClient.invalidateQueries({ queryKey: ['available-fibers', variables.physicalPathId] }); 
          queryClient.invalidateQueries({ queryKey: ['logical_fiber_paths'] });
          queryClient.invalidateQueries({ queryKey: ['ofc_connections'] });
          queryClient.invalidateQueries({ queryKey: ['v_cable_utilization'] });
      },
      onError: (err) => toast.error(`Provisioning failed: ${err.message}`),
  });
}
```

<!-- path: hooks/database/rpc-queries.ts -->
```typescript
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase-types';
import {
  RpcFunctionName,
  RpcFunctionArgs,
  RpcFunctionReturns,
  UseRpcQueryOptions,
  UseTableMutationOptions,
  PagedSystemsCompleteResult,
  PagedNodesCompleteResult,
  PagedOfcConnectionsCompleteResult,
  PagedSystemConnectionsCompleteResult,
  PagedLookupTypesWithCountResult,
  PagedMaintenanceAreasWithCountResult,
  PagedEmployeeDesignationsWithCountResult,
  PagedEmployeesWithCountResult,
  PagedRingsWithCountResult,
} from './queries-type-helpers';
import { createRpcQueryKey } from './utility-functions';
import {
  PagedOfcCablesCompleteResult,
} from '@/hooks/database/queries-type-helpers';
import { createPagedRpcHook } from '@/hooks/database/rpc-hook-factory';

// RPC query hook with performance enhancements
export function useRpcQuery<
  T extends RpcFunctionName,
  TData = RpcFunctionReturns<T>
>(
  supabase: SupabaseClient<Database>,
  functionName: T,
  args?: RpcFunctionArgs<T>,
  options?: UseRpcQueryOptions<T, TData>
) {
  const { performance, ...queryOptions } = options || {};

  return useQuery({
    queryKey: createRpcQueryKey(functionName, args, performance),
    queryFn: async (): Promise<RpcFunctionReturns<T>> => {
      const { data, error } = await supabase.rpc(
        functionName,
        args || ({} as RpcFunctionArgs<T>)
      );
      if (error) throw error;
      return data as RpcFunctionReturns<T>;
    },
    staleTime: 3 * 60 * 1000,
    ...queryOptions,
  });
}

// Enhanced RPC mutation hook
export function useRpcMutation<T extends RpcFunctionName>(
  supabase: SupabaseClient<Database>,
  functionName: T,
  options?: UseTableMutationOptions<RpcFunctionReturns<T>, RpcFunctionArgs<T>>
) {
  const queryClient = useQueryClient();
  const { invalidateQueries = true, ...mutationOptions } = options || {};

  return useMutation({
    mutationFn: async (
      args: RpcFunctionArgs<T>
    ): Promise<RpcFunctionReturns<T>> => {
      const { data, error } = await supabase.rpc(
        functionName,
        args || ({} as RpcFunctionArgs<T>)
      );
      if (error) throw error;
      return data as RpcFunctionReturns<T>;
    },
    onSuccess: (data, variables, context) => {
      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ['rpc', functionName] });
        queryClient.invalidateQueries({ queryKey: ['table'] });
      }
      options?.onSuccess?.(data, variables, context);
    },
    ...mutationOptions,
  });
}

/**
 * A specialized hook to fetch paginated data from the `v_systems_complete` view
 * using the high-performance RPC function.
 */
export const usePagedSystemsComplete =
  createPagedRpcHook<PagedSystemsCompleteResult>(
    'get_paged_v_systems_complete', // RPC function name
    'v_systems_complete', // Unique query key
    'system_name' // Default sort column
  );

export const usePagedSystemConnectionsComplete =
  createPagedRpcHook<PagedSystemConnectionsCompleteResult>(
    'get_paged_system_connections_complete',
    'v_system_connections_complete',
    'system_name' // *** CORRECTLY USES "system_name" AS DEFAULT ***
  );

export const usePagedOfcCablesComplete =
  createPagedRpcHook<PagedOfcCablesCompleteResult>(
    'get_paged_ofc_cables_complete',
    'v_ofc_cables_complete',
    'route_name'
  );

export const usePagedOfcConnectionsComplete =
  createPagedRpcHook<PagedOfcConnectionsCompleteResult>(
    'get_paged_ofc_connections_complete',
    'v_ofc_connections_complete',
    'fiber_no_sn'
  );

export const usePagedNodesComplete =
  createPagedRpcHook<PagedNodesCompleteResult>(
    'get_paged_nodes_complete',
    'v_nodes_complete',
    'name'
  );

export const usePagedLookupTypesWithCount =
  createPagedRpcHook<PagedLookupTypesWithCountResult>(
    'get_paged_lookup_types_with_count',
    'v_lookup_types_with_count',
    'name'
  );

export const usePagedMaintenanceAreasWithCount =
  createPagedRpcHook<PagedMaintenanceAreasWithCountResult>(
    'get_paged_maintenance_areas_with_count',
    'v_maintenance_areas_with_count',
    'name'
  );

export const usePagedEmployeeDesignationsWithCount =
  createPagedRpcHook<PagedEmployeeDesignationsWithCountResult>(
    'get_paged_employee_designations_with_count',
    'v_employee_designations_with_count',
    'name'
  );

export const usePagedEmployeesWithCount =
  createPagedRpcHook<PagedEmployeesWithCountResult>(
    'get_paged_employees_with_count',
    'v_employees_with_count',
    'employee_name'
  );

export const usePagedRingsWithCount =
  createPagedRpcHook<PagedRingsWithCountResult>(
    'get_paged_rings_with_count',
    'v_rings_with_count',
    'name'
  );

export function useDashboardOverview(
  supabase: SupabaseClient<Database>,
  options: UseRpcQueryOptions<'get_dashboard_overview'>
) {
  return useRpcQuery(supabase, 'get_dashboard_overview', {}, options);
}

// Lookup type hooks
export function useGetLookupTypeId(
  supabase: SupabaseClient<Database>,
  category: string,
  name: string,
  options?: UseRpcQueryOptions<'get_lookup_type_id'>
) {
  return useRpcQuery(
    supabase,
    'get_lookup_type_id',
    { p_category: category, p_name: name },
    options
  );
}

export function useGetLookupTypesByCategory(
  supabase: SupabaseClient<Database>,
  category: string,
  options?: UseRpcQueryOptions<'get_lookup_types_by_category'>
) {
  return useRpcQuery(
    supabase,
    'get_lookup_types_by_category',
    { p_category: category },
    options
  );
}

export function useAddLookupType(
  supabase: SupabaseClient<Database>,
  options?: UseTableMutationOptions<string, RpcFunctionArgs<'add_lookup_type'>>
) {
  return useRpcMutation(supabase, 'add_lookup_type', options);
}

// User-related hooks
export function useGetMyUserDetails(
  supabase: SupabaseClient<Database>,
  options?: UseRpcQueryOptions<'get_my_user_details'>
) {
  return useRpcQuery(supabase, 'get_my_user_details', {}, options);
}

export function useGetMyRole(
  supabase: SupabaseClient<Database>,
  options?: UseRpcQueryOptions<'get_my_role'>
) {
  return useRpcQuery(supabase, 'get_my_role', {}, options);
}

export function useIsSuperAdmin(
  supabase: SupabaseClient<Database>,
  options?: UseRpcQueryOptions<'is_super_admin'>
) {
  return useRpcQuery(supabase, 'is_super_admin', {}, options);
}

// Admin function hooks
export function useAdminGetAllUsers(
  supabase: SupabaseClient<Database>,
  args?: RpcFunctionArgs<'admin_get_all_users'>,
  options?: UseRpcQueryOptions<'admin_get_all_users'>
) {
  return useRpcQuery(supabase, 'admin_get_all_users', args, options);
}

export function useAdminGetAllUsersExtended(
  supabase: SupabaseClient<Database>,
  args?: RpcFunctionArgs<'admin_get_all_users_extended'>,
  options?: UseRpcQueryOptions<'admin_get_all_users_extended'>
) {
  return useRpcQuery(supabase, 'admin_get_all_users_extended', args, options);
}

export function useAdminUpdateUserProfile(
  supabase: SupabaseClient<Database>,
  options?: UseTableMutationOptions<
    boolean,
    RpcFunctionArgs<'admin_update_user_profile'>
  >
) {
  return useRpcMutation(supabase, 'admin_update_user_profile', options);
}

export function useAdminBulkUpdateRole(
  supabase: SupabaseClient<Database>,
  options?: UseTableMutationOptions<
    boolean,
    RpcFunctionArgs<'admin_bulk_update_role'>
  >
) {
  return useRpcMutation(supabase, 'admin_bulk_update_role', options);
}

export function useAdminBulkUpdateStatus(
  supabase: SupabaseClient<Database>,
  options?: UseTableMutationOptions<
    boolean,
    RpcFunctionArgs<'admin_bulk_update_status'>
  >
) {
  return useRpcMutation(supabase, 'admin_bulk_update_status', options);
}

export function useAdminBulkDeleteUsers(
  supabase: SupabaseClient<Database>,
  options?: UseTableMutationOptions<
    boolean,
    RpcFunctionArgs<'admin_bulk_delete_users'>
  >
) {
  return useRpcMutation(supabase, 'admin_bulk_delete_users', options);
}

```

<!-- path: hooks/database/cache-performance.ts -->
```typescript
import { useQueryClient, QueryClient } from "@tanstack/react-query";
import { Filters, RpcFunctionArgs, RpcFunctionName, RpcFunctionReturns, TableName, TableRow, UseTableQueryOptions } from "./queries-type-helpers";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase-types";
import { applyFilters, applyOrdering, createQueryKey, createRpcQueryKey } from "./utility-functions";

// Performance monitoring hook
export function useQueryPerformance() {
  const queryClient = useQueryClient();

  const getQueryStats = () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    return {
      totalQueries: queries.length,
      staleQueries: queries.filter((q) => q.isStale()).length,
      inactiveQueries: queries.filter((q) => q.getObserversCount() === 0).length,
      fetchingQueries: queries.filter((q) => q.state.status === "pending").length,
      cacheSizeBytes: JSON.stringify(cache).length,
    };
  };

  const clearStaleQueries = () => {
    queryClient.removeQueries({
      predicate: (query) => query.isStale() && query.state.status !== "pending",
    });
  };

  const prefetchCriticalData = async (supabase: SupabaseClient<Database>, criticalTables: TableName[]) => {
    const promises = criticalTables.map((tableName) =>
      queryClient.prefetchQuery({
        queryKey: ["table", tableName],
        queryFn: async () => {
          const { data, error } = await supabase.from(tableName).select("*").limit(100);
          if (error) throw error;
          return data;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
      })
    );

    await Promise.all(promises);
  };

  return {
    getQueryStats,
    clearStaleQueries,
    prefetchCriticalData,
  };
}

// Specialized hooks for RPC functions (keeping existing ones)
// This type is generated automatically by the Supabase CLI!
// Define the return type with more precision
// Use `Array<T>` syntax for clarity and add `| null` to handle initial/error states.

// Enhanced cache utilities with performance optimizations
export const tableQueryUtils = {
  invalidateTable: (queryClient: QueryClient, tableName: string) => {
    queryClient.invalidateQueries({ queryKey: ["table", tableName] });
    queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
  },

  invalidateAllTables: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ["table"] });
    queryClient.invalidateQueries({ queryKey: ["unique"] });
  },

  invalidateRpc: (queryClient: QueryClient, functionName: string) => {
    queryClient.invalidateQueries({ queryKey: ["rpc", functionName] });
  },

  invalidateAllRpc: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ["rpc"] });
  },

  prefetchTable: async <T extends TableName>(queryClient: QueryClient, supabase: SupabaseClient<Database>, tableName: T, options?: UseTableQueryOptions<T>) => {
    return queryClient.prefetchQuery({
      queryKey: createQueryKey(tableName, options?.filters, options?.columns, options?.orderBy, options?.deduplication, options?.aggregation, options?.limit, options?.offset),
      queryFn: async (): Promise<TableRow<T>[]> => {
        let query = supabase.from(tableName).select(options?.columns || "*");

        if (options?.filters) {
          query = applyFilters(query, options.filters);
        }

        if (options?.orderBy) {
          query = applyOrdering(query, options.orderBy);
        }

        if (options?.limit) {
          query = query.limit(options.limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return (data as TableRow<T>[]) || [];
      },
      staleTime: 5 * 60 * 1000,
    });
  },

  prefetchRpc: async <T extends RpcFunctionName>(queryClient: QueryClient, supabase: SupabaseClient<Database>, functionName: T, args?: RpcFunctionArgs<T>) => {
    return queryClient.prefetchQuery({
      queryKey: createRpcQueryKey(functionName, args),
      queryFn: async (): Promise<RpcFunctionReturns<T>> => {
        const { data, error } = await supabase.rpc(functionName, args || ({} as RpcFunctionArgs<T>));
        if (error) throw error;
        return data as RpcFunctionReturns<T>;
      },
      staleTime: 3 * 60 * 1000,
    });
  },

  // Optimized cache management
  setQueryData: <T extends TableName>(queryClient: QueryClient, tableName: T, data: TableRow<T>[], filters?: Filters, columns?: string) => {
    queryClient.setQueryData(createQueryKey(tableName, filters, columns), data);
  },

  getQueryData: <T extends TableName>(queryClient: QueryClient, tableName: T, filters?: Filters, columns?: string): TableRow<T>[] | undefined => {
    return queryClient.getQueryData(createQueryKey(tableName, filters, columns));
  },

  // Performance monitoring
  getTableCacheStats: (queryClient: QueryClient, tableName: string) => {
    const cache = queryClient.getQueryCache();
    const tableQueries = cache.findAll({
      queryKey: ["table", tableName],
    });

    return {
      queryCount: tableQueries.length,
      staleCount: tableQueries.filter((q) => q.isStale()).length,
      fetchingCount: tableQueries.filter((q) => q.state.status === "pending").length,
      errorCount: tableQueries.filter((q) => q.state.status === "error").length,
      totalDataSize: tableQueries.reduce((acc, query) => {
        const data = query.state.data;
        return acc + (data ? JSON.stringify(data).length : 0);
      }, 0),
    };
  },

  // Cleanup utilities
  removeStaleQueries: (
    queryClient: QueryClient,
    maxAge = 10 * 60 * 1000 // 10 minutes
  ) => {
    queryClient.removeQueries({
      predicate: (query) => {
        const isOld = Date.now() - query.state.dataUpdatedAt > maxAge;
        return isOld && query.isStale() && query.state.status !== "pending";
      },
    });
  },

  // Batch operations
  batchInvalidate: (queryClient: QueryClient, operations: Array<{ type: "table" | "rpc"; name: string }>) => {
    operations.forEach(({ type, name }) => {
      queryClient.invalidateQueries({ queryKey: [type, name] });
    });
  },
};

```

<!-- path: hooks/database/queries-type-helpers.ts -->
```typescript
// hooks/database/queries-type-helpers.ts

import { UseQueryOptions, UseMutationOptions, UseInfiniteQueryOptions, InfiniteData } from "@tanstack/react-query";
import { Database, Tables, TablesInsert, TablesUpdate, Json } from "@/types/supabase-types";

// --- TYPE HELPERS ---

// The type to include Date as a possible type
export type TableInsertWithDates<T extends TableName> = {
  [K in keyof TablesInsert<T>]?: TablesInsert<T>[K] | Date | null;
};

export type TableUpdateWithDates<T extends TableName> = {
  [K in keyof TablesUpdate<T>]?: TablesUpdate<T>[K] | Date | null;
};

// A table is a source that can be read from and written to.
export type TableName = keyof Database["public"]["Tables"];

// Auth tables are tables that can only be read from.
export type AuthTable = keyof Database["auth"]["Tables"];

// A view is a source that can only be read from.
export type ViewName = keyof Database["public"]["Views"];

// A generic type for any readable source (table or view).
export type TableOrViewName = TableName | ViewName;

// A generic type for any readable source (table or view).
export type AuthTableOrViewName = AuthTable | ViewName | TableName;

// Helper function to check if the table name is a table (not a view)
export const isTableName = (name: AuthTableOrViewName): name is TableName => {
  // List of view names - add your view names here
  const viewNames = [
    'v_nodes_complete',
    'v_ofc_cables_complete',
    'v_ofc_connections_complete',
    'v_system_connections_complete',
    'v_systems_complete',
    // 'vmux_connections',
    // 'vmux_systems',
    // Add other view names here
  ];
  const authViewNames = [
    'users',
  ];
  return !viewNames.includes(name as string) && !authViewNames.includes(name as string);
};

// Table-specific types for mutation operations (insert, update, delete).
export type TableRow<T extends TableName> = Tables<T>;
export type TableInsert<T extends TableName> = TablesInsert<T>;
export type TableUpdate<T extends TableName> = TablesUpdate<T>;

// A generic row type for any read operation (works with both tables and views).
export type Row<T extends AuthTableOrViewName> = T extends TableName ? Tables<T> : T extends ViewName ? Database["public"]["Views"][T]["Row"] : T extends AuthTable ? Database["auth"]["Tables"][T]["Row"] : never;

// RPC function type helpers.
export type RpcFunctionName = keyof Database["public"]["Functions"];
export type RpcFunctionArgs<T extends RpcFunctionName> = Database["public"]["Functions"][T]["Args"];
export type RpcFunctionReturns<T extends RpcFunctionName> = Database["public"]["Functions"][T]["Returns"];

// --- ADVANCED TYPES FOR HOOK OPTIONS ---

export type FilterOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "in" | "not.in" | "contains" | "containedBy" | "overlaps" | "sl" | "sr" | "nxl" | "nxr" | "adj" | "is" | "isdistinct" | "fts" | "plfts" | "phfts" | "wfts" | "or";

export type FilterValue = string | number | boolean | null | string[] | number[] | { operator: FilterOperator; value: unknown };

export type Filters = Record<string, FilterValue>;

export type OrderBy = {
  column: string;
  ascending?: boolean;
  nullsFirst?: boolean;
  foreignTable?: string;
};

export // Updated OrderBy interface to support optional type hints
interface EnhancedOrderBy {
  column: string;
  ascending?: boolean;
  nullsFirst?: boolean;
  foreignTable?: string;
  dataType?: 'text' | 'numeric' | 'date' | 'timestamp' | 'boolean' | 'json';
}

export type DeduplicationOptions = {
  columns: string[];
  orderBy?: OrderBy[];
};

export type AggregationOptions = {
  count?: boolean | string;
  sum?: string[];
  avg?: string[];
  min?: string[];
  max?: string[];
  groupBy?: string[];
};

export type PerformanceOptions = {
  useIndex?: string;
  explain?: boolean;
  timeout?: number;
  connection?: "read" | "write";
};

// The shape of data returned by queries, potentially with a total count.
export type RowWithCount<T> = T & { total_count?: number };

// --- HOOK OPTIONS INTERFACES ---

// Options for querying multiple records from tables OR views.
export interface UseTableQueryOptions<T extends TableOrViewName, TData = RowWithCount<Row<T>>[]> extends Omit<UseQueryOptions<RowWithCount<Row<T>>[], Error, TData>, "queryKey" | "queryFn"> {
  columns?: string;
  filters?: Filters;
  orderBy?: OrderBy[];
  limit?: number;
  offset?: number;
  deduplication?: DeduplicationOptions;
  aggregation?: AggregationOptions;
  performance?: PerformanceOptions;
  includeCount?: boolean;
}

// Options for infinite scrolling over tables OR views.
export type InfiniteQueryPage<T extends TableOrViewName> = {
  data: Row<T>[];
  nextCursor?: number;
  count?: number;
};

export interface UseTableInfiniteQueryOptions<T extends TableOrViewName, TData = InfiniteData<InfiniteQueryPage<T>>>
  extends Omit<UseInfiniteQueryOptions<InfiniteQueryPage<T>, Error, TData, readonly unknown[], number | undefined>, "queryKey" | "queryFn" | "getNextPageParam" | "initialPageParam"> {
  columns?: string;
  filters?: Filters;
  orderBy?: OrderBy[];
  pageSize?: number;
  performance?: PerformanceOptions;
}

// Options for querying a single record from a table OR view.
export interface UseTableRecordOptions<T extends TableOrViewName, TData = Row<T> | null> extends Omit<UseQueryOptions<Row<T> | null, Error, TData>, "queryKey" | "queryFn"> {
  columns?: string;
  performance?: PerformanceOptions;
}

// Options for getting unique values from a table OR view.
export interface UseUniqueValuesOptions<T extends TableOrViewName, TData = unknown[]> extends Omit<UseQueryOptions<unknown[], Error, TData>, "queryKey" | "queryFn"> {
  tableName: T;
  filters?: Filters;
  orderBy?: OrderBy[];
  limit?: number;
  performance?: PerformanceOptions;
}

export interface UseRpcQueryOptions<T extends RpcFunctionName, TData = RpcFunctionReturns<T>> extends Omit<UseQueryOptions<RpcFunctionReturns<T>, Error, TData>, "queryKey" | "queryFn"> {
  performance?: PerformanceOptions;
}

// Options for mutations, which apply ONLY to tables.
export interface UseTableMutationOptions<TData = unknown, TVariables = unknown, TContext = unknown> extends Omit<UseMutationOptions<TData, Error, TVariables, TContext>, "mutationFn"> {
  invalidateQueries?: boolean;
  optimisticUpdate?: boolean;
  batchSize?: number;
}

export interface OptimisticContext {
  previousData?: [readonly unknown[], unknown][];
}

export type PagedSystemsCompleteResult = Array<Database["public"]["Functions"]["get_paged_v_systems_complete"]["Returns"][number]> | null;

export type UsePagedSystemsCompleteOptions = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
  filters?: Json;
  queryOptions?: Omit<UseQueryOptions<PagedSystemsCompleteResult>, "queryKey" | "queryFn">;
};

// --- TYPES FOR EXCEL UPLOAD HOOK ---

/**
 * Defines how to map a column from the Excel file to a database column.
 * @template T - The name of the table to upload to.
 */
export interface UploadColumnMapping<T extends TableName> {
  /** The exact header name in the Excel file (e.g., "Product Name"). */
  excelHeader: string;
  /** The corresponding key in the database table (e.g., "product_name"). */
  dbKey: keyof TableInsert<T> & string;
  /** An optional function to transform the cell's value before uploading. */
  transform?: (value: unknown) => unknown;
  /** If true, the value must be non-empty after transform; otherwise the row is rejected. */
  required?: boolean;
}

/**
 * Specifies the type of upload operation to perform.
 * - 'insert': Adds all rows as new records. Fails if a record violates a unique constraint.
 * - 'upsert': Inserts new records or updates existing ones based on a conflict column.
 */
export type UploadType = "insert" | "upsert";

/**
 * Options required to initiate an Excel file upload.
 * @template T - The name of the table to upload to.
 */
export interface UploadOptions<T extends TableName> {
  /** The file object from a file input element. */
  file: File;
  /** An array defining how to map Excel columns to database columns. */
  columns: UploadColumnMapping<T>[];
  /** The type of database operation to perform. Defaults to 'upsert'. */
  uploadType?: UploadType;
  /**
   * The database column to use for conflict resolution in an 'upsert' operation.
   * This is REQUIRED for 'upsert'.
   * e.g., 'id' or 'sku' if you want to update rows with matching IDs or SKUs.
   */
  conflictColumn?: keyof TableInsert<T> & string;
}

/**
 * The result of a successful upload operation.
 */
export interface UploadResult {
  successCount: number;
  errorCount: number;
  totalRows: number;
  errors: { rowIndex: number; data: unknown; error: string }[];
}

/**
 * Configuration options for the useExcelUpload hook itself.
 * @template T - The name of the table to upload to.
 */
export interface UseExcelUploadOptions<T extends TableName> {
  onSuccess?: (data: UploadResult, variables: UploadOptions<T>) => void;
  onError?: (error: Error, variables: UploadOptions<T>) => void;
  showToasts?: boolean;
  batchSize?: number;
}

// FIX: Add the return type for the new RPC function
export type PagedOfcCablesCompleteResult = 
  Array<Database["public"]["Functions"]["get_paged_ofc_cables_complete"]["Returns"][number]> | null;

// FIX: Add the options type for the new hook we will create
// export type UsePagedOfcCablesCompleteOptions = {
//   limit?: number;
//   offset?: number;
//   orderBy?: string;
//   orderDir?: "asc" | "desc";
//   filters?: Json;
//   queryOptions?: Omit<UseQueryOptions<PagedOfcCablesCompleteResult, Error>, "queryKey" | "queryFn">;
// };

export type PagedNodesCompleteResult = Array<Database["public"]["Functions"]["get_paged_nodes_complete"]["Returns"][number]> | null;

// export type UsePagedNodesCompleteOptions = {
//   limit?: number;
//   offset?: number;
//   orderBy?: string;
//   orderDir?: "asc" | "desc";
//   filters?: Json;
//   queryOptions?: Omit<UseQueryOptions<PagedNodesCompleteResult, Error>, "queryKey" | "queryFn">;
// };

export type PagedOfcConnectionsCompleteResult = 
  Array<Database["public"]["Functions"]["get_paged_ofc_connections_complete"]["Returns"][number]> | null;

// FIX: Add the options type for the new hook we will create
// export type UsePagedOfcConnectionsCompleteOptions = {
//   limit?: number;
//   offset?: number;
//   orderBy?: string;
//   orderDir?: "asc" | "desc";
//   filters?: Json;
//   queryOptions?: Omit<UseQueryOptions<PagedOfcConnectionsCompleteResult, Error>, "queryKey" | "queryFn">;
// };

export type PagedSystemConnectionsCompleteResult = Array<Database["public"]["Functions"]["get_paged_system_connections_complete"]["Returns"][number]> | null;

// export type UsePagedSystemConnectionsCompleteOptions = {
//   limit?: number;
//   offset?: number;
//   orderBy?: string;
//   orderDir?: "asc" | "desc";
//   filters?: Json;
//   queryOptions?: Omit<UseQueryOptions<PagedSystemConnectionsCompleteResult>, "queryKey" | "queryFn">;
// };

export type PagedLookupTypesWithCountResult = Array<Database["public"]["Functions"]["get_paged_lookup_types_with_count"]["Returns"][number]> | null;

// export type UsePagedLookupTypesWithCountOptions = {
//   limit?: number;
//   offset?: number;
//   orderBy?: string;
//   orderDir?: "asc" | "desc";
//   filters?: Json;
//   queryOptions?: Omit<UseQueryOptions<PagedLookupTypesWithCountResult, Error>, "queryKey" | "queryFn">;
// };

export type PagedMaintenanceAreasWithCountResult = Array<Database["public"]["Functions"]["get_paged_maintenance_areas_with_count"]["Returns"][number]> | null;

// export type UsePagedMaintenanceAreasWithCountOptions = {
//   limit?: number;
//   offset?: number;
//   orderBy?: string;
//   orderDir?: "asc" | "desc";
//   filters?: Json;
//   queryOptions?: Omit<UseQueryOptions<PagedMaintenanceAreasWithCountResult, Error>, "queryKey" | "queryFn">;
// };

export type PagedEmployeeDesignationsWithCountResult = Array<Database["public"]["Functions"]["get_paged_employee_designations_with_count"]["Returns"][number]> | null;

// export type UsePagedEmployeeDesignationsWithCountOptions = {
//   limit?: number;
//   offset?: number;
//   orderBy?: string;
//   orderDir?: "asc" | "desc";
//   filters?: Json;
//   queryOptions?: Omit<UseQueryOptions<PagedEmployeeDesignationsWithCountResult, Error>, "queryKey" | "queryFn">;
// };

export type PagedEmployeesWithCountResult = Array<Database["public"]["Functions"]["get_paged_employees_with_count"]["Returns"][number]> | null;

// export type UsePagedEmployeesWithCountOptions = {
//   limit?: number;
//   offset?: number;
//   orderBy?: string;
//   orderDir?: "asc" | "desc";
//   filters?: Json;
//   queryOptions?: Omit<UseQueryOptions<PagedEmployeesWithCountResult, Error>, "queryKey" | "queryFn">;
// };

export type PagedRingsWithCountResult = Array<Database["public"]["Functions"]["get_paged_rings_with_count"]["Returns"][number]> | null;

// export type UsePagedRingsWithCountOptions = {
//   limit?: number;
//   offset?: number;
//   orderBy?: string;
//   orderDir?: "asc" | "desc";
//   filters?: Json;
//   queryOptions?: Omit<UseQueryOptions<PagedRingsWithCountResult, Error>, "queryKey" | "queryFn">;
// };

// Define a type for the function's return data for full type safety
export type DashboardOverviewData = {
  system_status_counts: { [key: string]: number };
  node_status_counts: { [key: string]: number };
  path_operational_status: { [key: string]: number };
  cable_utilization_summary: {
    average_utilization_percent: number;
    high_utilization_count: number;
    total_cables: number;
  };
  user_activity_last_30_days: {
    date: string;
    count: number;
  }[];
  systems_per_maintenance_area: { [key: string]: number };
};
```

<!-- path: hooks/database/excel-queries/excel-download.ts -->
```typescript

import { AuthTableOrViewName, isTableName, Row, TableName, ViewName } from "../queries-type-helpers";
import * as ExcelJS from "exceljs";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase-types";
import { useMutation } from "@tanstack/react-query";
import { applyCellFormatting, convertFiltersToRPCParams, DownloadOptions, ExcelDownloadResult, formatCellValue, getDefaultStyles, RPCConfig, sanitizeFileName, UseExcelDownloadOptions } from "./excel-helpers";
import { toast } from "sonner";
import { applyFilters } from "../utility-functions";

// Extended types for new functionality
interface OrderByOption {
column: string;
ascending?: boolean;
}

interface EnhancedDownloadOptions<T extends AuthTableOrViewName> extends DownloadOptions<T> {
orderBy?: OrderByOption[];
wrapText?: boolean;
autoFitColumns?: boolean;
}

interface EnhancedUseExcelDownloadOptions<T extends AuthTableOrViewName> extends UseExcelDownloadOptions<T> {
defaultOrderBy?: OrderByOption[];
defaultWrapText?: boolean;
defaultAutoFitColumns?: boolean;
}

// Hook for RPC-based downloads with full type safety
export function useRPCExcelDownload<T extends AuthTableOrViewName>(
  supabase: SupabaseClient<Database>,
  options?: EnhancedUseExcelDownloadOptions<T>
) {
  const {
    showToasts = true,
    batchSize = 50000,
    defaultOrderBy,
    defaultWrapText = true,
    defaultAutoFitColumns = true,
    ...mutationOptions
  } = options || {};

  return useMutation<
    ExcelDownloadResult,
    Error,
    EnhancedDownloadOptions<T> & { rpcConfig: RPCConfig }
  >({
    mutationFn: async (downloadOptions): Promise<ExcelDownloadResult> => {
      try {
        const defaultStyles = getDefaultStyles();
        const mergedOptions = {
          sheetName: "Data",
          maxRows: batchSize,
          customStyles: defaultStyles,
          orderBy: defaultOrderBy,
          wrapText: defaultWrapText,
          autoFitColumns: defaultAutoFitColumns,
          ...downloadOptions,
        };

        const {
          fileName = `export-${new Date().toISOString().split("T")[0]}.xlsx`,
          filters,
          columns,
          sheetName,
          maxRows,
          rpcConfig,
          orderBy,
          wrapText,
          autoFitColumns,
        } = mergedOptions;

        const styles = { ...defaultStyles, ...mergedOptions.customStyles };

        if (!columns || columns.length === 0)
          throw new Error("No columns specified for export");
        if (!rpcConfig)
          throw new Error("RPC configuration is required for this hook");

        const exportColumns = columns.filter((col) => !col.excludeFromExport);
        if (exportColumns.length === 0)
          throw new Error("All columns are excluded from export");

        toast.info("Fetching data via RPC...");

        // Prepare RPC parameters
        const rpcParams = {
          ...rpcConfig.parameters,
          ...convertFiltersToRPCParams(filters),
        };

        if (maxRows) {
          rpcParams.row_limit = maxRows;
        }

        // Add ordering parameters to RPC if supported
        if (orderBy && orderBy.length > 0) {
          rpcParams.order_by = orderBy.map(order => 
            `${order.column}.${order.ascending !== false ? 'asc' : 'desc'}`
          ).join(',');
        }

        // Execute RPC call with proper error handling
        const { data, error } = await supabase.rpc(
          rpcConfig.functionName as keyof Database["public"]["Functions"],
          rpcParams
        );

        if (error) throw new Error(`RPC call failed: ${error.message}`);
        if (!data || (Array.isArray(data) && data.length === 0)) {
          throw new Error("No data returned from RPC function");
        }

        // Ensure data is an array
        let dataArray = Array.isArray(data) ? data : [data];
        
        // Apply client-side ordering if RPC doesn't support it
        if (orderBy && orderBy.length > 0) {
          dataArray = dataArray.sort((a, b) => {
            for (const order of orderBy) {
              // Safe property access with type guards
              const aVal = (a && typeof a === 'object' && !Array.isArray(a)) 
                ? (a as Record<string, unknown>)[order.column] 
                : undefined;
              const bVal = (b && typeof b === 'object' && !Array.isArray(b)) 
                ? (b as Record<string, unknown>)[order.column] 
                : undefined;
              
              if (aVal === bVal) continue;
              
              let comparison = 0;
              if (aVal == null && bVal != null) comparison = 1;
              else if (aVal != null && bVal == null) comparison = -1;
              else if (aVal != null && bVal != null) {
                if (aVal < bVal) comparison = -1;
                else if (aVal > bVal) comparison = 1;
              }
              
              return order.ascending !== false ? comparison : -comparison;
            }
            return 0;
          });
        }
        
        toast.success(
          `Fetched ${dataArray.length} records. Generating Excel file...`
        );

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName || "Data");

        // Set column properties with enhanced options
        worksheet.columns = exportColumns.map((col) => ({
          key: String(col.dataIndex),
          width: typeof col.width === "number" ? col.width / 8 : 20,
        }));

        // Add header row with enhanced styling
        const headerTitles = exportColumns.map((col) => col.title);
        const headerRow = worksheet.addRow(headerTitles);
        headerRow.height = 25;

        exportColumns.forEach((col, index) => {
          const cell = headerRow.getCell(index + 1);
          if (styles.headerFont) cell.font = styles.headerFont;
          if (styles.headerFill) cell.fill = styles.headerFill;
          
          // Enhanced header alignment with text wrapping
          cell.alignment = { 
            horizontal: "center", 
            vertical: "middle",
            wrapText: wrapText || false
          };

          if (styles.borderStyle) {
            cell.border = {
              top: styles.borderStyle.top,
              bottom: styles.borderStyle.bottom,
              right: styles.borderStyle.right,
              left: index === 0 ? styles.borderStyle.left : undefined,
            };
          }
        });

        // Add data rows with enhanced styling
        dataArray.forEach((record, rowIndex: number) => {
          // Ensure we only process object-like rows
          if (record === null || typeof record !== "object" || Array.isArray(record)) {
            return; // skip non-object rows
          }

          const obj = record as Record<string, unknown>;
          const rowData: Record<string, unknown> = {};
          exportColumns.forEach((col) => {
            const key = String(col.dataIndex);
            const value = obj[key];
            rowData[key] = formatCellValue(value, col);
          });
          const excelRow = worksheet.addRow(rowData);

          // Enhanced cell styling with wrap text support
          exportColumns.forEach((col, colIndex) => {
            const cell = excelRow.getCell(colIndex + 1);

            if (styles.dataFont) cell.font = styles.dataFont;

            if (rowIndex % 2 === 1 && styles.alternateRowFill) {
              cell.fill = styles.alternateRowFill;
            }

            // Apply text wrapping and alignment
            cell.alignment = {
              ...cell.alignment,
              wrapText: wrapText || false,
              vertical: 'top' // Better for wrapped text
            };

            applyCellFormatting(cell, col);

            if (styles.borderStyle) {
              const isLastDataRow = rowIndex === dataArray.length - 1;
              cell.border = {
                right: styles.borderStyle.right,
                left: colIndex === 0 ? styles.borderStyle.left : undefined,
                top: styles.borderStyle.top,
                bottom: isLastDataRow ? styles.borderStyle.bottom : undefined,
              };
            }
          });
        });

        // Auto-fit columns if enabled
        if (autoFitColumns) {
          exportColumns.forEach((col, index) => {
            const column = worksheet.getColumn(index + 1);
            let maxLength = col.title.length;
            
            // Calculate max content length for auto-fitting
            dataArray.forEach((record) => {
              if (record && typeof record === "object" && !Array.isArray(record)) {
                const obj = record as Record<string, unknown>;
                const key = String(col.dataIndex);
                const value = obj[key];
                const cellText = String(formatCellValue(value, col) || '');
                
                // For wrapped text, consider line breaks
                if (wrapText) {
                  const lines = cellText.split('\n');
                  const maxLineLength = Math.max(...lines.map(line => line.length));
                  maxLength = Math.max(maxLength, maxLineLength);
                } else {
                  maxLength = Math.max(maxLength, cellText.length);
                }
              }
            });
            
            // Set reasonable bounds for column width
            const calculatedWidth = Math.min(Math.max(maxLength + 2, 10), 50);
            column.width = calculatedWidth;
          });
        }

        // Freeze header row
        worksheet.views = [{ state: "frozen", ySplit: 1 }];

        // Generate and download file
        const buffer = await workbook.xlsx.writeBuffer();
        const sanitizedFileName = sanitizeFileName(fileName);
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = sanitizedFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        toast.success(
          `Excel file "${sanitizedFileName}" downloaded successfully!`
        );
        return {
          fileName: sanitizedFileName,
          rowCount: dataArray.length,
          columnCount: exportColumns.length,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        if (showToasts) {
          toast.error(`Download failed: ${errorMessage}`);
        }
        throw error;
      }
    },
    ...mutationOptions,
  });
}

// // Hook for traditional table/view downloads with enhanced features
// export function useTableExcelDownload<T extends AuthTableOrViewName>(
//   supabase: SupabaseClient<Database>,
//   tableName: T,
//   options?: EnhancedUseExcelDownloadOptions<T>
// ) {
//   const {
//     showToasts = true,
//     batchSize = 50000,
//     defaultOrderBy,
//     defaultWrapText = true,
//     defaultAutoFitColumns = true,
//     ...mutationOptions
//   } = options || {};

//   return useMutation<
//     ExcelDownloadResult,
//     Error,
//     Omit<EnhancedDownloadOptions<T>, "rpcConfig">
//   >({
//     mutationFn: async (downloadOptions): Promise<ExcelDownloadResult> => {
//       try {
//         const defaultStyles = getDefaultStyles();
//         const mergedOptions = {
//           sheetName: "Data",
//           maxRows: batchSize,
//           customStyles: defaultStyles,
//           orderBy: defaultOrderBy,
//           wrapText: defaultWrapText,
//           autoFitColumns: defaultAutoFitColumns,
//           ...downloadOptions,
//         };

//         const {
//           fileName = `${String(tableName)}-${
//             new Date().toISOString().split("T")[0]
//           }.xlsx`,
//           filters,
//           columns,
//           sheetName,
//           maxRows,
//           orderBy,
//           wrapText,
//           autoFitColumns,
//         } = mergedOptions;

//         const styles = { ...defaultStyles, ...mergedOptions.customStyles };

//         if (!columns || columns.length === 0)
//           throw new Error("No columns specified for export");
//         const exportColumns = columns.filter((col) => !col.excludeFromExport);
//         if (exportColumns.length === 0)
//           throw new Error("All columns are excluded from export");

//         toast.info("Fetching data for download...");

//         const selectFields = exportColumns
//           .map((col) => col.dataIndex)
//           .join(",");
//         let query = isTableName(tableName)
//           ? supabase.from(tableName as TableName).select(selectFields)
//           : supabase.from(tableName as ViewName).select(selectFields);

//         if (filters) query = applyFilters(query, filters);
        
//         // Apply ordering to the Supabase query
//         if (orderBy && orderBy.length > 0) {
//           orderBy.forEach(order => {
//             query = query.order(order.column, { ascending: order.ascending !== false });
//           });
//         }
        
//         if (maxRows) query = query.limit(maxRows);

//         const { data, error } = await query;

//         if (error) throw new Error(`Failed to fetch data: ${error.message}`);
//         if (!data || data.length === 0)
//           throw new Error("No data found for the selected criteria");

//         const typedData = data as Row<T>[];
//         toast.success(
//           `Fetched ${typedData.length} records. Generating Excel file...`
//         );

//         // Excel generation logic with enhanced features
//         const workbook = new ExcelJS.Workbook();
//         const worksheet = workbook.addWorksheet(sheetName || "Data");

//         worksheet.columns = exportColumns.map((col) => ({
//           key: String(col.dataIndex),
//           width: typeof col.width === "number" ? col.width / 8 : 20,
//         }));

//         const headerTitles = exportColumns.map((col) => col.title);
//         const headerRow = worksheet.addRow(headerTitles);
//         headerRow.height = wrapText ? 30 : 25; // Increase height for wrapped text

//         exportColumns.forEach((col, index) => {
//           const cell = headerRow.getCell(index + 1);
//           if (styles.headerFont) cell.font = styles.headerFont;
//           if (styles.headerFill) cell.fill = styles.headerFill;
          
//           // Enhanced header alignment with text wrapping
//           cell.alignment = { 
//             horizontal: "center", 
//             vertical: "middle",
//             wrapText: wrapText || false
//           };

//           if (styles.borderStyle) {
//             cell.border = {
//               top: styles.borderStyle.top,
//               bottom: styles.borderStyle.bottom,
//               right: styles.borderStyle.right,
//               left: index === 0 ? styles.borderStyle.left : undefined,
//             };
//           }
//         });

//         // Add data rows with enhanced styling
//         typedData.forEach((record, rowIndex) => {
//           const rowData: Record<string, unknown> = {};
//           exportColumns.forEach((col) => {
//             const key = col.dataIndex as keyof Row<T> & string;
//             rowData[key] = formatCellValue(record[key], col);
//           });
//           const excelRow = worksheet.addRow(rowData);
          
//           // Set row height for wrapped text
//           if (wrapText) {
//             excelRow.height = 20; // Minimum height, will auto-expand
//           }

//           exportColumns.forEach((col, colIndex) => {
//             const cell = excelRow.getCell(colIndex + 1);

//             if (styles.dataFont) cell.font = styles.dataFont;

//             if (rowIndex % 2 === 1 && styles.alternateRowFill) {
//               cell.fill = styles.alternateRowFill;
//             }

//             // Apply text wrapping and alignment
//             cell.alignment = {
//               ...cell.alignment,
//               wrapText: wrapText || false,
//               vertical: 'top' // Better for wrapped text
//             };

//             applyCellFormatting(cell, col);

//             if (styles.borderStyle) {
//               const isLastDataRow = rowIndex === typedData.length - 1;
//               cell.border = {
//                 right: styles.borderStyle.right,
//                 left: colIndex === 0 ? styles.borderStyle.left : undefined,
//                 top: styles.borderStyle.top,
//                 bottom: isLastDataRow ? styles.borderStyle.bottom : undefined,
//               };
//             }
//           });
//         });

//         // Auto-fit columns if enabled
//         if (autoFitColumns) {
//           exportColumns.forEach((col, index) => {
//             const column = worksheet.getColumn(index + 1);
//             let maxLength = col.title.length;
            
//             // Calculate max content length for auto-fitting
//             typedData.forEach((record) => {
//               const key = col.dataIndex as keyof Row<T> & string;
//               const value = record[key];
//               const cellText = String(formatCellValue(value, col) || '');
              
//               // For wrapped text, consider line breaks
//               if (wrapText) {
//                 const lines = cellText.split('\n');
//                 const maxLineLength = Math.max(...lines.map(line => line.length));
//                 maxLength = Math.max(maxLength, maxLineLength);
//               } else {
//                 maxLength = Math.max(maxLength, cellText.length);
//               }
//             });
            
//             // Set reasonable bounds for column width
//             const calculatedWidth = Math.min(Math.max(maxLength + 2, 10), wrapText ? 30 : 50);
//             column.width = calculatedWidth;
//           });
//         }

//         // Freeze header row
//         worksheet.views = [{ state: "frozen", ySplit: 1 }];

//         // Generate and download file
//         const buffer = await workbook.xlsx.writeBuffer();
//         const sanitizedFileName = sanitizeFileName(fileName);
//         const blob = new Blob([buffer], {
//           type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//         });

//         const link = document.createElement("a");
//         link.href = URL.createObjectURL(blob);
//         link.download = sanitizedFileName;
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//         URL.revokeObjectURL(link.href);

//         toast.success(
//           `Excel file "${sanitizedFileName}" downloaded successfully!`
//         );
//         return {
//           fileName: sanitizedFileName,
//           rowCount: dataArray.length,
//           columnCount: exportColumns.length,
//         };
//       } catch (error) {
//         const errorMessage =
//           error instanceof Error ? error.message : "Unknown error occurred";
//         if (showToasts) {
//           toast.error(`Download failed: ${errorMessage}`);
//         }
//         throw error;
//       }
//     },
//     ...mutationOptions,
//   });
// }

// Hook for traditional table/view downloads with enhanced features
export function useTableExcelDownload<T extends AuthTableOrViewName>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  options?: EnhancedUseExcelDownloadOptions<T>
) {
  const {
    showToasts = true,
    batchSize = 50000,
    defaultOrderBy,
    defaultWrapText = true,
    defaultAutoFitColumns = true,
    ...mutationOptions
  } = options || {};

  return useMutation<
    ExcelDownloadResult,
    Error,
    Omit<EnhancedDownloadOptions<T>, "rpcConfig">
  >({
    mutationFn: async (downloadOptions): Promise<ExcelDownloadResult> => {
      try {
        const defaultStyles = getDefaultStyles();
        const mergedOptions = {
          sheetName: "Data",
          maxRows: batchSize,
          customStyles: defaultStyles,
          orderBy: defaultOrderBy,
          wrapText: defaultWrapText,
          autoFitColumns: defaultAutoFitColumns,
          ...downloadOptions,
        };

        const {
          fileName = `${String(tableName)}-${
            new Date().toISOString().split("T")[0]
          }.xlsx`,
          filters,
          columns,
          sheetName,
          maxRows,
          orderBy,
          wrapText,
          autoFitColumns,
        } = mergedOptions;

        const styles = { ...defaultStyles, ...mergedOptions.customStyles };

        if (!columns || columns.length === 0)
          throw new Error("No columns specified for export");
        const exportColumns = columns.filter((col) => !col.excludeFromExport);
        if (exportColumns.length === 0)
          throw new Error("All columns are excluded from export");

        toast.info("Fetching data for download...");

        const selectFields = exportColumns
          .map((col) => col.dataIndex)
          .join(",");
        let query = isTableName(tableName)
          ? supabase.from(tableName as TableName).select(selectFields)
          : supabase.from(tableName as ViewName).select(selectFields);

        if (filters) query = applyFilters(query, filters);
        
        // Apply ordering to the Supabase query
        if (orderBy && orderBy.length > 0) {
          orderBy.forEach(order => {
            query = query.order(order.column, { ascending: order.ascending !== false });
          });
        }
        
        if (maxRows) query = query.limit(maxRows);

        const { data, error } = await query;

        if (error) throw new Error(`Failed to fetch data: ${error.message}`);
        if (!data || data.length === 0)
          throw new Error("No data found for the selected criteria");

        const typedData = data as Row<T>[];
        toast.success(
          `Fetched ${typedData.length} records. Generating Excel file...`
        );

        // Excel generation logic with enhanced features
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName || "Data");

        worksheet.columns = exportColumns.map((col) => ({
          key: String(col.dataIndex),
          width: typeof col.width === "number" ? col.width / 8 : 20,
        }));

        const headerTitles = exportColumns.map((col) => col.title);
        const headerRow = worksheet.addRow(headerTitles);
        headerRow.height = wrapText ? 30 : 25; // Increase height for wrapped text

        exportColumns.forEach((col, index) => {
          const cell = headerRow.getCell(index + 1);
          if (styles.headerFont) cell.font = styles.headerFont;
          if (styles.headerFill) cell.fill = styles.headerFill;
          
          // Enhanced header alignment with text wrapping
          cell.alignment = { 
            horizontal: "center", 
            vertical: "middle",
            wrapText: wrapText || false
          };

          if (styles.borderStyle) {
            cell.border = {
              top: styles.borderStyle.top,
              bottom: styles.borderStyle.bottom,
              right: styles.borderStyle.right,
              left: index === 0 ? styles.borderStyle.left : undefined,
            };
          }
        });

        // Add data rows with enhanced styling
        typedData.forEach((record, rowIndex) => {
          const rowData: Record<string, unknown> = {};
          exportColumns.forEach((col) => {
            const key = col.dataIndex as keyof Row<T> & string;
            rowData[key] = formatCellValue(record[key], col);
          });
          const excelRow = worksheet.addRow(rowData);
          
          // Set row height for wrapped text
          if (wrapText) {
            excelRow.height = 20; // Minimum height, will auto-expand
          }

          exportColumns.forEach((col, colIndex) => {
            const cell = excelRow.getCell(colIndex + 1);

            if (styles.dataFont) cell.font = styles.dataFont;

            if (rowIndex % 2 === 1 && styles.alternateRowFill) {
              cell.fill = styles.alternateRowFill;
            }

            // Apply text wrapping and alignment
            cell.alignment = {
              ...cell.alignment,
              wrapText: wrapText || false,
              vertical: 'top' // Better for wrapped text
            };

            applyCellFormatting(cell, col);

            if (styles.borderStyle) {
              const isLastDataRow = rowIndex === typedData.length - 1;
              cell.border = {
                right: styles.borderStyle.right,
                left: colIndex === 0 ? styles.borderStyle.left : undefined,
                top: styles.borderStyle.top,
                bottom: isLastDataRow ? styles.borderStyle.bottom : undefined,
              };
            }
          });
        });

        // Auto-fit columns if enabled
        if (autoFitColumns) {
          exportColumns.forEach((col, index) => {
            const column = worksheet.getColumn(index + 1);
            let maxLength = col.title.length;
            
            // Calculate max content length for auto-fitting
            typedData.forEach((record) => {
              const key = col.dataIndex as keyof Row<T> & string;
              const value = record[key];
              const cellText = String(formatCellValue(value, col) || '');
              
              // For wrapped text, consider line breaks
              if (wrapText) {
                const lines = cellText.split('\n');
                const maxLineLength = Math.max(...lines.map(line => line.length));
                maxLength = Math.max(maxLength, maxLineLength);
              } else {
                maxLength = Math.max(maxLength, cellText.length);
              }
            });
            
            // Set reasonable bounds for column width
            const calculatedWidth = Math.min(Math.max(maxLength + 2, 10), wrapText ? 30 : 50);
            column.width = calculatedWidth;
          });
        }

        worksheet.views = [{ state: "frozen", ySplit: 1 }];

        const buffer = await workbook.xlsx.writeBuffer();
        const sanitizedFileName = sanitizeFileName(fileName);
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = sanitizedFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        toast.success(
          `Excel file "${sanitizedFileName}" downloaded successfully!`
        );
        return {
          fileName: sanitizedFileName,
          rowCount: typedData.length,
          columnCount: exportColumns.length,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        if (
          showToasts &&
          errorMessage !== "No data found for the selected criteria"
        ) {
          toast.error(`Download failed: ${errorMessage}`);
        }
        throw error;
      }
    },
    ...mutationOptions,
  });
}
//   // Basic usage with ordering
// const mutation = useTableExcelDownload(supabase, 'users', {
//   defaultOrderBy: [
//     { column: 'created_at', ascending: false },
//     { column: 'name', ascending: true }
//   ]
// });

// // Download with custom options
// mutation.mutate({
//   columns: userColumns,
//   orderBy: [{ column: 'email', ascending: true }],
//   wrapText: true,
//   autoFitColumns: false,
//   fileName: 'user-report.xlsx'
// });

// // RPC download with ordering
// const rpcMutation = useRPCExcelDownload(supabase, {
//   defaultWrapText: false,
//   defaultOrderBy: [{ column: 'priority', ascending: false }]
// });
```

<!-- path: hooks/database/excel-queries/excel-helpers.ts -->
```typescript
// hooks/database/excel-queries.ts
import * as ExcelJS from "exceljs";
import { Filters, UploadResult } from "@/hooks/database";
import { AuthTableOrViewName, Row } from "@/hooks/database";

//================================================================================
// TYPES AND INTERFACES
//================================================================================

export interface Column<T> {
  key: string;
  title: string;
  dataIndex: string;
  width?: number | string;
  sortable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
  filterOptions?: { label: string; value: unknown }[];
  align?: "left" | "center" | "right";
  hidden?: boolean;
  excelFormat?: "text" | "number" | "date" | "currency" | "percentage" | "json";
  excludeFromExport?: boolean;
}

// Generic RPC Configuration that works with any function
export interface RPCConfig<TParams = Record<string, unknown>> {
  functionName: string;
  parameters?: TParams;
  selectFields?: string;
}

// NOTE: T refers to a table/view name. Columns should describe a Row<T>.
export interface DownloadOptions<
  T extends AuthTableOrViewName = AuthTableOrViewName
> {
  fileName?: string;
  filters?: Filters;
  columns?: Column<Row<T>>[];
  sheetName?: string;
  maxRows?: number;
  customStyles?: ExcelStyles;
  rpcConfig?: RPCConfig;
}

export interface ExcelStyles {
  headerFont?: Partial<ExcelJS.Font>;
  headerFill?: ExcelJS.FillPattern;
  dataFont?: Partial<ExcelJS.Font>;
  alternateRowFill?: ExcelJS.FillPattern;
  borderStyle?: Partial<ExcelJS.Borders>;
}

export interface ExcelDownloadResult {
  fileName: string;
  rowCount: number;
  columnCount: number;
}

export interface UseExcelDownloadOptions<
  T extends AuthTableOrViewName = AuthTableOrViewName
> {
  onSuccess?: (
    data: ExcelDownloadResult,
    variables: DownloadOptions<T>
  ) => void;
  onError?: (error: Error, variables: DownloadOptions<T>) => void;
  showToasts?: boolean;
  batchSize?: number;
  defaultRPCConfig?: RPCConfig;
}

// Enhanced error tracking interfaces
export interface ValidationError {
  rowIndex: number;
  column: string;
  value: unknown;
  error: string;
  data?: Record<string, unknown>;
}

export interface ProcessingLog {
  rowIndex: number;
  excelRowNumber: number;
  originalData: Record<string, unknown>;
  processedData: Record<string, unknown>;
  validationErrors: ValidationError[];
  isSkipped: boolean;
  skipReason?: string;
}

export interface EnhancedUploadResult extends UploadResult {
  processingLogs: ProcessingLog[];
  validationErrors: ValidationError[];
  skippedRows: number;
}

//================================================================================
// UTILITY FUNCTIONS
//================================================================================

export const createFillPattern = (color: string): ExcelJS.FillPattern => ({
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: color },
});

export const formatCellValue = <T = unknown>(
  value: unknown,
  column: Column<T>
): unknown => {
  if (value === null || value === undefined) return "";
  
  // Handle number types first
  if (typeof value === 'number') {
    return value;
  }
  
  // Handle object values
  if (typeof value === 'object' && value !== null) {
    // If it's a Date object
    if (value instanceof Date) {
      return value;
    }
    // If it's an array, join with comma
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    // For other objects, try to stringify
    try {
      const str = JSON.stringify(value);
      // If it's a JSON object string, parse and get a simple string representation
      if (str.startsWith('{') || str.startsWith('[')) {
        const parsed = JSON.parse(str);
        if (typeof parsed === 'object' && parsed !== null) {
          // For objects, get values and join
          if (Array.isArray(parsed)) {
            return parsed.join(', ');
          }
          return Object.values(parsed).filter(v => v !== undefined && v !== null).join(', ');
        }
        return String(parsed);
      }
      return str;
    } catch {
      return String(value);
    }
  }

  // Handle non-object values
  switch (column.excelFormat) {
    case "date":
      return value instanceof Date ? value : new Date(value as string);
    case "number":
      return typeof value === "string" ? parseFloat(value) || 0 : value;
    case "currency":
      return typeof value === "string"
        ? parseFloat(value.replace(/[^0-9.-]/g, "")) || 0
        : value;
    case "percentage":
      return typeof value === "number"
        ? value / 100
        : parseFloat(String(value)) / 100 || 0;
    case "json": {
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          return JSON.stringify(parsed);
        } catch {
          return value;
        }
      }
      return String(value);
    }
    default:
      return String(value);
  }
};

export const applyCellFormatting = <T = unknown>(
  cell: ExcelJS.Cell,
  column: Column<T>
): void => {
  switch (column.excelFormat) {
    case "date":
      cell.numFmt = "mm/dd/yyyy";
      break;
    case "currency":
      cell.numFmt = '"$"#,##0.00';
      break;
    case "percentage":
      cell.numFmt = "0.00%";
      break;
    case "number":
      cell.numFmt = "#,##0.00";
      break;
  }
  if (column.align) {
    cell.alignment = { horizontal: column.align };
  }
};

export const getDefaultStyles = (): ExcelStyles => ({
  headerFont: { bold: true, color: { argb: "FFFFFFFF" }, size: 12 },
  headerFill: createFillPattern("FF2563EB"),
  dataFont: { size: 11 },
  alternateRowFill: createFillPattern("FFF8F9FA"),
  borderStyle: {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  },
});

export const sanitizeFileName = (fileName: string): string => {
  return fileName.replace(/[^a-z0-9.-]/gi, "_").replace(/_{2,}/g, "_");
};

export const convertFiltersToRPCParams = (
  filters?: Filters
): Record<string, unknown> => {
  if (!filters) return {};

  const rpcParams: Record<string, unknown> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      rpcParams[key] = value;
    }
  });

  return rpcParams;
};

// Safe UUID generator: uses crypto.randomUUID if available, otherwise a lightweight fallback
export const generateUUID = (): string => {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g && g.crypto && typeof g.crypto.randomUUID === "function") {
    return g.crypto.randomUUID();
  }
  // RFC4122 version 4 fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Enhanced logging utilities
export const logRowProcessing = (
  rowIndex: number,
  excelRowNumber: number,
  originalData: Record<string, unknown>,
  processedData: Record<string, unknown>,
  validationErrors: ValidationError[] = [],
  isSkipped = false,
  skipReason?: string
): ProcessingLog => {
  const log: ProcessingLog = {
    rowIndex,
    excelRowNumber,
    originalData,
    processedData,
    validationErrors,
    isSkipped,
    skipReason,
  };

  console.group(`🔍 Processing Row ${excelRowNumber} (Index: ${rowIndex})`);
  console.log("📊 Original Data:", originalData);
  console.log("🔄 Processed Data:", processedData);

  if (validationErrors.length > 0) {
    console.warn("❌ Validation Errors:", validationErrors);
  }

  if (isSkipped) {
    console.warn("⏭️ Row Skipped:", skipReason);
  }

  console.groupEnd();

  return log;
};

export const logColumnTransformation = (
  rowIndex: number,
  column: string,
  originalValue: unknown,
  transformedValue: unknown,
  error?: string
): void => {
  console.log(`🔧 Column "${column}" (Row ${rowIndex + 2}):`);
  console.log(
    `   Original: ${JSON.stringify(originalValue)} (${typeof originalValue})`
  );
  console.log(
    `   Transformed: ${JSON.stringify(
      transformedValue
    )} (${typeof transformedValue})`
  );

  if (error) {
    console.error(`   ❌ Error: ${error}`);
  }
};

// Enhanced value validation
export const validateValue = (
  value: unknown,
  columnName: string,
  isRequired: boolean
): ValidationError | null => {
  if (isRequired) {
    const isEmpty =
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "");

    if (isEmpty) {
      return {
        rowIndex: -1, // Will be set by caller
        column: columnName,
        value,
        error: `Required field "${columnName}" is empty`,
      };
    }
  }

  // Type-specific validations
  if (value !== null && value !== undefined && value !== "") {
    // Check for UUID format if column suggests it's an ID
    if ((columnName === "id" || columnName.endsWith("_id") ) && columnName !== "transnet_id") {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const strValue = String(value).trim();
      if (strValue && !uuidRegex.test(strValue) && strValue !== "") {
        return {
          rowIndex: -1,
          column: columnName,
          value,
          error: `Invalid UUID format for "${columnName}": ${strValue}`,
        };
      }
    }

    // Check for email format
    if (columnName.toLowerCase().includes("email")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const strValue = String(value).trim();
      if (strValue && !emailRegex.test(strValue)) {
        return {
          rowIndex: -1,
          column: columnName,
          value,
          error: `Invalid email format for "${columnName}": ${strValue}`,
        };
      }
    }

    // Check for IP address format
    const isIPField =
      columnName === "ip_address" ||
      columnName.endsWith("_ip") ||
      columnName.includes("ipaddr");
    if (isIPField) {
      const ipRegex =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      const strValue = String(value).trim();
      if (strValue && !ipRegex.test(strValue)) {
        return {
          rowIndex: -1,
          column: columnName,
          value,
          error: `Invalid IP address format for "${columnName}": ${strValue}`,
        };
      }
    }
  }

  return null;
};

```

<!-- path: hooks/database/excel-queries/index.ts -->
```typescript
export * from "./excel-download";
export * from "./excel-upload";
```

<!-- path: hooks/database/excel-queries/excel-upload.ts -->
```typescript
import * as XLSX from "xlsx";
import { TableInsert, TableName, UploadOptions, UseExcelUploadOptions } from "../queries-type-helpers";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase-types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EnhancedUploadResult, generateUUID, logColumnTransformation, logRowProcessing, ProcessingLog, validateValue, ValidationError } from "./excel-helpers";
import { toast } from "sonner";

//================================================================================
// UPLOAD FUNCTIONS
//================================================================================

/**
 * Reads a File object and returns its contents as a 2D array using xlsx.
 * @param file The File object to read.
 * @returns A Promise that resolves to a 2D array of the sheet data.
 */
const parseExcelFile = (file: File): Promise<unknown[][]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
  
      reader.onload = (event: ProgressEvent<FileReader>) => {
        try {
          if (!event.target?.result) {
            throw new Error("File reading failed.");
          }
          const buffer = event.target.result as ArrayBuffer;
          const workbook = XLSX.read(buffer, { type: "array" });
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];
          if (!worksheet) {
            throw new Error("No worksheet found in the file.");
          }
          // header: 1 tells sheet_to_json to return an array of arrays
          // defval: '' preserves empty cells so column indices stay aligned
          const data = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
            header: 1,
            defval: "",
          });
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
  
      reader.onerror = (error) => {
        reject(new Error(`FileReader error: ${error.type}`));
      };
  
      reader.readAsArrayBuffer(file);
    });
  };
  
  //================================================================================
  // MAIN ENHANCED UPLOAD HOOK
  //================================================================================
  
  /**
   * Enhanced React hook for uploading data from an Excel file to a Supabase table using 'xlsx'.
   * Includes comprehensive logging and error tracking.
   */
  export function useExcelUpload<T extends TableName>(
    supabase: SupabaseClient<Database>,
    tableName: T,
    options?: UseExcelUploadOptions<T>
  ) {
    const {
      showToasts = true,
      batchSize = 500,
      ...mutationOptions
    } = options || {};
    const queryClient = useQueryClient();
  
    return useMutation<EnhancedUploadResult, Error, UploadOptions<T>>({
      mutationFn: async (
        uploadOptions: UploadOptions<T>
      ): Promise<EnhancedUploadResult> => {
        const {
          file,
          columns,
          uploadType = "upsert",
          conflictColumn,
        } = uploadOptions;
  
        console.group("🚀 Excel Upload Process Started");
        console.log("📁 File:", file.name, `(${file.size} bytes)`);
        console.log("🎯 Table:", tableName);
        console.log("📋 Upload Type:", uploadType);
        console.log("🔑 Conflict Column:", conflictColumn);
        console.log("📊 Column Mappings:", columns);
  
        if (uploadType === "upsert" && !conflictColumn) {
          throw new Error(
            "A 'conflictColumn' must be specified for 'upsert' operations."
          );
        }
  
        const processingLogs: ProcessingLog[] = [];
        const allValidationErrors: ValidationError[] = [];
  
        toast.info("Reading and parsing Excel file...");
  
        // 1. Parse the Excel file using our xlsx utility function
        const jsonData = await parseExcelFile(file);
  
        console.log("📊 Raw Excel Data:", {
          totalRows: jsonData.length,
          headers: jsonData[0],
          sampleData: jsonData.slice(1, 4), // Show first 3 data rows
        });
  
        if (!jsonData || jsonData.length < 2) {
          toast.warning(
            "No data found in the Excel file. (A header row and at least one data row are required)."
          );
          console.groupEnd();
          return { 
            successCount: 0, 
            errorCount: 0, 
            totalRows: 0, 
            errors: [],
            processingLogs,
            validationErrors: allValidationErrors,
            skippedRows: 0,
          };
        }
  
        // 2. Map Excel headers to their column index for efficient lookup
        const excelHeaders: string[] = jsonData[0] as string[];
        const headerMap: Record<string, number> = {};
        console.log("📝 Excel Headers:", excelHeaders);
        
        excelHeaders.forEach((header, index) => {
          const cleanHeader = String(header).trim().toLowerCase();
          headerMap[cleanHeader] = index;
          console.log(`   [${index}]: "${header}" -> "${cleanHeader}"`);
        });
        
        const isFirstColumnId =
          String(excelHeaders?.[0] ?? "").toLowerCase() === "id";
        console.log("🆔 First column is ID:", isFirstColumnId);
  
        // 3. Validate that all required columns from the mapping exist in the file
        const getHeaderIndex = (name: string): number | undefined =>
          headerMap[String(name).trim().toLowerCase()];
  
        console.group("🔍 Column Mapping Validation");
        for (const mapping of columns) {
          const idx = getHeaderIndex(mapping.excelHeader);
          console.log(`📍 "${mapping.excelHeader}" -> "${mapping.dbKey}":`, 
            idx !== undefined ? `Column ${idx}` : "❌ NOT FOUND");
          
          // Allow missing 'id' header so we can auto-generate UUIDs during processing
          if (idx === undefined && mapping.dbKey !== "id") {
            console.error(`❌ Required column "${mapping.excelHeader}" not found in Excel file`);
            throw new Error(
              `Required column "${mapping.excelHeader}" not found in the Excel file.`
            );
          }
        }
        console.groupEnd();
  
        toast.info(
          `Found ${jsonData.length - 1} rows. Preparing data for upload...`
        );
  
        // 4. Process rows and transform data into the format for Supabase
        const dataRows = jsonData.slice(1);
  
        // Helper: determine if a row is effectively empty (ignoring 'id')
        const isRowEffectivelyEmpty = (row: unknown[]): boolean => {
          for (const mapping of columns) {
            if (mapping.dbKey === "id") continue; // ignore id when checking emptiness
            const idx = getHeaderIndex(mapping.excelHeader);
            const v = idx !== undefined ? row[idx] : undefined;
            if (v !== undefined && String(v).trim() !== "") {
              return false; // has some non-empty value in a non-id column
            }
          }
          return true;
        };
  
        // Filter out rows that are empty across all non-id columns, keep index for error reporting
        const filteredRows = dataRows
          .map((row, idx) => ({ row: row as unknown[], idx }))
          .filter(({ row }) => !isRowEffectivelyEmpty(row));
  
        console.log(`🎯 Filtered ${dataRows.length} rows down to ${filteredRows.length} non-empty rows`);
  
        // Initialize upload result early to record pre-insert validation errors
        const uploadResult: EnhancedUploadResult = {
          successCount: 0,
          errorCount: 0,
          totalRows: 0,
          errors: [],
          processingLogs,
          validationErrors: allValidationErrors,
          skippedRows: 0,
        };
  
        let recordsToProcess: TableInsert<T>[] = [];

        // Helpers capture the hook's generic T via closure over tableName
        const insertBatch = async (
          rows: TableInsert<T>[]
        ) => {
          // T is a generic (union of table names) here; Supabase's overloads require a concrete table literal.
          // A localized cast is used to bridge this at the single boundary to Supabase.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return supabase.from(tableName).insert(rows as any);
        };

        const upsertBatch = async (
          rows: TableInsert<T>[],
          onConflict: string
        ) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return supabase.from(tableName).upsert(rows as any, { onConflict });
        };

        const upsertOne = async (
          row: TableInsert<T>,
          onConflict: string
        ) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return supabase.from(tableName).upsert(row as any, { onConflict });
        };
  
        console.group("🔄 Row Processing Phase");
        
        for (let i = 0; i < filteredRows.length; i++) {
          const { row, idx } = filteredRows[i];
          const excelRowNumber = idx + 2; // +2 because Excel is 1-indexed and we skip header
          
          const originalData: Record<string, unknown> = {};
          const processedData: Record<string, unknown> = {};
          const rowValidationErrors: ValidationError[] = [];
          let isSkipped = false;
          let skipReason: string | undefined;
  
          // Build original data object for logging
          excelHeaders.forEach((header, headerIdx) => {
            originalData[header] = row[headerIdx];
          });
  
          // Secondary safeguard: determine if row has any meaningful non-id value
          const rowHasContent = columns.some((mapping) => {
            if (mapping.dbKey === "id") return false;
            const idx = getHeaderIndex(mapping.excelHeader);
            const v = idx !== undefined ? row[idx] : undefined;
            return v !== undefined && String(v).trim() !== "";
          });
  
          if (!rowHasContent) {
            // Skip rows that are effectively empty across non-id columns
            isSkipped = true;
            skipReason = "Row is empty across all non-id columns";
            uploadResult.skippedRows++;
            
            const log = logRowProcessing(
              i, 
              excelRowNumber, 
              originalData, 
              processedData, 
              rowValidationErrors, 
              isSkipped, 
              skipReason
            );
            processingLogs.push(log);
            continue;
          }
  
          // Process each column mapping
          for (const mapping of columns) {
            const colIndex = getHeaderIndex(mapping.excelHeader);
            // Guard: only index row when we have a valid column index
            let rawValue = colIndex !== undefined ? row[colIndex] : undefined;
  
            console.group(`🔧 Processing "${mapping.dbKey}" (Excel: "${mapping.excelHeader}")`);
            console.log(`📍 Column Index: ${colIndex}`);
            console.log(`📊 Raw Value:`, rawValue, `(${typeof rawValue})`);
  
            try {
              // Normalize empty strings to null for UUID-like fields
              if (
                (mapping.dbKey === "id" ||
                  mapping.dbKey.endsWith("_id") ||
                  mapping.dbKey === "parent_id") &&
                (rawValue === "" || rawValue === undefined)
              ) {
                rawValue = null;
                console.log("🔄 Normalized empty UUID field to null");
              }
  
              // Normalize IP address-like fields for inet columns: trim and empty -> null
              // Targets include: 'ip_address', any key ending with '_ip', or containing 'ipaddr'
              {
                const key = String(mapping.dbKey || "").toLowerCase();
                const isIPField =
                  key === "ip_address" ||
                  key.endsWith("_ip") ||
                  key.includes("ipaddr");
                if (isIPField && typeof rawValue === "string") {
                  const trimmed = rawValue.trim();
                  rawValue = trimmed === "" ? null : trimmed;
                  console.log("🌐 Processed IP field:", rawValue);
                }
              }
  
              // Only generate a UUID for `id` if the row actually has content
              if (mapping.dbKey === "id" && rowHasContent) {
                // If first Excel column is id/ID and current mapping is for 'id', auto-generate UUID when empty
                if (
                  isFirstColumnId &&
                  (rawValue === null ||
                    rawValue === undefined ||
                    String(rawValue).trim() === "")
                ) {
                  rawValue = generateUUID();
                  console.log("🆔 Generated UUID for empty ID:", rawValue);
                }
                // If 'id' header is entirely missing, still generate a UUID
                if (colIndex === undefined) {
                  rawValue = generateUUID();
                  console.log("🆔 Generated UUID for missing ID column:", rawValue);
                }
              }
  
              // Use the transform function if available, otherwise use the raw value
              let finalValue: unknown;
              if (mapping.transform) {
                try {
                  finalValue = mapping.transform(rawValue);
                  console.log("🔧 Transformed value:", finalValue, `(${typeof finalValue})`);
                } catch (transformError) {
                  const errorMsg = transformError instanceof Error 
                    ? transformError.message 
                    : "Transform function failed";
                  console.error("❌ Transform error:", errorMsg);
                  
                  const validationError: ValidationError = {
                    rowIndex: i,
                    column: mapping.dbKey,
                    value: rawValue,
                    error: `Transform failed for "${mapping.dbKey}": ${errorMsg}`,
                  };
                  rowValidationErrors.push(validationError);
                  allValidationErrors.push(validationError);
                  finalValue = rawValue; // Use raw value as fallback
                }
              } else {
                finalValue = rawValue;
              }
  
              // Validate the processed value
              const validationError = validateValue(
                finalValue, 
                mapping.dbKey, 
                mapping.required || false
              );
              
              if (validationError) {
                validationError.rowIndex = i;
                rowValidationErrors.push(validationError);
                allValidationErrors.push(validationError);
                console.error("❌ Validation failed:", validationError.error);
              }
  
              // Assign the processed value to the correct database key
              // Normalize empty strings to null to satisfy numeric/date/inet columns
              let assignValue =
                finalValue !== undefined
                  ? finalValue
                  : rawValue !== undefined
                  ? rawValue
                  : null;
              
              if (typeof assignValue === "string" && assignValue.trim() === "") {
                assignValue = null;
                console.log("🧹 Normalized empty string to null");
              }
              
              processedData[mapping.dbKey] = assignValue;
              console.log("✅ Final assigned value:", assignValue, `(${typeof assignValue})`);
  
              logColumnTransformation(
                i,
                mapping.dbKey,
                rawValue,
                assignValue
              );
  
            } catch (columnError) {
              const errorMsg = columnError instanceof Error 
                ? columnError.message 
                : "Unknown column processing error";
              console.error("💥 Column processing error:", errorMsg);
              
              const validationError: ValidationError = {
                rowIndex: i,
                column: mapping.dbKey,
                value: rawValue,
                error: `Column processing failed: ${errorMsg}`,
              };
              rowValidationErrors.push(validationError);
              allValidationErrors.push(validationError);
            } finally {
              console.groupEnd();
            }
          }
  
          // Check if row has validation errors
          const hasRequiredFieldErrors = rowValidationErrors.some(err => 
            err.error.includes("Required field") || err.error.includes("Missing required")
          );
  
          if (hasRequiredFieldErrors) {
            // Record a validation error for this row and skip it
            isSkipped = true;
            skipReason = `Validation failed: ${rowValidationErrors.map(e => e.error).join("; ")}`;
            uploadResult.errorCount += 1;
            uploadResult.skippedRows++;
            
            uploadResult.errors.push({
              rowIndex: excelRowNumber,
              data: processedData as Record<string, unknown>,
              error: skipReason,
            });
          } else {
            // Add to records to process
            recordsToProcess.push(processedData as TableInsert<T>);
          }
  
          // Log the complete row processing
          const log = logRowProcessing(
            i,
            excelRowNumber,
            originalData,
            processedData,
            rowValidationErrors,
            isSkipped,
            skipReason
          );
          processingLogs.push(log);
        }
        
        console.groupEnd(); // End Row Processing Phase
  
        console.log(`📊 Processing Summary:`);
        console.log(`   Total filtered rows: ${filteredRows.length}`);
        console.log(`   Records to process: ${recordsToProcess.length}`);
        console.log(`   Skipped rows: ${uploadResult.skippedRows}`);
        console.log(`   Validation errors: ${allValidationErrors.length}`);
  
        // Deduplicate by conflict columns to avoid Postgres error:
        // "ON CONFLICT DO UPDATE command cannot affect row a second time"
        if (uploadType === "upsert" && conflictColumn) {
          console.group("🔄 Deduplication Process");
          
          const conflictCols = String(conflictColumn)
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
  
          console.log("🎯 Conflict columns:", conflictCols);
  
          if (conflictCols.length > 0) {
            const seen = new Set<string>();
            const deduped: TableInsert<T>[] = [];
            let duplicateCount = 0;
            
            for (const rec of recordsToProcess) {
              const values = conflictCols.map((c) => (rec as Record<string, unknown>)[c]);
              const allPresent = values.every(
                (v) =>
                  v !== undefined &&
                  v !== null &&
                  !(typeof v === "string" && v === "")
              );
              
              if (!allPresent) {
                // Do not dedupe records missing conflict values; still avoid PK updates on composite keys
                if (!conflictCols.includes("id")) {
                  delete (rec as Record<string, unknown>).id;
                }
                deduped.push(rec);
                console.log("➕ Added record with missing conflict values (no deduplication)");
                continue;
              }
  
              // Normalize strings for dedupe to match DB uniqueness (trim + lowercase)
              const normalized = values.map((v) =>
                typeof v === "string" ? v.trim().toLowerCase() : v
              );
              const key = JSON.stringify(normalized);
              
              if (!seen.has(key)) {
                seen.add(key);
                if (!conflictCols.includes("id")) {
                  delete (rec as Record<string, unknown>).id;
                }
                deduped.push(rec);
                console.log(`➕ Added unique record with key: ${key}`);
              } else {
                duplicateCount++;
                console.log(`⏭️  Skipped duplicate record with key: ${key}`);
              }
            }
            
            console.log(`📊 Deduplication results:`);
            console.log(`   Original records: ${recordsToProcess.length}`);
            console.log(`   After deduplication: ${deduped.length}`);
            console.log(`   Duplicates removed: ${duplicateCount}`);
            
            recordsToProcess = deduped;
          }
          
          console.groupEnd();
        }
  
        // 5. Perform batch upload to Supabase
        uploadResult.totalRows = recordsToProcess.length;
        console.log(`🚀 Starting Supabase upload for ${uploadResult.totalRows} records`);
  
        if (recordsToProcess.length === 0) {
          console.log("⚠️ No records to upload after processing");
          toast.warning("No valid records found to upload after processing.");
          console.groupEnd();
          return uploadResult;
        }
  
        console.group("📤 Supabase Upload Process");
  
        for (let i = 0; i < recordsToProcess.length; i += batchSize) {
          const batch = recordsToProcess.slice(i, i + batchSize);
          const progress = Math.round(
            ((i + batch.length) / recordsToProcess.length) * 100
          );
          toast.info(`Uploading batch ${Math.floor(i / batchSize) + 1}... (${progress}%)`);
          
          console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}:`);
          console.log(`   Range: ${i} - ${i + batch.length - 1}`);
          console.log(`   Batch size: ${batch.length}`);
          console.log(`   Progress: ${progress}%`);
          console.log("📊 Batch data sample:", batch.slice(0, 2)); // Show first 2 records
  
          // If using composite conflict keys, upsert rows one-by-one to avoid
          // "ON CONFLICT DO UPDATE command cannot affect row a second time"
          const isCompositeConflict =
            uploadType === "upsert" &&
            conflictColumn &&
            String(conflictColumn).split(",").length > 1;
            
          if (isCompositeConflict) {
            console.log("🔄 Using individual upserts for composite conflict keys");
            
            for (let j = 0; j < batch.length; j++) {
              const row = batch[j];
              console.log(`📝 Upserting individual record ${i + j + 1}:`, row);
              
              try {
                const { error } = await upsertOne(row as TableInsert<T>, conflictColumn as string);
                  
                if (error) {
                  console.error(`❌ Individual upsert failed for record ${i + j + 1}:`, error);
                  uploadResult.errorCount += 1;
                  uploadResult.errors.push({
                    rowIndex: i + j,
                    data: row as Record<string, unknown>,
                    error: error.message,
                  });
                  if (showToasts) {
                    toast.error(
                      `Error at record ${i + j + 1}: ${error.message}`
                    );
                  }
                } else {
                  console.log(`✅ Individual upsert successful for record ${i + j + 1}`);
                  uploadResult.successCount += 1;
                }
              } catch (unexpectedError) {
                const errorMsg = unexpectedError instanceof Error 
                  ? unexpectedError.message 
                  : "Unexpected error during individual upsert";
                console.error(`💥 Unexpected error during individual upsert:`, unexpectedError);
                uploadResult.errorCount += 1;
                uploadResult.errors.push({
                  rowIndex: i + j,
                  data: row as Record<string, unknown>,
                  error: errorMsg,
                });
              }
            }
            continue;
          }
  
          // Regular batch processing
          console.log(`🚀 Executing batch ${uploadType} operation`);
          
          try {
            let query;
            if (uploadType === "insert") {
              console.log("➕ Using INSERT operation");
              query = insertBatch(batch as TableInsert<T>[]);
            } else {
              console.log(`🔄 Using UPSERT operation with conflict: ${conflictColumn}`);
              query = upsertBatch(batch as TableInsert<T>[], conflictColumn as string);
            }
  
            const { error } = await query;
            
            if (error) {
              // Handle foreign key constraint violation specifically
              if (error.code === '23503' && error.message.includes('ofc_cables_sn_id_fkey')) {
                // Type-safe access to sn_id
                type RecordWithSnId = { sn_id?: unknown };
                const getSnId = (record: unknown): string | undefined => {
                  if (record && typeof record === 'object' && 'sn_id' in record) {
                    const value = (record as RecordWithSnId).sn_id;
                    return value !== null && value !== undefined ? String(value) : undefined;
                  }
                  return undefined;
                };
                
                // Extract all unique sn_ids from the batch that caused the error
                const invalidSnIds = [...new Set(
                  batch.map(record => getSnId(record)).filter((id): id is string => Boolean(id))
                )];
                
                // Log detailed error information
                console.error('Foreign key violation details:', {
                  table: tableName,
                  constraint: 'ofc_cables_sn_id_fkey',
                  invalidValues: invalidSnIds,
                  error: error.message
                });
                
                // Add validation errors for each affected row
                batch.forEach((record, index) => {
                  const snId = getSnId(record);
                  if (snId) {
                    uploadResult.validationErrors.push({
                      rowIndex: i + index,
                      column: 'sn_id',
                      value: snId,
                      error: `Foreign key violation: sn_id '${snId}' does not exist in the nodes table`,
                      data: { column: 'sn_id', value: snId, constraint: 'ofc_cables_sn_id_fkey' }
                    });
                  }
                });
                
                // Add a summary error to the upload result
                const errorMessage = `Foreign key violation: ${invalidSnIds.length} invalid sn_id value(s) found in batch. ` +
                  `Invalid values: ${invalidSnIds.join(', ')}`;
                uploadResult.errorCount += batch.length;
                uploadResult.errors.push({
                  rowIndex: i,
                  data: batch,
                  error: errorMessage
                });
                
                // Show user-friendly error message
                if (showToasts) {
                  toast.error(
                    `Foreign key violation: ${invalidSnIds.length} invalid sn_id value(s) found. ` +
                    'Check the console for details.',
                    { duration: 10000 }
                  );
                }
              } else {
                // Handle other types of errors
                const errorDetails: Record<string, unknown> = {};
                if (error.code === '23503') {
                  errorDetails.constraint = error.message.match(/constraint "(.*?)"/)?.[1];
                  errorDetails.detail = error.message;
                }
                
                uploadResult.errorCount += batch.length;
                uploadResult.errors.push({
                  rowIndex: i,
                  data: batch,
                  error: error.message,
                  ...(Object.keys(errorDetails).length > 0 ? { details: errorDetails } : {})
                });
                
                if (showToasts) {
                  toast.error(`Error in batch starting at record ${i + 1}: ${error.message}`);
                }
              }
            } else {
              console.log(`✅ Batch operation successful for ${batch.length} records`);
              uploadResult.successCount += batch.length;
            }
          } catch (unexpectedError) {
            const errorMsg = unexpectedError instanceof Error 
              ? unexpectedError.message 
              : "Unexpected error during batch operation";
            console.error(`💥 Unexpected error during batch operation:`, unexpectedError);
            uploadResult.errorCount += batch.length;
            uploadResult.errors.push({
              rowIndex: i,
              data: batch,
              error: errorMsg,
            });
          }
        }
        
        console.groupEnd(); // End Supabase Upload Process
  
        // 6. Finalize and report
        console.group("📊 Upload Results Summary");
        console.log(`✅ Successful uploads: ${uploadResult.successCount}`);
        console.log(`❌ Failed uploads: ${uploadResult.errorCount}`);
        console.log(`⏭️  Skipped rows: ${uploadResult.skippedRows}`);
        console.log(`📝 Total processing logs: ${processingLogs.length}`);
        console.log(`⚠️  Total validation errors: ${allValidationErrors.length}`);
        
        if (uploadResult.errors.length > 0) {
          console.log("🔍 Upload errors:", uploadResult.errors);
        }
        
        if (allValidationErrors.length > 0) {
          console.log("🔍 Validation errors:", allValidationErrors);
        }
        console.groupEnd();
  
        if (uploadResult.errorCount > 0) {
          if (showToasts) {
            toast.warning(
              `${uploadResult.successCount} rows uploaded successfully, but ${uploadResult.errorCount} failed. Check console for details.`
            );
          }
        } else {
          if (showToasts) {
            toast.success(
              `Successfully uploaded ${uploadResult.successCount} of ${uploadResult.totalRows} records.`
            );
          }
          
          // Invalidate related queries instead of reloading the page to preserve UI state
          try {
            await queryClient.invalidateQueries({
              predicate: (q) => {
                const key = q.queryKey as unknown[];
                if (!Array.isArray(key)) return false;
                // Match if any segment equals the tableName or contains it as a substring (to catch views/RPC keys like "v_ofc_cables_complete")
                return key.some((seg) => {
                  if (seg === tableName) return true;
                  if (typeof seg === "string" && seg.toLowerCase().includes(String(tableName).toLowerCase())) return true;
                  return false;
                });
              },
            });
            // Force refetch so UI reflects changes immediately even if staleTime is large
            await queryClient.refetchQueries({
              predicate: (q) => {
                const key = q.queryKey as unknown[];
                if (!Array.isArray(key)) return false;
                return key.some((seg) => {
                  if (seg === tableName) return true;
                  if (typeof seg === "string" && seg.toLowerCase().includes(String(tableName).toLowerCase())) return true;
                  return false;
                });
              },
              type: "active",
            });
            console.log("✅ Query cache invalidated successfully");
          } catch (err) {
            console.warn("⚠️ Failed to invalidate queries after upload", err);
          }
        }
  
        console.groupEnd(); // End Excel Upload Process
        return uploadResult;
      },
      ...mutationOptions,
    });
  }
```

