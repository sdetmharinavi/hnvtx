// components/common/entity-management/EntityDetailsPanel.tsx
import React, { useState } from 'react';
import { FiEye, FiLoader } from 'react-icons/fi';
import { BaseEntity, EntityConfig } from '@/components/common/entity-management/types';
import { DetailItem } from '@/components/common/entity-management/DetailItem';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface EntityDetailsPanelProps<T extends BaseEntity> {
  entity: T | null;
  config: EntityConfig<T>;
  onViewDetails?: () => void;
}

export function EntityDetailsPanel<T extends BaseEntity>({
  entity,
  config,
  onViewDetails,
}: EntityDetailsPanelProps<T>) {
  const [isNavigating, setIsNavigating] = useState(false);

  const handleViewDetails = async () => {
    if (onViewDetails && !isNavigating) {
      setIsNavigating(true);
      onViewDetails();
      setTimeout(() => setIsNavigating(false), 5000);
    }
  };

  if (!entity) {
    const IconComponent = config.icon;
    return (
      <div className='p-8 text-center text-gray-500 dark:text-gray-400'>
        <IconComponent className='mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600' />
        <p>Select a {config.entityDisplayName.toLowerCase()} to view details</p>
      </div>
    );
  }

  return (
    <div className='p-4 space-y-4 relative'>
      {isNavigating && (
        <div className='absolute inset-0 z-50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-[1px] rounded-lg flex items-center justify-center'>
          <LoadingSpinner size='md' />
        </div>
      )}

      <div className='border-t border-gray-200 dark:border-gray-700 pt-4'>
        <div className='flex gap-2'>
          {onViewDetails && (
            <button
              onClick={handleViewDetails}
              disabled={isNavigating}
              className='flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-70 disabled:cursor-wait transition-all shadow-sm'>
              {isNavigating ? (
                <FiLoader className='h-4 w-4 animate-spin' />
              ) : (
                <FiEye className='h-4 w-4' />
              )}
              {isNavigating ? 'Opening...' : `Open ${config.entityDisplayName}`}
            </button>
          )}
        </div>
      </div>
      <div className='mb-2 flex items-start justify-between'>
        <h3 className='text-xl font-bold text-gray-900 dark:text-white wrap-break'>
          {entity.name}
        </h3>
        <span
          className={`rounded-full px-2 py-1 text-xs shrink-0 ml-2 ${
            entity.status
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
          }`}>
          {entity.status ? 'Active' : 'Inactive'}
        </span>
      </div>

      {config.detailFields.map((field, index) => (
        <DetailItem
          key={`${String(field.key)}-${index}`}
          label={field.label}
          value={entity[field.key]}
          type={field.type}
          entity={entity}
          render={field.render}
        />
      ))}
    </div>
  );
}
