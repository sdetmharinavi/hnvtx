"use client";

import { BaseEntity, EntityWithChildren, isHierarchicalEntity, UseEntityManagementProps } from "@/components/common/entity-management/types";
import { useCallback, useMemo, useState } from "react";

export function useEntityManagement<T extends BaseEntity>({ entitiesQuery, config, onEdit, onDelete, onToggleStatus, onCreateNew }: UseEntityManagementProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"tree" | "list">("list");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<T | null>(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());

  const allEntities = useMemo(() => entitiesQuery.data || [], [entitiesQuery.data]);

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

        // Safely access the property using type assertion
        const entityValue = key in entity ? entity[key as keyof T] : undefined;
        
        if (key === "status") {
          return entityValue !== undefined && entityValue?.toString() === value;
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

  // Event handlers
  const handleEntitySelect = useCallback((id: string, entity?: T) => {
    setSelectedEntityId(id);
    if (entity) {
      setSelectedEntity(entity);
    } else {
      const foundEntity = allEntities.find(e => e.id === id) || null;
      setSelectedEntity(foundEntity);
    }
    setShowDetailsPanel(true);
  }, [allEntities]);

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

  const handleOpenEditForm = useCallback(() => {
    if (selectedEntity) {
      onEdit(selectedEntity);
    }
  }, [selectedEntity, onEdit]);

  return {
    // State
    searchTerm,
    viewMode,
    showFilters,
    filters,
    selectedEntityId,
    selectedEntity,
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
    handleOpenEditForm,
    onToggleStatus,
    onDelete,
  };
}
