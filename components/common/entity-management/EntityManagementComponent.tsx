import type { UseQueryResult } from "@tanstack/react-query";
import { PagedQueryResult } from "@/hooks/database";
import { EntityDetailsPanel } from "@/components/common/entity-management/EntityDetailsPanel";
import { EntityListItem } from "@/components/common/entity-management/EntityListItem";
import { EntityTreeItem } from "@/components/common/entity-management/EntityTreeItem";
import { SearchAndFilters } from "@/components/common/entity-management/SearchAndFilters";
import { BaseEntity, EntityConfig } from "@/components/common/entity-management/types";
import { ViewModeToggle } from "@/components/common/entity-management/ViewModeToggle";
import { useEntityManagement } from "@/hooks/useEntityManagement";
import { FiInfo, FiPlus } from "react-icons/fi";
import { useCallback, useState } from "react";

type ToggleStatusVariables = {
  id: string;
  status: boolean;
  nameField?: keyof BaseEntity;
};

interface EntityManagementComponentProps<T extends BaseEntity> {
  config: EntityConfig<T>;
  entitiesQuery: UseQueryResult<PagedQueryResult<T>, Error>;
  toggleStatusMutation: {
    mutate: (variables: ToggleStatusVariables) => void;
    isPending: boolean;
  };
  onEdit: (entity: T) => void;
  onDelete: (entity: { id: string; name: string }) => void;
  onCreateNew: () => void;
  selectedEntityId: string | null;
  onSelect: (id: string | null) => void;
}

export function EntityManagementComponent<T extends BaseEntity>({
  config,
  entitiesQuery,
  toggleStatusMutation,
  onEdit,
  onDelete,
  onCreateNew,
  selectedEntityId,
  onSelect,
}: EntityManagementComponentProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "tree">("list");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [expandedEntities] = useState<Set<string>>(new Set());

  const handleToggleStatus = useCallback((e: React.MouseEvent, entity: T) => {
    e.stopPropagation();
    if (entity.status === null || entity.status === undefined) return;
    toggleStatusMutation.mutate({
      id: entity.id,
      status: !entity.status,
      nameField: 'status'
    });
  }, [toggleStatusMutation]);

  const handleCloseDetailsPanel = useCallback(() => {
    setShowDetailsPanel(false);
    onSelect(null);
  }, [onSelect]);

  // **THE FIX IS HERE:** Removed `handleOpenEditForm` from the destructuring
  const {
    filteredEntities,
    hierarchicalEntities,
    selectedEntity,
    handleEntitySelect,
    handleOpenCreateForm,
    toggleExpanded,
  } = useEntityManagement<T>({
    entitiesQuery,
    config: { ...config, isHierarchical: config.isHierarchical || false },
    onEdit,
    onDelete,
    onToggleStatus: handleToggleStatus,
    onCreateNew,
    selectedEntityId,
    onSelect,
  });
  
  const IconComponent = config.icon;
  
  const handleItemSelect = (id: string) => {
    handleEntitySelect(id);
    setShowDetailsPanel(true);
  };
  
  const handleOpenEditForm = useCallback(() => {
    if (selectedEntity) {
      onEdit(selectedEntity);
    }
  }, [selectedEntity, onEdit]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <IconComponent className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {config.entityPluralName}
            </h1>
          </div>
          <button
            onClick={handleOpenCreateForm}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            <FiPlus className="h-4 w-4 mr-2" />
            Add {config.entityDisplayName}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-80px)]">
        <div className={`flex-1 flex flex-col ${showDetailsPanel ? "hidden lg:flex" : "flex"} lg:border-r lg:border-gray-200 lg:dark:border-gray-700`}>
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <SearchAndFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters(p => !p)}
              filters={filters}
              onFilterChange={setFilters}
              onClearFilters={() => setFilters({})}
              config={config}
            />
            {config.isHierarchical && <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />}
          </div>

          <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
            {entitiesQuery.isLoading ? (
              <div className="flex items-center justify-center py-12 text-center">...Loading...</div>
            ) : entitiesQuery.isError ? (
              <div className="flex items-center justify-center py-12 text-center text-red-500">Error loading data.</div>
            ) : filteredEntities.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-center">
                 <div>
                    <IconComponent className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No {config.entityPluralName.toLowerCase()} found.</p>
                    <button
                        onClick={handleOpenCreateForm}
                        className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                    >
                        <FiPlus className="h-4 w-4 mr-2" />
                        Add First {config.entityDisplayName}
                    </button>
                </div>
              </div>
            ) : config.isHierarchical && viewMode === "tree" ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {hierarchicalEntities.map((entity) => (
                  <EntityTreeItem
                    key={entity.id}
                    entity={entity}
                    config={config}
                    level={0}
                    selectedEntityId={selectedEntityId}
                    expandedEntities={expandedEntities}
                    onSelect={handleItemSelect}
                    onToggleExpand={(id) => toggleExpanded(id)}
                    onToggleStatus={(e) => handleToggleStatus(e, entity)}
                    isLoading={toggleStatusMutation.isPending}
                  />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredEntities.map((entity) => (
                  <EntityListItem
                    key={entity.id}
                    entity={entity}
                    config={config}
                    isSelected={entity.id === selectedEntityId}
                    onSelect={() => handleItemSelect(entity.id)}
                    onToggleStatus={(e) => handleToggleStatus(e, entity)}
                    isLoading={toggleStatusMutation.isPending}
                  />
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
              <EntityDetailsPanel 
                entity={selectedEntity} 
                config={config} 
                onEdit={handleOpenEditForm}
                onDelete={onDelete} 
              />
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
    </div>
  );
}