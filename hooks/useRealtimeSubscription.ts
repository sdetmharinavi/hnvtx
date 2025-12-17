// hooks/useRealtimeSubscription.ts
"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

// Map of DB table names to React Query keys (matches keys in hooks/data/*)
const TABLE_TO_QUERY_KEY_MAP: Record<string, string[]> = {
  users: ['admin-users'],
  user_profiles: ['user_profiles-data'],
  employees: ['employees-data', 'v_employees'],
  inventory_items: ['inventory_items-data', 'v_inventory_items'],
  inventory_transactions: ['inventory-history'],
  systems: ['systems-data', 'v_systems_complete'],
  nodes: ['nodes-data', 'v_nodes_complete'],
  ofc_cables: ['ofc_cables-data', 'v_ofc_cables_complete', 'ofc-routes-for-selection'],
  ofc_connections: ['ofc_connections-data', 'v_ofc_connections_complete', 'available-fibers'],
  system_connections: ['system_connections-data', 'v_system_connections_complete', 'all-system-connections'],
  rings: ['rings-manager-data', 'v_rings'],
  ring_based_systems: ['ring-systems-data'],
  diary_notes: ['diary_data-for-month'],
  e_files: ['e-files'],
  file_movements: ['e-file-details'],
  logical_paths: ['ring-connection-paths'],
  maintenance_areas: ['maintenance_areas-data'],
  lookup_types: ['lookup_types-data', 'categories-data-all']
};

/**
 * Subscribes to global database changes and invalidates relevant React Query caches.
 * This keeps the UI in sync with server state in real-time.
 */
export function useRealtimeSubscription() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  
  // Use a ref to debounce rapid-fire events (e.g. bulk uploads)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const pendingTables = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Safety guard: Do not attempt connection if offline
    if (!isOnline) return;

    // console.log("[Realtime] Setting up subscription...");

    const channel = supabase
      .channel("db-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
        },
        (payload) => {
          const tableName = payload.table;
          
          // Add table to pending set
          pendingTables.current.add(tableName);

          // Debounce the invalidation
          if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
          }

          debounceTimeout.current = setTimeout(() => {
            const tablesToInvalidate = Array.from(pendingTables.current);
            pendingTables.current.clear();
            
            let invalidatedCount = 0;

            tablesToInvalidate.forEach((tbl) => {
              const queryKeys = TABLE_TO_QUERY_KEY_MAP[tbl];
              
              if (queryKeys) {
                // Invalidate specific keys mapped to this table
                queryKeys.forEach(key => {
                   queryClient.invalidateQueries({ queryKey: [key] });
                });
                invalidatedCount++;
              } else {
                // Fallback: Invalidate by table name directly if no map exists
                // This covers useTableQuery hooks that use ['table', tableName]
                queryClient.invalidateQueries({ queryKey: ['table', tbl] });
                // Also invalidate View versions commonly used
                queryClient.invalidateQueries({ queryKey: ['table', `v_${tbl}`] });
                // Try Generic data hook pattern
                queryClient.invalidateQueries({ queryKey: [`${tbl}-data`] });
                invalidatedCount++;
              }
            });

            if (invalidatedCount > 0) {
                // console.log(`[Realtime] Invalidated queries for: ${tablesToInvalidate.join(', ')}`);
            }

          }, 1000); // Wait 1 second before processing batch to allow bulk updates to finish
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
           // console.log("[Realtime] Connected.");
        }
      });

    return () => {
      supabase.removeChannel(channel);
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [supabase, queryClient, isOnline]);
}