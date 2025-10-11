// path: components/common/entity-management/EntityManagementComponent.tsx
import type { UseQueryResult } from "@tanstack/react-query";
import { PagedQueryResult } from "@/hooks/database";
import { EntityDetailsPanel } from "@/components/common/entity-management/EntityDetailsPanel";
import { EntityListItem } from "@/components/common/entity-management/EntityListItem";
import { EntityTreeItem } from "@/components/common/entity-management/EntityTreeItem";
import { SearchAndFilters } from "@/components/common/entity-management/SearchAndFilters";
import { BaseEntity, EntityConfig, EntityWithChildren } from "@/components/common/entity-management/types";
import { ViewModeToggle } from "@/components/common/entity-management/ViewModeToggle";
import { useMemo, useState, useCallback, useEffect } from "react";
import { FiInfo, FiPlus } from "react-icons/fi";
import { useDebounce } from "use-debounce";

type ToggleStatusVariables = { id: string; status: boolean; nameField?: keyof BaseEntity; };

interface EntityManagementComponentProps<T extends BaseEntity> {
  config: EntityConfig<T>;
  entitiesQuery: UseQueryResult<PagedQueryResult<T>, Error>;
  toggleStatusMutation: { mutate: (variables: ToggleStatusVariables) => void; isPending: boolean; };
  onEdit: (entity: T) => void;
  onDelete: (entity: { id: string; name: string }) => void;
  onCreateNew: () => void;
  selectedEntityId: string | null;
  onSelect: (id: string | null) => void;
  onViewDetails?: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters: Record<string, string>;
  onFilterChange: (filters: Record<string, string>) => void;
  onClearFilters: () => void;
}

export function EntityManagementComponent<T extends BaseEntity>({
  config, entitiesQuery, toggleStatusMutation, onEdit, onDelete,
  onCreateNew, selectedEntityId, onSelect, onViewDetails,
  searchTerm, onSearchChange, filters, onFilterChange, onClearFilters
}: EntityManagementComponentProps<T>) {
  // THE FIX: Internal state for the search input to decouple it from parent re-renders.
  const [internalSearchTerm, setInternalSearchTerm] = useState(searchTerm);
  const [debouncedSearch] = useDebounce(internalSearchTerm, 300);

  const [viewMode, setViewMode] = useState<"list" | "tree">("list");
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());

  // THE FIX: Effect to update the parent component only when the debounced search term changes.
  useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  const allEntities = useMemo(() => entitiesQuery.data?.data || [], [entitiesQuery.data]);
  const selectedEntity = useMemo(() => allEntities.find(e => e.id === selectedEntityId) || null, [allEntities, selectedEntityId]);

  const hierarchicalEntities = useMemo((): EntityWithChildren<T>[] => {
    if (!config.isHierarchical) return allEntities.map((entity) => ({ ...entity, children: [] }));
    const entityMap = new Map<string, EntityWithChildren<T>>();
    allEntities.forEach((entity) => { entityMap.set(entity.id, { ...entity, children: [] }); });
    const rootEntities: EntityWithChildren<T>[] = [];
    allEntities.forEach((entity) => {
      const entityWithChildren = entityMap.get(entity.id);
      if (!entityWithChildren) return;
      const parentId = (entity as any)[config.parentField as string]?.id ?? (entity as any).parent_id;
      if (parentId) {
        const parent = entityMap.get(parentId);
        if (parent) { parent.children.push(entityWithChildren); }
        else { rootEntities.push(entityWithChildren); }
      } else {
        rootEntities.push(entityWithChildren);
      }
    });
    return rootEntities;
  }, [allEntities, config.isHierarchical, config.parentField]);

  const handleToggleStatus = useCallback((e: React.MouseEvent, entity: T) => {
    e.stopPropagation();
    if (entity.status === null || entity.status === undefined) return;
    toggleStatusMutation.mutate({ id: entity.id, status: !entity.status, nameField: 'status' });
  }, [toggleStatusMutation]);

  const handleCloseDetailsPanel = useCallback(() => { setShowDetailsPanel(false); onSelect(null); }, [onSelect]);
  const handleItemSelect = (id: string) => { onSelect(id); setShowDetailsPanel(true); };
  const handleOpenEditForm = useCallback(() => { if (selectedEntity) onEdit(selectedEntity); }, [selectedEntity, onEdit]);
  const toggleExpanded = (id: string) => { setExpandedEntities((prev) => { const newSet = new Set(prev); if (newSet.has(id)) newSet.delete(id); else newSet.add(id); return newSet; }); };

  const IconComponent = config.icon;

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-160px)]">
      <div className={`flex-1 flex flex-col ${showDetailsPanel ? "hidden lg:flex" : "flex"} lg:border-r lg:border-gray-200 lg:dark:border-gray-700`}>
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <SearchAndFilters
            searchTerm={internalSearchTerm} onSearchChange={setInternalSearchTerm}
            showFilters={showFilters} onToggleFilters={() => setShowFilters(p => !p)}
            filters={filters} onFilterChange={onFilterChange} onClearFilters={onClearFilters}
            config={config}
          />
          {config.isHierarchical && <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />}
        </div>
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
          {entitiesQuery.isLoading ? (
            <div className="flex items-center justify-center py-12 text-center">...Loading...</div>
          ) : entitiesQuery.isError ? (
            <div className="flex items-center justify-center py-12 text-center text-red-500">Error loading data.</div>
          ) : allEntities.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-center">
               <div>
                  <IconComponent className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No {config.entityPluralName.toLowerCase()} found.</p>
                  <button onClick={onCreateNew} className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30">
                      <FiPlus className="h-4 w-4 mr-2" />
                      Add First {config.entityDisplayName}
                  </button>
              </div>
            </div>
          ) : config.isHierarchical && viewMode === "tree" ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {hierarchicalEntities.map((entity) => (
                <EntityTreeItem key={entity.id} entity={entity} config={config} level={0} selectedEntityId={selectedEntityId} expandedEntities={expandedEntities} onSelect={handleItemSelect} onToggleExpand={toggleExpanded} onToggleStatus={(e) => handleToggleStatus(e, entity)} isLoading={toggleStatusMutation.isPending} />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {allEntities.map((entity) => (
                <EntityListItem key={entity.id} entity={entity} config={config} isSelected={entity.id === selectedEntityId} onSelect={() => handleItemSelect(entity.id)} onToggleStatus={(e) => handleToggleStatus(e, entity)} isLoading={toggleStatusMutation.isPending} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className={`${showDetailsPanel ? "flex" : "hidden lg:flex"} flex-col w-full lg:w-96 xl:w-1/3 bg-white dark:bg-gray-800 border-t lg:border-t-0 border-gray-200 dark:border-gray-700`}>
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Details</h2>
            <button onClick={handleCloseDetailsPanel} className="p-2 rounded-md text-gray-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        <div className="hidden lg:block border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">{config.entityDisplayName} Details</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {selectedEntity ? (
            <EntityDetailsPanel entity={selectedEntity} config={config} onEdit={handleOpenEditForm} onDelete={onDelete} onViewDetails={onViewDetails} />
          ) : (
            <div className="flex items-center justify-center h-full p-8 text-center">
              <div>
                <FiInfo className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Select a {config.entityDisplayName.toLowerCase()} to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}