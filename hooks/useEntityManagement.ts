// path: hooks/useEntityManagement.ts
"use client";

import { BaseEntity, EntityWithChildren, isHierarchicalEntity, UseEntityManagementProps } from "@/components/common/entity-management/types";
import { useCallback, useMemo, useState } from "react";

export function useEntityManagement<T extends BaseEntity>({
  entitiesQuery,
  config,
  // THE FIX: onEdit is removed from the destructuring as it's no longer a prop.
  onDelete,
  onCreateNew,
  selectedEntityId,
  onSelect,
  onToggleStatus,
  searchTerm,
  filters,
}: UseEntityManagementProps<T> & { searchTerm: string, filters: Record<string, string> }) {
  const [viewMode, setViewMode] = useState<"list" | "tree">("list");
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());

  const allEntities = useMemo(() => entitiesQuery.data?.data || [], [entitiesQuery.data]);

  const searchedEntities = useMemo(() => {
    if (!searchTerm) return allEntities;
    return allEntities.filter((entity) =>
      config.searchFields.some((field) => {
        const value = entity[field];
        return value && String(value).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [allEntities, searchTerm, config.searchFields]);

  const filteredEntities = useMemo(() => {
    if (Object.keys(filters).length === 0) return searchedEntities;
    return searchedEntities.filter((entity) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const entityValue = key in entity ? entity[key as keyof T] : undefined;
        if (key === "status") {
          return entityValue !== undefined && entityValue?.toString() === value;
        }
        return entityValue === value;
      });
    });
  }, [searchedEntities, filters]);

  const selectedEntity = useMemo(() => {
    return allEntities.find(e => e.id === selectedEntityId) || null;
  }, [allEntities, selectedEntityId]);

  const hierarchicalEntities = useMemo((): EntityWithChildren<T>[] => {
    if (!config.isHierarchical) return filteredEntities.map((entity) => ({ ...entity, children: [] }));
    const entityMap = new Map<string, EntityWithChildren<T>>();
    allEntities.forEach((entity) => {
      entityMap.set(entity.id, { ...entity, children: [] });
    });
    const rootEntities: EntityWithChildren<T>[] = [];
    filteredEntities.forEach((entity) => {
      const entityWithChildren = entityMap.get(entity.id);
      if (!entityWithChildren) return;
      const parentId = (entity as any)[config.parentField as string]?.id ?? (entity as any).parent_id;

      if (parentId) {
        const parent = entityMap.get(parentId);
        if (parent && filteredEntities.some(e => e.id === parentId)) {
          parent.children.push(entityWithChildren);
        } else {
           rootEntities.push(entityWithChildren);
        }
      } else {
        rootEntities.push(entityWithChildren);
      }
    });
    return rootEntities;
  }, [filteredEntities, allEntities, config.isHierarchical, config.parentField]);

  const handleEntitySelect = useCallback((id: string) => {
    onSelect(id);
    setShowDetailsPanel(true);
  }, [onSelect]);

  const toggleExpanded = (id: string) => {
    setExpandedEntities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  return {
    viewMode,
    showDetailsPanel,
    selectedEntity,
    filteredEntities,
    hierarchicalEntities,
    expandedEntities,
    setViewMode,
    setShowDetailsPanel,
    handleEntitySelect,
    toggleExpanded,
    handleOpenCreateForm: onCreateNew,
    onToggleStatus,
    onDelete,
  };
}