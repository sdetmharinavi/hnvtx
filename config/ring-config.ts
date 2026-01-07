// path: config/ring-config.ts
import { EntityConfig } from "@/components/common/entity-management/types";
import { v_ringsRowSchema, V_systems_completeRowSchema } from "@/schemas/zod-schemas";
import { GiLinkedRings } from "react-icons/gi";
import { z } from 'zod';

export type RingWithRelations = z.infer<typeof v_ringsRowSchema>;

// THE FIX: Added an optional 'associatedSystems' property to create a valid key
// for the custom detail field that will display the list of systems.
export type RingEntity = Omit<RingWithRelations, 'id' | 'name'> & {
  id: string;
  name: string;
  associatedSystems?: V_systems_completeRowSchema[];
};

export const ringConfig: EntityConfig<RingEntity> = {
  entityName: 'ring',
  entityDisplayName: 'Ring',
  entityPluralName: 'Rings',
  icon: GiLinkedRings,
  isHierarchical: false, // Rings are a flat structure
  searchFields: ['name', 'description', 'ring_type_name', 'maintenance_area_name'],
  detailFields: [
    { key: 'name', label: 'Ring Name', type: 'text' },
    { key: 'status', label: 'Status', type: 'status' },
    { key: 'ring_type_name', label: 'Ring Type', type: 'text' },
    { key: 'maintenance_area_name', label: 'Maintenance Area', type: 'text' },
    { key: 'total_nodes', label: 'Total Systems', type: 'text' },
    { key: 'description', label: 'Description', type: 'html' },
  ],
  filterOptions: [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' },
      ],
    },
    {
      key: 'ring_type_id',
      label: 'Ring Type',
      type: 'select',
      options: [], // This will be populated dynamically
    },
    {
      key: 'maintenance_terminal_id',
      label: 'Maintenance Area',
      type: 'select',
      options: [], // This will be populated dynamically
    },
  ],
};