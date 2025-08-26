import React from 'react';
import { BaseEntity } from '@/components/common/entity-management/types';

interface DetailItemProps<T extends BaseEntity> {
  label: string;
  value: any;
  type: 'text' | 'status' | 'parent' | 'date' | 'custom';
  entity: T;
  render?: (value: any, entity: T) => React.ReactNode;
}

export function DetailItem<T extends BaseEntity>({
  label,
  value,
  type,
  entity,
  render,
}: DetailItemProps<T>) {
  if (!value && type !== 'status') return null;

  const renderValue = () => {
    if (render) {
      return render(value, entity);
    }

    switch (type) {
      case 'status':
        return (
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
              value
                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
            }`}
          >
            {value ? "Active" : "Inactive"}
          </span>
        );
      case 'parent':
        return value?.name || 'No parent';
      case 'date':
        return value ? new Date(value).toLocaleDateString() : 'N/A';
      case 'text':
      default:
        return String(value);
    }
  };

  return (
    <div className="py-2">
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{renderValue()}</dd>
    </div>
  );
}