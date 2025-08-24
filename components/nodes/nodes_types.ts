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
