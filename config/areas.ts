// config/designations.ts

import { EntityConfig } from "@/components/common/entity-management/types";
import { FiBriefcase } from "react-icons/fi";
import { Tables, TablesInsert } from "@/types/supabase-types";

// --- TYPE DEFINITIONS ---
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

export const areaConfig: EntityConfig<MaintenanceAreaWithRelations> = {
  entityName: 'area',
  entityDisplayName: 'Area',
  entityPluralName: 'Areas',
  parentField: 'parent_area',
  icon: FiBriefcase,
  isHierarchical: true,
  searchFields: ['name'],
  detailFields: [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'status', label: 'Status', type: 'status' },
    { 
      key: 'parent_area', 
      label: 'Parent Area', 
      type: 'parent' 
    },
    { key: 'created_at', label: 'Created At', type: 'date' },
  ],
  filterOptions: [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: '', label: 'All Status' },
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' },
      ],
    },
  ],
};