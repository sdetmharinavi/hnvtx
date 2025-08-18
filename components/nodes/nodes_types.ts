import { z } from "zod";
import { Database, TablesInsert } from "@/types/supabase-types";

// Base Node type from database
export type Node = Database["public"]["Tables"]["nodes"]["Row"];
export type NodeInsert = TablesInsert<"nodes">;

// Node with relations for display purposes
export interface NodeWithRelations extends Node {
  node_type: NodeType | null;
  ring?: Ring | null;
  maintenance_terminal?: MaintenanceTerminal | null;
}

// Node form schema (excludes timestamp fields for form usage)
export const nodeFormSchema = z.object({
  name: z.string().min(1, { message: "Node name is required." }),
  node_type_id: z.string().uuid().optional().nullable(),
  ip_address: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  vlan: z.string().optional().nullable(),
  site_id: z.string().optional().nullable(),
  builtup: z.string().optional().nullable(),
  maintenance_terminal_id: z.string().uuid().optional().nullable(),
  ring_id: z.string().uuid().optional().nullable(),
  order_in_ring: z.number().int().optional().nullable(),
  ring_status: z.string().optional().nullable(),
  east_port: z.string().optional().nullable(),
  west_port: z.string().optional().nullable(),
  remark: z.string().optional().nullable(),
  status: z.boolean(),
});

export type NodeForm = z.infer<typeof nodeFormSchema>;

// Empty form data for new nodes
export const EMPTY_FORM_DATA: NodeForm = {
  name: "",
  node_type_id: null,
  ip_address: null,
  latitude: null,
  longitude: null,
  vlan: null,
  site_id: null,
  builtup: null,
  maintenance_terminal_id: null,
  ring_id: null,
  order_in_ring: null,
  ring_status: null,
  east_port: null,
  west_port: null,
  remark: null,
  status: true,
};

// Supporting types
export interface NodeType {
  id: string;
  name: string;
  category: string;
  code?: string | null;
}

export interface Ring {
  id: string;
  name: string;
  code?: string | null;
}

export interface MaintenanceTerminal {
  id: string;
  name: string;
  code?: string | null;
}

export interface NodesFilters {
  status?: string;
  nodeType?: string;
}

export interface NodesPagination {
  current: number;
  pageSize: number;
  total: number;
}
