// hooks/database/ring-provisioning-hooks.ts
"use client";

import { createClient } from "@/utils/supabase/client";
import { ofc_cablesRowSchema } from "@/schemas/zod-schemas";
import { z } from "zod";
import { useLocalFirstQuery } from "@/hooks/data/useLocalFirstQuery";
import { useOfflineQuery } from "@/hooks/data/useOfflineQuery";
import { localDb } from "@/hooks/data/localDb";

const supabase = createClient();

export function useRingsForSelection() {
  const onlineQueryFn = async () => {
    const { data, error } = await supabase
      .from("rings")
      .select("*")
      .order("name");
    if (error) throw error;
    return data ||[];
  };

  const localQueryFn = () => localDb.rings.orderBy("name").toArray();

  return useLocalFirstQuery<"rings">({
    queryKey: ["rings-for-selection"],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.rings,
  });
}

export interface RingConnectionPath {
    id: string;
    name: string;
    ring_id: string | null;
    start_node_id: string | null;
    end_node_id: string | null;
    source_system_id: string | null;
    destination_system_id: string | null;
    source_port: string | null;
    destination_port: string | null;
    status: string | null;
    created_at: string | null;
    updated_at: string | null;
    start_node: { name: string } | null;
    end_node: { name: string } | null;
    source_system: { system_name: string } | null;
    destination_system: { system_name: string } | null;
}

export function useRingConnectionPaths(ringId: string | null) {
  const onlineQueryFn = async (): Promise<RingConnectionPath[]> => {
    if (!ringId) return[];
    const { data, error } = await supabase
      .from("logical_paths")
      .select(
        `
            *,
            start_node:start_node_id(name),
            end_node:end_node_id(name),
            source_system:source_system_id(system_name),
            destination_system:destination_system_id(system_name)
        `,
      )
      .eq("ring_id", ringId)
      .order("name");
    if (error) throw error;

    return (data ||[]).map((row: Record<string, unknown>) => ({
      ...row,
      start_node: row.start_node as { name: string } | null,
      end_node: row.end_node as { name: string } | null,
      source_system: row.source_system as { system_name: string } | null,
      destination_system: row.destination_system as { system_name: string } | null,
    })) as RingConnectionPath[];
  };

  const offlineQueryFn = async (): Promise<RingConnectionPath[]> => {
    if (!ringId) return[];
    const paths = await localDb.logical_paths
      .where("ring_id")
      .equals(ringId)
      .toArray();

    const nodeIds = new Set<string>();
    const systemIds = new Set<string>();

    paths.forEach((p) => {
      if (p.start_node_id) nodeIds.add(p.start_node_id);
      if (p.end_node_id) nodeIds.add(p.end_node_id);
      if (p.source_system_id) systemIds.add(p.source_system_id);
      if (p.destination_system_id) systemIds.add(p.destination_system_id);
    });

    const nodes = await localDb.nodes
      .where("id")
      .anyOf(Array.from(nodeIds))
      .toArray();
    const systems = await localDb.systems
      .where("id")
      .anyOf(Array.from(systemIds))
      .toArray();

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const systemMap = new Map(systems.map((s) => [s.id, s]));

    return paths.map((p) => ({
      ...p,
      start_node: p.start_node_id
        ? { name: nodeMap.get(p.start_node_id)?.name || "Unknown" }
        : null,
      end_node: p.end_node_id
        ? { name: nodeMap.get(p.end_node_id)?.name || "Unknown" }
        : null,
      source_system: p.source_system_id
        ? {
            system_name:
              systemMap.get(p.source_system_id)?.system_name || "Unknown",
          }
        : null,
      destination_system: p.destination_system_id
        ? {
            system_name:
              systemMap.get(p.destination_system_id)?.system_name || "Unknown",
          }
        : null,
    }));
  };

  return useOfflineQuery<RingConnectionPath[]>(
    ["ring-connection-paths", ringId],
    onlineQueryFn,
    offlineQueryFn,
    { enabled: !!ringId },
  );
}

const lenientCableSchema = ofc_cablesRowSchema.extend({
  created_at: z
    .string()
    .nullable()
    .transform((val) => (val ? new Date(val).toISOString() : null)),
  updated_at: z
    .string()
    .nullable()
    .transform((val) => (val ? new Date(val).toISOString() : null)),
});

export function useAvailableCables(nodeId: string | null) {
  const onlineQueryFn = async () => {
    const { data, error } = await supabase.rpc(
      "get_available_cables_for_node",
      { p_node_id: nodeId! },
    );
    if (error) throw error;
    const parsed = z.array(lenientCableSchema).safeParse(data);
    if (!parsed.success) throw new Error("Invalid data for available cables");
    return parsed.data;
  };

  const localQueryFn = async () => {
    return localDb.ofc_cables
      .where("sn_id")
      .equals(nodeId!)
      .or("en_id")
      .equals(nodeId!)
      .toArray();
  };

  return useLocalFirstQuery<"ofc_cables">({
    queryKey:["available-cables", nodeId],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.ofc_cables,
    enabled: !!nodeId,
  });
}

export function useAvailableFibers(cableId: string | null) {
  const onlineQueryFn = async () => {
    const { data, error } = await supabase.rpc(
      "get_available_fibers_for_cable",
      { p_cable_id: cableId! },
    );
    if (error) throw error;
    return data as { fiber_no: number }[];
  };

  const offlineQueryFn = async () => {
    const fibers = await localDb.ofc_connections
      .where("ofc_id")
      .equals(cableId!)
      .filter((f) => f.system_id === null && f.status === true)
      .toArray();
    return fibers.map((f) => ({ fiber_no: f.fiber_no_sn }));
  };

  return useOfflineQuery(
    ["available-fibers", cableId],
    onlineQueryFn,
    offlineQueryFn,
    { enabled: !!cableId },
  );
}