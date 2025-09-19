// config/designations.ts

import { DesignationWithRelations } from "@/app/dashboard/designations/page";
import { EntityConfig } from "@/components/common/entity-management/types";
import { FiBriefcase } from "react-icons/fi";


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
    { 
      key: 'parent_designation', 
      label: 'Parent Designation', 
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