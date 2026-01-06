import React from 'react';
import { StatusBadge } from '@/components/common/ui/badges/StatusBadge';
import { Button } from '@/components/common/ui/Button';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { LucideIcon } from 'lucide-react';
import { FiEdit2, FiTrash2, FiInfo } from 'react-icons/fi';
import { IconType } from 'react-icons';

export interface EntityCardItem {
  icon: LucideIcon | IconType;
  label: string;
  value: string | number | null | React.ReactNode;
  copyable?: boolean;
}

interface GenericEntityCardProps<T> {
  entity: T;
  title: string;
  subtitle?: string;
  subBadge?: React.ReactNode; // e.g., "HUB" or ID pill
  status?: boolean | string | null;
  dataItems: EntityCardItem[];

  // Actions
  onView?: (entity: T) => void;
  onEdit?: (entity: T) => void;
  onDelete?: (entity: T) => void;

  // Permissions
  canEdit?: boolean;
  canDelete?: boolean;

  // Custom slots
  customHeader?: React.ReactNode;
  customFooter?: React.ReactNode;

  // Styling overrides
  avatarColor?: string; // e.g. "from-blue-500 to-blue-600"
  initials?: string;
}

export function GenericEntityCard<T>({
  entity,
  title,
  subtitle,
  subBadge,
  status,
  dataItems,
  onView,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  customHeader,
  customFooter,
  avatarColor,
  initials,
}: GenericEntityCardProps<T>) {
  // Determine if we are using the Avatar Header style (like Employees) or Linear Header style (like Systems)
  const isAvatarStyle = !!initials;

  return (
    <div
      onClick={() => onView && onView(entity)}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 flex flex-col h-full group cursor-pointer relative overflow-hidden"
    >
      {/* 1. Header Section */}
      {isAvatarStyle ? (
        // Avatar Style Header (e.g. Employee)
        <div className="relative h-24 bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <div className="absolute top-3 right-3">
            <StatusBadge status={status ?? false} />
          </div>
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
            <div
              className={`w-20 h-20 rounded-full bg-linear-to-br ${
                avatarColor || 'from-blue-500 to-blue-600'
              } flex items-center justify-center text-2xl font-bold text-white shadow-lg ring-4 ring-white dark:ring-gray-800`}
            >
              {initials}
            </div>
          </div>
        </div>
      ) : (
        // Standard Style Header (e.g. System, Node)
        <>
          <div
            className={`absolute left-0 top-0 bottom-0 w-1 transition-all ${
              status
                ? 'bg-linear-to-b from-emerald-500 to-emerald-600'
                : 'bg-linear-to-b from-red-500 to-red-600'
            }`}
          />
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/50 bg-linear-to-b from-gray-50/50 to-transparent dark:from-gray-900/20 pl-6">
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0 flex-1">
                {subBadge && <div className="mb-2">{subBadge}</div>}
                <h3
                  className="font-semibold text-gray-900 dark:text-gray-100 text-base leading-snug truncate"
                  title={title}
                >
                  <TruncateTooltip text={title} />
                </h3>
                {subtitle && <p className="text-xs text-gray-500 mt-1 truncate">{subtitle}</p>}
              </div>
              <StatusBadge status={status ?? false} />
            </div>
          </div>
        </>
      )}

      {/* 2. Body Section */}
      <div className={`px-5 ${isAvatarStyle ? 'pt-14' : 'pt-4'} pb-4 space-y-3 flex-1`}>
        {/* Avatar Style Title Block */}
        {isAvatarStyle && (
          <div className="text-center mb-4">
            <h3
              className="font-bold text-gray-900 dark:text-white text-lg mb-1 truncate"
              title={title}
            >
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">
              {subtitle || '—'}
            </p>
            {subBadge}
          </div>
        )}

        {/* Dynamic Data Rows */}
        {customHeader}

        <div className="space-y-2">
          {dataItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="p-1.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 shrink-0">
                <item.icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-gray-500 dark:text-gray-500 font-medium uppercase tracking-wide leading-none mb-0.5">
                  {item.label}
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">
                  {typeof item.value === 'string' ? (
                    <TruncateTooltip text={item.value} copyOnDoubleClick={item.copyable} />
                  ) : (
                    item.value || '—'
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Footer / Actions */}
      <div
        className="px-4 py-3 bg-linear-to-t from-gray-50 to-transparent dark:from-gray-900/30 border-t border-gray-200 dark:border-gray-700/50 flex items-center justify-between gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1">{customFooter}</div>

        <div className="flex items-center gap-2">
          {onView && (
            <Button
              size="xs"
              variant="secondary"
              onClick={() => onView(entity)}
              title="View Details"
              className="font-medium"
            >
              <FiInfo className="w-4 h-4" />
              {!isAvatarStyle && <span className="ml-1.5 hidden sm:inline">Details</span>}
            </Button>
          )}

          {canEdit && onEdit && (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => onEdit(entity)}
              title="Edit"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <FiEdit2 className="w-4 h-4" />
            </Button>
          )}

          {canDelete && onDelete && (
            <Button
              size="xs"
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              onClick={() => onDelete(entity)}
              title="Delete"
            >
              <FiTrash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
