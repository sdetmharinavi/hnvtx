// config/designations.ts
import { z } from 'zod';
import { EntityConfig } from '@/components/common/entity-management/types';
import { FiBriefcase } from 'react-icons/fi';
import { employee_designationsRowSchema } from '@/schemas/zod-schemas';

// --- TYPE DEFINITIONS (DERIVED FROM ZOD) ---
export type Designation = z.infer<typeof employee_designationsRowSchema>;

export interface DesignationWithRelations extends Designation {
  parent_designation: DesignationWithRelations | null;
  child_designations: DesignationWithRelations[];
}

// --- CONFIGURATION (Unchanged) ---
export const designationConfig: EntityConfig<DesignationWithRelations> = {
  entityName: 'designation',
  entityDisplayName: 'Designation',
  entityPluralName: 'Designations',
  parentField: 'parent_designation',
  icon: FiBriefcase,
  isHierarchical: true,
  searchFields: ['name'],
  detailFields: [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'status', label: 'Status', type: 'status' },
    { key: 'parent_designation', label: 'Parent Designation', type: 'parent' },
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
