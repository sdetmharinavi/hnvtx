import { Database } from "@/types/supabase-types";

export type Categories = Database["public"]["Tables"]["lookup_types"]["Row"];
export type GroupedLookupsByCategory = Record<string, Categories[]>;

export interface CategoryInfo {
    name: string;
    lookupCount: number;
    hasSystemDefaults: boolean;
  }