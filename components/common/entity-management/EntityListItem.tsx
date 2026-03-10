// components/common/entity-management/EntityListItem.tsx
import React from 'react';
import {
  BaseEntity,
  EntityConfig,
  HierarchicalEntity,
  isHierarchicalEntity,
} from '@/components/common/entity-management/types';
import { DuplicateAwareCell } from '@/components/table/DuplicateAwareCell';

interface EntityListItemProps<T extends BaseEntity> {
  entity: T;
  config: EntityConfig<T>;
  isSelected: boolean;
  onSelect: (id: string) => void;
  isLoading: boolean;
  isDuplicate?: boolean;
}

export function EntityListItem<T extends BaseEntity>({
  entity,
  config,
  isSelected,
  onSelect,
  isDuplicate,
}: EntityListItemProps<T>) {
  const IconComponent = config.icon;

  const getParentName = (entity: T): string | null => {
    if (!config.isHierarchical || !config.parentField) return null;
    const parentObject = entity[config.parentField] as HierarchicalEntity;
    if (parentObject?.name) return parentObject.name;
    return null;
  };

  const parentName = getParentName(entity);

  return (
    <div
      className={`cursor-pointer border-b border-gray-100 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 ${
        isSelected
          ? 'border-l-4 border-l-blue-500 bg-blue-50 dark:bg-gray-800'
          : 'border-l-4 border-l-transparent'
      }`}
      onClick={() => onSelect(entity.id ?? '')}>
      <div className='flex items-center justify-between'>
        <div className='flex-1'>
          <div className='mb-2 flex items-center gap-2'>
            <IconComponent className='h-5 w-5 text-gray-400 dark:text-gray-500' />
            <DuplicateAwareCell text={entity.name} isDuplicate={isDuplicate} />
          </div>
          {config.isHierarchical && isHierarchicalEntity(entity) && parentName && (
            <span className='text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded'>
              Child of: {parentName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
