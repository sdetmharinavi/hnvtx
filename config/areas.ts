// path: config/areas.ts

import { EntityConfig } from '@/components/common/entity-management/types';
import { FiBriefcase } from 'react-icons/fi';
import {
  Maintenance_areasRowSchema,
  Lookup_typesRowSchema,
  Maintenance_areasInsertSchema,
} from '@/schemas/zod-schemas';

// THE FIX: Changed from 'interface' to a 'type' alias and added an index signature (& Record<string, any>)
// to make it compatible with the BaseRecord constraint in useCrudManager.
export type MaintenanceAreaWithRelations = Maintenance_areasRowSchema & {
  area_type: Lookup_typesRowSchema | null;
  parent_area: MaintenanceAreaWithRelations | null;
  child_areas: MaintenanceAreaWithRelations[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export interface AreaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Maintenance_areasInsertSchema) => void;
  area: MaintenanceAreaWithRelations | null;
  allAreas: Maintenance_areasRowSchema[];
  areaTypes: Lookup_typesRowSchema[];
  isLoading: boolean;
}

// --- CONFIGURATION ---
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
    { key: 'parent_area', label: 'Parent Area', type: 'parent' },
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