import React from 'react';
import { FiEdit3, FiTrash2 } from 'react-icons/fi';
import { BaseEntity, EntityConfig } from '@/components/common/entity-management/types';
import { DetailItem } from '@/components/common/entity-management/DetailItem';

interface EntityDetailsPanelProps<T extends BaseEntity> {
  entity: T | null;
  config: EntityConfig<T>;
  onEdit: () => void;
  onDelete: (entity: { id: string; name: string }) => void;
}

export function EntityDetailsPanel<T extends BaseEntity>({
  entity,
  config,
  onEdit,
  onDelete,
}: EntityDetailsPanelProps<T>) {
  if (!entity) {
    const IconComponent = config.icon;
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <IconComponent className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
        <p>Select a {config.entityDisplayName.toLowerCase()} to view details</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="mb-2 flex items-start justify-between">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{entity.name}</h3>
        <span
          className={`rounded-full px-2 py-1 text-xs ${
            entity.status
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
          }`}
        >
          {entity.status ? 'Active' : 'Inactive'}
        </span>
      </div>

      {config.detailFields.map((field) => (
        <DetailItem
          key={String(field.key)}
          label={field.label}
          value={entity[field.key]}
          type={field.type}
          entity={entity}
          render={field.render}
        />
      ))}

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            <FiEdit3 className="h-4 w-4" /> Edit
          </button>
          <button
            onClick={() => onDelete({ id: entity.id, name: entity.name })}
            className="flex items-center justify-center gap-2 rounded-lg border border-red-300 dark:border-red-700 px-4 py-2 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            <FiTrash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
