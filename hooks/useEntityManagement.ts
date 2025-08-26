"use client";

import { BaseEntity, EntityWithChildren, isHierarchicalEntity, UseEntityManagementProps } from "@/components/common/entity-management/types";
import { useMemo, useState } from "react";

export function useEntityManagement<T extends BaseEntity>({ entitiesQuery, config, onEdit, onDelete, onToggleStatus, onCreateNew }: UseEntityManagementProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"tree" | "list">("list");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());

  const allEntities = entitiesQuery.data || [];

  // Search functionality
  const searchedEntities = useMemo(() => {
    if (!searchTerm) return allEntities;

    return allEntities.filter((entity) =>
      config.searchFields.some((field) => {
        const value = entity[field];
        return value && String(value).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [allEntities, searchTerm, config.searchFields]);

  // Filter functionality
  const filteredEntities = useMemo(() => {
    return searchedEntities.filter((entity) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;

        const entityValue = (entity as any)[key];
        if (key === "status") {
          return entityValue.toString() === value;
        }
        return entityValue === value;
      });
    });
  }, [searchedEntities, filters]);

  // Build hierarchical structure for tree view
  const hierarchicalEntities = useMemo((): EntityWithChildren<T>[] => {
    if (!config.isHierarchical) return filteredEntities.map((entity) => ({ ...entity, children: [] }));

    // Create a map to store entities with their children
    const entityMap = new Map<string, EntityWithChildren<T>>();

    // Initialize all entities with empty children arrays
    filteredEntities.forEach((entity) => {
      entityMap.set(entity.id, { ...entity, children: [] });
    });

    const rootEntities: EntityWithChildren<T>[] = [];

    // Build the hierarchy
    filteredEntities.forEach((entity) => {
      const entityWithChildren = entityMap.get(entity.id);
      if (!entityWithChildren) return;

      if (isHierarchicalEntity(entity) && entity.parent_id) {
        // This entity has a parent, add it to parent's children
        const parent = entityMap.get(entity.parent_id);
        if (parent) {
          parent.children.push(entityWithChildren);
        } else {
          // Parent not in filtered results, treat as root
          rootEntities.push(entityWithChildren);
        }
      } else {
        // This is a root entity
        rootEntities.push(entityWithChildren);
      }
    });

    return rootEntities;
  }, [filteredEntities, config.isHierarchical]);

  const selectedEntity = allEntities.find((entity) => entity.id === selectedEntityId) || null;

  // Event handlers
  const handleEntitySelect = (id: string) => {
    setSelectedEntityId(id);
    setShowDetailsPanel(true);
  };

  const toggleExpanded = (id: string) => {
    setExpandedEntities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleOpenCreateForm = () => {
    onCreateNew();
  };

  const handleOpenEditForm = () => {
    if (selectedEntity) {
      onEdit(selectedEntity);
    }
  };

  return {
    // State
    searchTerm,
    viewMode,
    showFilters,
    filters,
    selectedEntityId,
    showDetailsPanel,
    expandedEntities,

    // Computed data
    allEntities,
    filteredEntities,
    hierarchicalEntities,
    selectedEntity,

    // Handlers
    setSearchTerm,
    setViewMode,
    setShowFilters,
    setFilters,
    setShowDetailsPanel,
    handleEntitySelect,
    toggleExpanded,
    handleOpenCreateForm,
    handleOpenEditForm,
    onToggleStatus,
    onDelete,
  };
}
