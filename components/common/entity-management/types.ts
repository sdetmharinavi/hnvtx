// components/common/entity-management/types.ts
import { UseQueryResult } from '@tanstack/react-query';

export interface BaseEntity {
  id: string;
  name: string;
  status: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface HierarchicalEntity extends BaseEntity {
  parent_id?: string | null;
  parent?: HierarchicalEntity | null;
}

// Utility type for entities with computed children
export type EntityWithChildren<T extends BaseEntity> = T & {
  children: EntityWithChildren<T>[];
};

// Type guard functions
export function isHierarchicalEntity<T extends BaseEntity>(
  entity: T
): entity is T & HierarchicalEntity {
  return 'parent_id' in entity || 'parent' in entity;
}

export interface EntityConfig<T extends BaseEntity> {
  entityName: string;
  entityDisplayName: string;
  entityPluralName: string;
  parentField?: keyof T;
  icon: React.ComponentType<{ className?: string }>;
  isHierarchical: boolean;
  searchFields: (keyof T)[];
  detailFields: Array<{
    key: keyof T;
    label: string;
    type: 'text' | 'status' | 'parent' | 'date' | 'custom';
    render?: (value: T[keyof T], entity: T) => React.ReactNode;
  }>;
  filterOptions: Array<{
    key: string;
    label: string;
    type: 'select' | 'text' | 'date';
    options?: Array<{ value: string; label: string }>;
  }>;
}

// ** Update the hook's props interface**
export interface UseEntityManagementProps<T extends BaseEntity> {
  entitiesQuery: UseQueryResult<T[], Error>;
  config: EntityConfig<T>;
  onDelete: (entity: { id: string; name: string }) => void;
  onToggleStatus: (e: React.MouseEvent, entity: T) => void;
  onCreateNew: () => void;
  // Add the new props to make it a controlled component
  selectedEntityId: string | null;
  onSelect: (id: string | null) => void;
}

// Updated component interfaces
export interface EntityTreeItemProps<T extends BaseEntity> {
    entity: EntityWithChildren<T>;
    config: EntityConfig<T>;
    level: number;
    selectedEntityId: string | null;
    expandedEntities: Set<string>;
    onSelect: (id: string) => void;
    onToggleExpand: (id: string) => void;
    onToggleStatus: (e: React.MouseEvent, entity: T) => void;
    isLoading: boolean;
  }