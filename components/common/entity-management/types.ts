// components/common/entity-management/types.ts
import { UseQueryResult } from '@tanstack/react-query';
import { PagedQueryResult } from '@/hooks/database';

export interface BaseEntity {
  // THE FIX: The `id` property is now correctly typed as potentially being null,
  // which aligns with the schemas generated from database views (e.g., v_employee_designations).
  id: string | null;
  name: string;
  status: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface HierarchicalEntity extends BaseEntity {
  parent_id?: string | null;
  parent?: HierarchicalEntity | null;
}

export type EntityWithChildren<T extends BaseEntity> = T & {
  children: EntityWithChildren<T>[];
};

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
    type: 'text' | 'status' | 'parent' | 'date' | 'custom' | 'html';
    render?: (value: T[keyof T], entity: T) => React.ReactNode;
  }>;
  filterOptions: Array<{
    key: string;
    label: string;
    type: 'select' | 'text' | 'date';
    options?: Array<{ value: string; label: string }>;
  }>;
}

export interface UseEntityManagementProps<T extends BaseEntity> {
  entitiesQuery: UseQueryResult<PagedQueryResult<T>, Error>;
  config: EntityConfig<T>;
  onDelete: (entity: { id: string; name: string }) => void;
  onEdit: (entity: T) => void;
  onToggleStatus: (e: React.MouseEvent, entity: T) => void;
  onCreateNew: () => void;
  selectedEntityId: string | null;
  onSelect: (id: string | null) => void;
}

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