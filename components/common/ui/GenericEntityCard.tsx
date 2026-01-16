// components/common/ui/GenericEntityCard.tsx
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
  optional?: boolean;
}

interface GenericEntityCardProps<T> {
  entity: T;
  title: string;
  subtitle?: string;
  subBadge?: React.ReactNode;
  status?: boolean | string | null;
  dataItems: EntityCardItem[];
  onView?: (entity: T) => void;
  onEdit?: (entity: T) => void;
  onDelete?: (entity: T) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  customHeader?: React.ReactNode;
  customFooter?: React.ReactNode;
  extraActions?: React.ReactNode;
  avatarColor?: string;
  initials?: string;
  headerIcon?: React.ReactNode;
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
  extraActions,
  avatarColor,
  initials,
  headerIcon,
}: GenericEntityCardProps<T>) {
  const isAvatarStyle = !!initials;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onView && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onView(entity);
    }
  };

  return (
    <div
      onClick={() => onView && onView(entity)}
      role={onView ? 'button' : undefined}
      tabIndex={onView ? 0 : undefined}
      onKeyDown={handleKeyDown}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 flex flex-col h-full group cursor-pointer relative overflow-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none hover:-translate-y-0.5"
    >
      {/* Header Section */}
      {isAvatarStyle ? (
        <div className="relative h-20 bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-blue-900/20 dark:to-purple-900/20">
          <div className="absolute top-2.5 right-2.5">
            <StatusBadge status={status ?? false} />
          </div>
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
            <div className="relative">
              <div
                className={`w-20 h-20 rounded-full bg-linear-to-br ${
                  avatarColor || 'from-blue-500 to-blue-600'
                } flex items-center justify-center text-2xl font-bold text-white shadow-lg ring-4 ring-white dark:ring-gray-800`}
              >
                {initials}
              </div>
              <div className="absolute inset-0 rounded-full bg-linear-to-br from-white/20 to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      ) : (
        <div className="relative bg-linear-to-br from-blue-50 via-indigo-50 to-white dark:from-gray-800 dark:via-blue-900/10 dark:to-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
          <div
            className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${
              status
                ? 'bg-linear-to-b from-emerald-400 via-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/50'
                : 'bg-linear-to-b from-red-400 via-red-500 to-red-600 shadow-lg shadow-red-500/50'
            }`}
          />

          <div className="absolute top-3.5 right-3.5">
            <StatusBadge status={status ?? false} />
          </div>

          <div className="flex items-start gap-3 pr-14">
            {headerIcon && (
              <div className="relative shrink-0 group/icon">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 bg-linear-to-br from-white to-blue-50 dark:from-gray-700 dark:to-gray-800 border border-blue-100 dark:border-blue-800 group-hover:scale-105 group-hover:rotate-3">
                  {headerIcon}
                </div>
                <div className="absolute inset-0 rounded-xl bg-linear-to-br from-blue-400/20 to-purple-400/20 opacity-0 group-hover/icon:opacity-100 transition-opacity duration-300 blur-sm -z-10" />
              </div>
            )}

            <div className="min-w-0 flex-1 pt-0.5">
              <h3
                className="font-bold text-gray-900 dark:text-gray-100 text-base mb-1 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                title={title}
              >
                <TruncateTooltip text={title} />
              </h3>
              {subBadge && <div className="flex flex-wrap gap-1.5 mt-1.5">{subBadge}</div>}
              {subtitle && !subBadge && (
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Body Section */}
      <div className={`px-4 ${isAvatarStyle ? 'pt-12' : 'pt-3.5'} pb-3.5 space-y-2 flex-1`}>
        {isAvatarStyle && (
          <div className="text-center mb-3.5">
            <h3
              className="font-bold text-gray-900 dark:text-white text-base mb-1 truncate"
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

        {customHeader}

        <div className="space-y-2">
          {dataItems.map((item, idx) => {
            const optional = item.optional ?? false;
            if (optional && !item.value) return null;

            const isRemark = item.label === 'Remark';

            return (
              <div
                key={idx}
                className={`flex items-center gap-2.5 p-2.5 rounded-lg transition-all duration-200 ${
                  isRemark
                    ? 'bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700'
                    : 'bg-linear-to-br from-gray-50 to-slate-50 dark:from-gray-700/30 dark:to-slate-700/30 border border-gray-200 dark:border-gray-600 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shadow-sm shrink-0 transition-all duration-200 ${
                    isRemark
                      ? 'bg-linear-to-br from-amber-100 to-orange-100 dark:from-amber-800 dark:to-orange-800 border border-amber-200 dark:border-amber-700 text-amber-600 dark:text-amber-300'
                      : 'bg-linear-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-[10px] font-bold uppercase tracking-wider leading-none mb-1 ${
                      isRemark
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {item.label}
                  </div>
                  <div
                    className={`text-sm font-semibold truncate ${
                      isRemark
                        ? 'text-amber-900 dark:text-amber-100'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {typeof item.value === 'string' ? (
                      <TruncateTooltip text={item.value} copyOnDoubleClick={item.copyable} />
                    ) : (
                      item.value || '—'
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {customFooter}
      </div>

      {/* Footer Actions */}
      <div
        className="px-3.5 py-2.5 bg-linear-to-t from-gray-50 via-blue-50/30 to-transparent dark:from-gray-900/50 dark:via-blue-900/10 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 flex gap-1.5">{extraActions}</div>

        <div className="flex items-center gap-1.5">
          {onView && (
            <Button
              size="xs"
              variant={extraActions ? 'ghost' : 'secondary'}
              onClick={() => onView(entity)}
              title="View Details"
              className="font-medium hover:scale-105 transition-transform"
            >
              <FiInfo className="w-4 h-4" />
              {!isAvatarStyle && !extraActions && (
                <span className="ml-1.5 hidden sm:inline">Details</span>
              )}
            </Button>
          )}

          {canEdit && onEdit && (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => onEdit(entity)}
              title="Edit"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20 hover:scale-105 transition-all"
            >
              <FiEdit2 className="w-4 h-4" />
            </Button>
          )}

          {canDelete && onDelete && (
            <Button
              size="xs"
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 hover:scale-105 transition-all"
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
