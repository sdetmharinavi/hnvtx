// types.ts
import { Tables, TablesInsert } from "@/types/supabase-types";

export type MaintenanceArea = Tables<"maintenance_areas">;
export type AreaType = Tables<"lookup_types">;

export interface MaintenanceAreaWithRelations extends MaintenanceArea {
  area_type: AreaType | null;
  parent_area: MaintenanceAreaWithRelations | null;
  child_areas: MaintenanceAreaWithRelations[];
}

export interface DeleteProps {
  tableName: string;
  onSuccess?: () => void;
}

export interface AreaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TablesInsert<"maintenance_areas">) => void;
  area: MaintenanceAreaWithRelations | null;
  allAreas: MaintenanceArea[];
  areaTypes: AreaType[];
  isLoading: boolean;
}

export interface DetailItemProps {
  label: string;
  value: string | null | undefined;
  icon?: React.ReactNode;
}