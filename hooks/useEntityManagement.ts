"use client";

import { BaseEntity, EntityWithChildren, isHierarchicalEntity, UseEntityManagementProps } from "@/components/common/entity-management/types";
import { useCallback, useMemo, useState } from "react";

export function useEntityManagement<T extends BaseEntity>({
  entitiesQuery,
  config,
  onDelete,
  onCreateNew,
  selectedEntityId,
  onSelect,
  onToggleStatus,
}: UseEntityManagementProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"tree" | "list">("list");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());

  // CHANGED: Data is now accessed from the .data property of the query result.
  const allEntities = useMemo(() => entitiesQuery.data?.data || [], [entitiesQuery.data]);

  const selectedEntity = useMemo(() => {
    return allEntities.find(e => e.id === selectedEntityId) || null;
  }, [allEntities, selectedEntityId]);


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

  const hierarchicalEntities = useMemo((): EntityWithChildren<T>[] => {
    if (!config.isHierarchical) return filteredEntities.map((entity) => ({ ...entity, children: [] }));
    const entityMap = new Map<string, EntityWithChildren<T>>();
    filteredEntities.forEach((entity) => {
      entityMap.set(entity.id, { ...entity, children: [] });
    });
    const rootEntities: EntityWithChildren<T>[] = [];
    filteredEntities.forEach((entity) => {
      const entityWithChildren = entityMap.get(entity.id);
      if (!entityWithChildren) return;
      if (isHierarchicalEntity(entity) && entity.parent_id) {
        const parent = entityMap.get(entity.parent_id);
        if (parent) {
          parent.children.push(entityWithChildren);
        } else {
          rootEntities.push(entityWithChildren);
        }
      } else {
        rootEntities.push(entityWithChildren);
      }
    });
    return rootEntities;
  }, [filteredEntities, config.isHierarchical]);

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

  const handleOpenCreateForm = () => {
    onCreateNew();
  };

  return {
    // State
    searchTerm,
    viewMode,
    showFilters,
    filters,
    selectedEntity, // This is the selected entity object
    showDetailsPanel,
    expandedEntities,

    // Computed data
    allEntities,
    filteredEntities,
    hierarchicalEntities,

    // Handlers
    setSearchTerm,
    setViewMode,
    setShowFilters,
    setFilters,
    setShowDetailsPanel,
    handleEntitySelect,
    toggleExpanded,
    handleOpenCreateForm,
    onToggleStatus,
    onDelete,
  };
}