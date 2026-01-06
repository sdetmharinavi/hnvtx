// path: components/common/entity-management/EntityDetailsPanel.tsx
import React, { useState } from "react";
import { FiEdit3, FiTrash2, FiEye, FiLoader } from "react-icons/fi";
import { BaseEntity, EntityConfig } from "@/components/common/entity-management/types";
import { DetailItem } from "@/components/common/entity-management/DetailItem";

interface EntityDetailsPanelProps<T extends BaseEntity> {
  entity: T | null;
  config: EntityConfig<T>;
  onEdit?: () => void;
  onDelete?: (entity: { id: string; name: string }) => void;
  onViewDetails?: () => void;
}

export function EntityDetailsPanel<T extends BaseEntity>({
  entity,
  config,
  onEdit,
  onDelete,
  onViewDetails,
}: EntityDetailsPanelProps<T>) {
  // Local state to track navigation action
  const [isNavigating, setIsNavigating] = useState(false);

  const handleViewDetails = async () => {
    if (onViewDetails) {
      setIsNavigating(true);
      // Execute the callback (usually router.push)
      // We don't await here because router.push doesn't return a promise in all Next.js versions,
      // and we want to show loading immediately until the page unmounts/changes.
      onViewDetails();

      // Safety timeout: if navigation fails or is cancelled, reset state after 5s
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
    <div className='p-4 space-y-4'>
      <div className='border-t border-gray-200 dark:border-gray-700 pt-4'>
        <div className='flex gap-2'>
          {onViewDetails && (
            <button
              onClick={handleViewDetails}
              disabled={isNavigating}
              className='flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-70 disabled:cursor-wait transition-all'>
              {isNavigating ? (
                <FiLoader className='h-4 w-4 animate-spin' />
              ) : (
                <FiEye className='h-4 w-4' />
              )}
              {isNavigating ? "Opening..." : `Open ${config.entityDisplayName}`}
            </button>
          )}

          {onEdit && (
            <button
              onClick={onEdit}
              disabled={isNavigating}
              className='flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              title='Edit'>
              <FiEdit3 className='h-4 w-4' />
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete({ id: entity.id ?? "", name: entity.name })}
              disabled={isNavigating}
              className='flex items-center justify-center gap-2 rounded-lg border border-red-300 dark:border-red-700 px-4 py-2 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'
              title='Delete'>
              <FiTrash2 className='h-4 w-4' />
            </button>
          )}
        </div>
      </div>
      <div className='mb-2 flex items-start justify-between'>
        <h3 className='text-xl font-bold text-gray-900 dark:text-white'>{entity.name}</h3>
        <span
          className={`rounded-full px-2 py-1 text-xs ${
            entity.status
              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
              : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
          }`}>
          {entity.status ? "Active" : "Inactive"}
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
