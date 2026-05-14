// components/common/entity-management/EntityManagementComponent.tsx
import type { UseQueryResult } from '@tanstack/react-query';
import { PagedQueryResult } from '@/hooks/database';
import { EntityDetailsPanel } from '@/components/common/entity-management/EntityDetailsPanel';
import { EntityListItem } from '@/components/common/entity-management/EntityListItem';
import { EntityTreeItem } from '@/components/common/entity-management/EntityTreeItem';
import { SearchAndFilters } from '@/components/common/entity-management/SearchAndFilters';
import {
  BaseEntity,
  EntityConfig,
  EntityWithChildren,
} from '@/components/common/entity-management/types';
import { ViewModeToggle } from '@/components/common/entity-management/ViewModeToggle';
import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { FiInfo, FiMoreVertical } from 'react-icons/fi';
import { useDebounce } from 'use-debounce';
import { PageSpinner } from '@/components/common/ui';

interface EntityManagementComponentProps<T extends BaseEntity> {
  config: EntityConfig<T>;
  entitiesQuery: UseQueryResult<PagedQueryResult<T>, Error>;
  selectedEntityId: string | null;
  onSelect: (id: string | null) => void;
  onViewDetails?: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters: Record<string, string>;
  onFilterChange: (filters: Record<string, string>) => void;
  onClearFilters: () => void;
  isFetching?: boolean;
  duplicateSet?: Set<string>;
}

export function EntityManagementComponent<T extends BaseEntity>({
  config,
  entitiesQuery,
  selectedEntityId,
  onSelect,
  onViewDetails,
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  onClearFilters,
  duplicateSet,
}: EntityManagementComponentProps<T>) {
  const [internalSearchTerm, setInternalSearchTerm] = useState(searchTerm);
  const [debouncedSearch] = useDebounce(internalSearchTerm, 300);

  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());

  const [detailsPanelWidth, setDetailsPanelWidth] = useState(1000);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);

  const resize = useCallback(
    (mouseEvent: MouseEvent) => {
      if (isResizing) {
        const newWidth = window.innerWidth - mouseEvent.clientX;
        if (newWidth > 300 && newWidth < 1200) {
          setDetailsPanelWidth(newWidth);
        }
      }
    },
    [isResizing],
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'auto';
      document.body.style.userSelect = 'auto';
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'auto';
      document.body.style.userSelect = 'auto';
    };
  }, [isResizing, resize, stopResizing]);

  useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  const allEntities = useMemo(() => entitiesQuery.data?.data || [], [entitiesQuery.data]);
  const selectedEntity = useMemo(
    () => allEntities.find((e) => e.id === selectedEntityId) || null,
    [allEntities, selectedEntityId],
  );

  const hierarchicalEntities = useMemo((): EntityWithChildren<T>[] => {
    if (!config.isHierarchical) return allEntities.map((entity) => ({ ...entity, children: [] }));

    const entityMap = new Map<string, EntityWithChildren<T>>();
    allEntities.forEach((entity) => {
      entityMap.set(entity.id ?? '', { ...entity, children: [] });
    });

    const rootEntities: EntityWithChildren<T>[] = [];

    const isParentEntity = (value: unknown): value is { id: string } => {
      return (
        value != null &&
        typeof value === 'object' &&
        'id' in value &&
        typeof (value as { id: unknown }).id === 'string'
      );
    };

    const hasParentId = (entity: T): entity is T & { parent_id: string | null } => {
      return 'parent_id' in entity;
    };

    allEntities.forEach((entity) => {
      const entityWithChildren = entityMap.get(entity.id ?? '');
      if (!entityWithChildren) return;

      let parentId: string | null = null;

      if (config.parentField) {
        const parentRelation = entity[config.parentField];
        if (isParentEntity(parentRelation)) {
          parentId = parentRelation.id;
        }
      }

      if (!parentId && hasParentId(entity) && entity.parent_id) {
        parentId = entity.parent_id;
      }

      if (parentId) {
        const parent = entityMap.get(parentId);
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
  }, [allEntities, config.isHierarchical, config.parentField]);

  const handleCloseDetailsPanel = useCallback(() => {
    setShowDetailsPanel(false);
    onSelect(null);
  }, [onSelect]);

  const handleItemSelect = (id: string) => {
    onSelect(id);
    setShowDetailsPanel(true);
  };

  const toggleExpanded = (id: string) => {
    setExpandedEntities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const IconComponent = config.icon;
  const isInitialLoading = entitiesQuery.isLoading && allEntities.length === 0;

  return (
    <div className='flex flex-col lg:flex-row lg:h-[calc(100vh-160px)] relative overflow-hidden'>
      <div
        className={`flex-1 flex flex-col min-w-1/3 ${showDetailsPanel ? 'hidden lg:flex' : 'flex'}`}
      >
        <div className='bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'>
          <SearchAndFilters
            searchTerm={internalSearchTerm}
            onSearchChange={setInternalSearchTerm}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters((p) => !p)}
            filters={filters}
            onFilterChange={onFilterChange}
            onClearFilters={onClearFilters}
            config={config}
          />
          {config.isHierarchical && <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />}
        </div>
        <div className='flex-1 overflow-y-auto bg-white dark:bg-gray-800 custom-scrollbar'>
          {isInitialLoading ? (
            <div className='flex items-center justify-center py-12 text-center'>
              <PageSpinner text={`Loading ${config.entityPluralName}...`} />
            </div>
          ) : entitiesQuery.isError ? (
            <div className='flex items-center justify-center py-12 text-center text-red-500'>
              Error loading data.
            </div>
          ) : allEntities.length === 0 ? (
            <div className='flex items-center justify-center py-12 text-center'>
              <div>
                <IconComponent className='h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4' />
                <p className='text-gray-500 dark:text-gray-400'>
                  No {config.entityPluralName.toLowerCase()} found.
                </p>
              </div>
            </div>
          ) : config.isHierarchical && viewMode === 'tree' ? (
            <div className='divide-y divide-gray-100 dark:divide-gray-700'>
              {hierarchicalEntities.map((entity) => (
                <EntityTreeItem
                  key={entity.id}
                  entity={entity}
                  config={config}
                  level={0}
                  selectedEntityId={selectedEntityId}
                  expandedEntities={expandedEntities}
                  onSelect={handleItemSelect}
                  onToggleExpand={toggleExpanded}
                  isLoading={false}
                />
              ))}
            </div>
          ) : (
            <div className='divide-y divide-gray-100 dark:divide-gray-700'>
              {allEntities.map((entity) => (
                <EntityListItem
                  key={entity.id}
                  entity={entity}
                  config={config}
                  isSelected={entity.id === selectedEntityId}
                  onSelect={() => handleItemSelect(entity.id ?? '')}
                  isLoading={false}
                  isDuplicate={duplicateSet?.has(entity.name)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        className={`hidden lg:flex w-1 cursor-col-resize items-center justify-center bg-gray-100 hover:bg-blue-400 dark:bg-gray-900 dark:hover:bg-blue-600 transition-colors z-20 relative ${isResizing ? 'bg-blue-500 dark:bg-blue-500' : ''}`}
        onMouseDown={startResizing}
      >
        <div className='absolute pointer-events-none text-gray-400 dark:text-gray-500'>
          <FiMoreVertical size={12} />
        </div>
      </div>

      <div
        ref={sidebarRef}
        className={`${showDetailsPanel ? 'flex' : 'hidden lg:flex'} flex-col bg-white dark:bg-gray-800 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700`}
        style={{
          width:
            typeof window !== 'undefined' && window.innerWidth >= 1024 ? detailsPanelWidth : '100%',
        }}
      >
        <div className='sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 lg:hidden'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-medium text-gray-900 dark:text-white'>Details</h2>
            <button onClick={handleCloseDetailsPanel} className='p-2 rounded-md text-gray-400'>
              <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>
        </div>
        <div className='hidden lg:block border-b border-gray-200 dark:border-gray-700 px-4 py-3'>
          <h2 className='text-lg font-medium text-gray-900 dark:text-white'>
            {config.entityDisplayName} Details
          </h2>
        </div>
        <div className='flex-1 flex-row overflow-y-auto custom-scrollbar'>
          {selectedEntity ? (
            <EntityDetailsPanel
              entity={selectedEntity}
              config={config}
              onViewDetails={onViewDetails}
            />
          ) : (
            <div className='flex items-center justify-center h-full p-8 text-center'>
              <div>
                <FiInfo className='h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4' />
                <p className='text-gray-500 dark:text-gray-400'>
                  Select a {config.entityDisplayName.toLowerCase()} to view details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
