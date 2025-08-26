import { EntityDetailsPanel } from "@/components/common/entity-management/EntityDetailsPanel";
import { EntityListItem } from "@/components/common/entity-management/EntityListItem";
import { EntityTreeItem } from "@/components/common/entity-management/EntityTreeItem";
import { SearchAndFilters } from "@/components/common/entity-management/SearchAndFilters";
import { BaseEntity, EntityConfig } from "@/components/common/entity-management/types";
import { ViewModeToggle } from "@/components/common/entity-management/ViewModeToggle";
import { useEntityManagement } from "@/hooks/useEntityManagement";
import { FiInfo, FiPlus } from "react-icons/fi";


interface EntityManagementComponentProps<T extends BaseEntity> {
  config: EntityConfig<T>;
  entitiesQuery: any;
  toggleStatusMutation: any;
  onEdit: (entity: T) => void;
  onDelete: (entity: { id: string; name: string }) => void;
  onCreateNew: () => void;
}

export function EntityManagementComponent<T extends BaseEntity>({
  config,
  entitiesQuery,
  toggleStatusMutation,
  onEdit,
  onDelete,
  onCreateNew,
}: EntityManagementComponentProps<T>) {
  const {
    searchTerm,
    viewMode,
    showFilters,
    filters,
    showDetailsPanel,
    expandedEntities,
    filteredEntities,
    hierarchicalEntities,
    selectedEntity,
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
  } = useEntityManagement({
    entitiesQuery,
    config,
    onEdit,
    onDelete,
    onToggleStatus: (e, entity) => toggleStatusMutation.mutate(entity),
    onCreateNew,
  });

  const IconComponent = config.icon;

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
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

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-80px)]">
        {/* Left Panel - List */}
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
            {config.isHierarchical && (
              <ViewModeToggle
                viewMode={viewMode}
                onChange={setViewMode}
              />
            )}
          </div>

          <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
            {entitiesQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Loading {config.entityPluralName}...
                  </p>
                </div>
              </div>
            ) : entitiesQuery.isError ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3 inline-block mb-4">
                    <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-red-600 dark:text-red-400">
                    Error loading {config.entityPluralName}
                  </p>
                </div>
              </div>
            ) : filteredEntities.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <IconComponent className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No {config.entityPluralName} found.
                  </p>
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
                    selectedEntityId={selectedEntity?.id ?? null}
                    expandedEntities={expandedEntities}
                    onSelect={handleEntitySelect}
                    onToggleExpand={toggleExpanded}
                    onToggleStatus={onToggleStatus}
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
                    isSelected={entity.id === selectedEntity?.id}
                    onSelect={handleEntitySelect}
                    onToggleStatus={onToggleStatus}
                    isLoading={toggleStatusMutation.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Details */}
        <div className={`${showDetailsPanel ? "flex" : "hidden lg:flex"} flex-col w-full lg:w-96 xl:w-1/3 bg-white dark:bg-gray-800 border-t lg:border-t-0 border-gray-200 dark:border-gray-700`}>
          {/* Mobile Details Header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 lg:hidden">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Details</h2>
              <button
                onClick={() => setShowDetailsPanel(false)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Desktop Details Header */}
          <div className="hidden lg:block border-b border-gray-200 dark:border-gray-700 px-4 py-3">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              {config.entityDisplayName} Details
            </h2>
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
              <div className="flex items-center justify-center h-full p-8">
                <div className="text-center">
                  <FiInfo className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Select a {config.entityDisplayName.toLowerCase()} to view details
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}