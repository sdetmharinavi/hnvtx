// components/table/action-helpers.ts
import React from 'react';
import { Eye } from 'lucide-react';
import { TableAction } from './datatable-types';
import { Row, TableOrViewName } from '@/hooks/database';

interface StandardActionHandlers<T extends TableOrViewName> {
  onView?: (record: Row<T>) => void;
  // Add placeholder defaults to not break existing pages calling this function
  onEdit?: unknown;
  onDelete?: unknown;
  onToggleStatus?: unknown;
}

export function createStandardActions<T extends TableOrViewName>({ onView }: StandardActionHandlers<T>): TableAction<T>[] {
  const actions: TableAction<T>[] = [];

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
