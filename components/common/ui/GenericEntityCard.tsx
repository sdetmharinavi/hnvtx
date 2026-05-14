// components/common/ui/GenericEntityCard.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { StatusBadge } from '@/components/common/ui/badges/StatusBadge';
import { Button } from '@/components/common/ui/Button';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { LucideIcon } from 'lucide-react';
import { FiInfo } from 'react-icons/fi';
import { IconType } from 'react-icons';
import { LoadingSpinner } from '@/components/common/ui/LoadingSpinner';

export interface EntityCardItem {
  icon: LucideIcon | IconType;
  label: string;
  value: string | number | null | React.ReactNode;
  copyable?: boolean;
  optional?: boolean;
  iconClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
}

interface GenericEntityCardProps<T> {
  entity: T;
  title: string;
  subtitle?: string;
  subBadge?: React.ReactNode;
  status?: boolean | string | null;
  showStatusLabel?: boolean;
  dataItems: EntityCardItem[];
  onView?: (entity: T) => void;
  // Removed onEdit, onDelete, canEdit, canDelete
  customHeader?: React.ReactNode;
  customFooter?: React.ReactNode;
  extraActions?: React.ReactNode;
  avatarColor?: string;
  initials?: string;
  headerIcon?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  dataItemClassName?: string;
  actionButtonClassName?: string;
}

export function GenericEntityCard<T>({
  entity,
  title,
  subtitle,
  subBadge,
  status,
  showStatusLabel = true,
  dataItems,
  onView,
  customHeader,
  customFooter,
  extraActions,
  avatarColor,
  initials,
  headerIcon,
  className = '',
  titleClassName = '',
  subtitleClassName = '',
  dataItemClassName = '',
  actionButtonClassName = '',
}: GenericEntityCardProps<T>) {
  const isAvatarStyle = !!initials;
  const [isInteracting, setIsInteracting] = useState(false);

  const handleViewAction = useCallback(async () => {
    if (!onView || isInteracting) return;
    setIsInteracting(true);
    onView(entity);
    setTimeout(() => {
      setIsInteracting(false);
    }, 5000);
  }, [onView, entity, isInteracting]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onView && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleViewAction();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onView) {
      handleViewAction();
    }
  };

  const renderValue = (item: EntityCardItem) => {
    const value = item.value;

    if (value === null || value === undefined || value === '') {
      return (
        <span className='text-slate-500 dark:text-slate-400 italic font-medium'>Not specified</span>
      );
    }

    if (typeof value === 'string' || typeof value === 'number') {
      const stringValue = String(value);

      if (
        item.label.toLowerCase().includes('coordinate') ||
        item.label.toLowerCase() === 'lat/long'
      ) {
        const coords = stringValue.split(',');
        if (coords.length === 2) {
          const [lat, long] = coords;
          return (
            <div className='flex flex-col gap-0.5'>
              <span className='text-sm font-semibold text-blue-900 dark:text-blue-100'>
                Lat: {lat.trim()}
              </span>
              <span className='text-sm font-semibold text-blue-900 dark:text-blue-100'>
                Long: {long.trim()}
              </span>
            </div>
          );
        }
      }

      if (stringValue.length > 30) {
        return (
          <TruncateTooltip
            text={stringValue}
            copyOnDoubleClick={item.copyable}
            className='text-blue-950 dark:text-blue-50 font-semibold'
          />
        );
      }

      return (
        <span className='text-blue-950 dark:text-blue-50 font-semibold'>
          {item.copyable ? (
            <TruncateTooltip
              text={stringValue}
              copyOnDoubleClick={true}
              className='text-blue-950 dark:text-blue-50 font-semibold'
            />
          ) : (
            stringValue
          )}
        </span>
      );
    }
    return <div className='text-blue-950 dark:text-blue-50 font-semibold'>{value}</div>;
  };

  return (
    <div
      onClick={handleClick}
      role={onView ? 'button' : undefined}
      tabIndex={onView ? 0 : undefined}
      onKeyDown={handleKeyDown}
      className={`
        bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700
        shadow-md dark:shadow-lg dark:shadow-gray-900/30 transition-all duration-200 ease-in-out
        flex flex-col h-full group relative overflow-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none
        ${onView ? 'cursor-pointer hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 hover:-translate-y-0.5' : ''}
        ${className}
      `}
    >
      {isInteracting && (
        <div className='absolute inset-0 z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[1px] flex items-center justify-center'>
          <LoadingSpinner size='md' color='primary' />
        </div>
      )}

      {isAvatarStyle ? (
        <div className='relative h-20 bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-blue-900/20 dark:to-purple-900/20'>
          <div className='absolute top-2.5 right-2.5 z-10'>
            <StatusBadge status={status ?? false} showStatusLabel={showStatusLabel} />
          </div>
          <div className='absolute -bottom-10 left-1/2 transform -translate-x-1/2'>
            <div className='relative'>
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg ring-4 ring-white dark:ring-gray-800 transition-transform duration-300 group-hover:scale-105 bg-linear-to-br from-blue-500 to-blue-700`}
                style={{ background: avatarColor }}
              >
                {initials}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className='relative p-4 border-b border-gray-200 dark:border-gray-700 bg-linear-to-br from-blue-50 via-indigo-50 to-white dark:from-gray-800 dark:via-blue-900/10'>
          <div
            className={`absolute left-0 top-0 bottom-0 w-1.5 ${status ? 'bg-green-500' : 'bg-red-500'} shadow-lg`}
          />
          <div className='absolute top-3.5 right-3.5 z-10'>
            <StatusBadge status={status ?? false} showStatusLabel={showStatusLabel} />
          </div>
          <div className='flex items-start gap-3 pr-14'>
            {headerIcon && (
              <div className='relative shrink-0 group/icon'>
                <div className='w-12 h-12 rounded-xl flex items-center justify-center shadow-md border border-blue-100 dark:border-blue-800/50 bg-linear-to-br from-white to-blue-50 dark:from-gray-700 text-blue-900 dark:text-blue-100'>
                  {headerIcon}
                </div>
              </div>
            )}
            <div className='min-w-0 flex-1 pt-0.5'>
              <h3
                className={`font-bold text-gray-900 dark:text-white text-base mb-1 truncate ${titleClassName}`}
                title={title}
              >
                <TruncateTooltip text={title} />
              </h3>
              {subBadge && <div className='flex flex-wrap gap-1.5 mt-1.5'>{subBadge}</div>}
              {subtitle && !subBadge && (
                <p
                  className={`text-sm text-blue-800 dark:text-blue-200 font-semibold truncate ${subtitleClassName}`}
                  title={subtitle}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`px-4 ${isAvatarStyle ? 'pt-12' : 'pt-3.5'} pb-3.5 space-y-2 flex-1`}>
        {isAvatarStyle && (
          <div className='text-center mb-3.5'>
            <h3
              className={`font-bold text-gray-900 dark:text-white text-base mb-1 truncate ${titleClassName}`}
              title={title}
            >
              {title}
            </h3>
            <p
              className={`text-sm text-blue-800 dark:text-blue-200 font-semibold mb-2 ${subtitleClassName}`}
              title={subtitle}
            >
              {subtitle || '—'}
            </p>
            {subBadge && <div>{subBadge}</div>}
          </div>
        )}
        {customHeader}
        <div className='space-y-2'>
          {dataItems
            .filter((item) => !item.optional || (item.optional && item.value))
            .map((item, idx) => {
              const isRemark = item.label === 'Remark';
              const ItemIcon = item.icon;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${isRemark ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-900/10' : 'bg-blue-50/30 border-blue-100 dark:bg-blue-900/10'} ${dataItemClassName}`}
                >
                  <div
                    className={`p-2 rounded-lg shadow-sm shrink-0 border ${isRemark ? 'bg-amber-100 border-amber-300 dark:bg-amber-800/30' : 'bg-blue-100 border-blue-200 dark:bg-blue-800/30'}`}
                  >
                    <ItemIcon
                      className={`w-4 h-4 ${isRemark ? 'text-amber-800 dark:text-amber-300' : 'text-blue-800 dark:text-blue-300'} ${item.iconClassName || ''}`}
                    />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div
                      className={`text-[10px] font-bold uppercase tracking-wider leading-none mb-1 ${isRemark ? 'text-amber-900 dark:text-amber-200' : 'text-blue-800 dark:text-blue-200'} ${item.labelClassName || ''}`}
                    >
                      {item.label}
                    </div>
                    <div
                      className={`${isRemark ? 'text-amber-950 dark:text-amber-100' : 'text-blue-950 dark:text-blue-50'} ${item.valueClassName || ''}`}
                    >
                      {renderValue(item)}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
        {customFooter}
      </div>

      <div
        className='px-3.5 py-2.5 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2 bg-linear-to-t from-gray-50/50 to-transparent dark:from-gray-800/50'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex-1 flex gap-1.5'>{extraActions}</div>
        <div className='flex items-center gap-1.5'>
          {onView && (
            <Button
              size='xs'
              variant={extraActions ? 'ghost' : 'secondary'}
              onClick={(e) => {
                e.stopPropagation();
                handleViewAction();
              }}
              disabled={isInteracting}
              className={`font-semibold bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 ${actionButtonClassName}`}
            >
              <FiInfo className='w-4 h-4' />
              {!isAvatarStyle && !extraActions && (
                <span className='ml-1.5 hidden sm:inline'>Details</span>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
