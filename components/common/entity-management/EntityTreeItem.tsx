import { BaseEntity, EntityTreeItemProps } from '@/components/common/entity-management/types';
import { FiChevronDown, FiChevronRight, FiToggleLeft, FiToggleRight } from 'react-icons/fi';

export function EntityTreeItem<T extends BaseEntity>({
  entity,
  config,
  level,
  selectedEntityId,
  expandedEntities,
  onSelect,
  onToggleExpand,
  onToggleStatus,
  isLoading,
  showStatusToggle,
}: EntityTreeItemProps<T> & { showStatusToggle?: boolean }) {
  const IconComponent = config.icon;
  const hasChildren = entity.children.length > 0;
  const isSelected = entity.id === selectedEntityId;
  const isExpanded = expandedEntities.has(entity.id ?? '');

  return (
    <div className='border-b border-gray-100 dark:border-gray-700 last:border-b-0'>
      <div
        className={`flex cursor-pointer items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800 ${
          isSelected
            ? 'border-l-4 border-l-blue-500 bg-blue-50 dark:bg-gray-800'
            : 'border-l-4 border-l-transparent'
        }`}
        style={{ paddingLeft: `${16 + level * 24}px` }}
        onClick={() => onSelect(entity.id ?? '')}
      >
        <div className='flex flex-1 items-center gap-2 truncate'>
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(entity.id ?? '');
              }}
              className='rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700'
            >
              {isExpanded ? (
                <FiChevronDown className='h-4 w-4 text-gray-400 dark:text-gray-500' />
              ) : (
                <FiChevronRight className='h-4 w-4 text-gray-400 dark:text-gray-500' />
              )}
            </button>
          ) : (
            <div className='w-6' />
          )}
          <IconComponent className='h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500' />
          <div className='flex-1 truncate'>
            <h3 className='font-medium text-gray-900 dark:text-gray-100 truncate'>{entity.name}</h3>
          </div>
        </div>
        {showStatusToggle !== false && (
          <button
            onClick={(e) => onToggleStatus?.(e, entity)}
            disabled={isLoading || !onToggleStatus}
            className='ml-auto'
          >
            {entity.status ? (
              <FiToggleRight className='h-5 w-5 text-green-500 dark:text-green-400' />
            ) : (
              <FiToggleLeft className='h-5 w-5 text-gray-400 dark:text-gray-500' />
            )}
          </button>
        )}
      </div>
      {isExpanded && hasChildren && (
        <div>
          {entity.children.map((child) => (
            <EntityTreeItem
              key={child.id}
              entity={child}
              config={config}
              level={level + 1}
              selectedEntityId={selectedEntityId}
              expandedEntities={expandedEntities}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onToggleStatus={onToggleStatus}
              showStatusToggle={showStatusToggle}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}
