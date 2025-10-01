// config/areas.ts
import { z } from 'zod';
import { EntityConfig } from "@/components/common/entity-management/types";
import { FiBriefcase } from "react-icons/fi";
import { maintenance_areasInsertSchema, maintenance_areasRowSchema, lookup_typesRowSchema } from "@/schemas/zod-schemas";

// --- TYPE DEFINITIONS (DERIVED FROM ZOD) ---
export type MaintenanceArea = z.infer<typeof maintenance_areasRowSchema>;
export type AreaType = z.infer<typeof lookup_typesRowSchema>;

export interface MaintenanceAreaWithRelations extends MaintenanceArea {
  area_type: AreaType | null;
  parent_area: MaintenanceAreaWithRelations | null;
  child_areas: MaintenanceAreaWithRelations[];
}

export interface AreaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: z.infer<typeof maintenance_areasInsertSchema>) => void;
  area: MaintenanceAreaWithRelations | null;
  allAreas: MaintenanceArea[];
  areaTypes: AreaType[];
  isLoading: boolean;
}

// --- CONFIGURATION (Unchanged) ---
export const areaConfig: EntityConfig<MaintenanceAreaWithRelations> = {
  entityName: 'area', entityDisplayName: 'Area', entityPluralName: 'Areas',
  parentField: 'parent_area', icon: FiBriefcase, isHierarchical: true,
  searchFields: ['name'],
  detailFields: [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'status', label: 'Status', type: 'status' },
    { key: 'parent_area', label: 'Parent Area', type: 'parent' },
    { key: 'created_at', label: 'Created At', type: 'date' },
  ],
  filterOptions: [
    {
      key: 'status', label: 'Status', type: 'select',
      options: [
        { value: '', label: 'All Status' }, { value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' },
      ],
    },
  ],
};