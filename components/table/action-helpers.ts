// components/table/action-helpers.ts
import React from 'react';
import { Eye } from 'lucide-react';
import { TableAction } from './datatable-types';

interface StandardActionHandlers<V> {
  onView?: (record: V) => void;
  // Add placeholder defaults to not break existing pages calling this function
  onEdit?: unknown;
  onDelete?: unknown;
  onToggleStatus?: unknown;
}

export function createStandardActions<V>({ onView }: StandardActionHandlers<V>): TableAction<V>[] {
  const actions: TableAction<V>[] = [];

  if (onView) {
    actions.push({
      key: 'view',
      label: 'View Details',
      icon: React.createElement(Eye, { className: 'w-4 h-4' }),
      onClick: (record) => onView(record),
      variant: 'secondary',
    });
  }

  return actions;
}
