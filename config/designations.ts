// config/designations.ts
import { z } from 'zod';
import { EntityConfig } from '@/components/common/entity-management/types';
import { FiBriefcase } from 'react-icons/fi';
import { employee_designationsRowSchema } from '@/schemas/zod-schemas';

// --- TYPE DEFINITIONS (DERIVED FROM ZOD) ---
export type Designation = z.infer<typeof employee_designationsRowSchema>;

// THE FIX: Changed to a type intersection (&) and added an index signature ([key: string]: any)
// to make it compatible with the BaseRecord type required by useCrudManager.
export type DesignationWithRelations = Designation & {
  parent_designation: DesignationWithRelations | null;
  child_designations: DesignationWithRelations[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

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