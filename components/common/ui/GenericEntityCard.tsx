// components/common/ui/GenericEntityCard.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { StatusBadge } from '@/components/common/ui/badges/StatusBadge';
import { Button } from '@/components/common/ui/Button';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { LucideIcon } from 'lucide-react';
import { FiEdit2, FiTrash2, FiInfo } from 'react-icons/fi';
import { IconType } from 'react-icons';
import { LoadingSpinner } from '@/components/common/ui/LoadingSpinner';

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
  showStatusLabel?: boolean;
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
  showStatusLabel = true,
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
  const [isInteracting, setIsInteracting] = useState(false);

  // Wrapper to handle visual feedback during navigation/action
  const handleViewAction = useCallback(async () => {
    if (!onView || isInteracting) return;

    setIsInteracting(true);

    // Trigger the parent action
    // We don't await strictly because router.push is often void in types but async in behavior
    onView(entity);

    // Safety fallback: If the action opens a modal (instant) or fails,
    // we remove the spinner after a short delay so the card becomes interactive again.
    // If it navigates away, the component unmounts anyway.
    setTimeout(() => {
      // Only reset if component is still mounted (React handles unmounted state updates gracefully in newer versions, but good practice)
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
    // Prevent triggering if clicking specific inner interactive elements
    // (though stopPropagation in children usually handles this)
    e.stopPropagation();
    if (onView) {
      handleViewAction();
    }
  };

  return (
    <div
      onClick={handleClick}
      role={onView ? 'button' : undefined}
      tabIndex={onView ? 0 : undefined}
      onKeyDown={handleKeyDown}
      aria-label={onView ? `View details for ${title}` : undefined}
      className={`
        bg-white dark:bg-gray-800
        rounded-xl
        border border-gray-200 dark:border-gray-700
        shadow-md
        transition-all duration-300 ease-in-out
        flex flex-col h-full
        group
        relative
        overflow-hidden
        focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none
        ${onView ? 'cursor-pointer hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 hover:-translate-y-1' : ''}
      `}
      style={{
        // Fallback for browsers that don't support CSS transforms
        WebkitTransform: 'translateZ(0)',
        willChange: 'transform, box-shadow',
      }}
    >
      {/* Loading Overlay */}
      {isInteracting && (
        <div className='absolute inset-0 z-50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-[1px] flex items-center justify-center transition-opacity duration-200'>
          <LoadingSpinner size='md' color='primary' />
        </div>
      )}

      {/* Header Section */}
      {isAvatarStyle ? (
        <div
          className='relative h-20 bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-blue-900/20 dark:to-purple-900/20'
          style={{
            // Fallback for old browsers
            background:
              'linear-gradient(135deg, rgb(239 246 255) 0%, rgb(238 242 255) 50%, rgb(250 245 255) 100%)',
          }}
        >
          <div className='absolute top-2.5 right-2.5 z-10'>
            <StatusBadge status={status ?? false} showStatusLabel={showStatusLabel} />
          </div>
          <div className='absolute -bottom-10 left-1/2 transform -translate-x-1/2'>
            <div className='relative'>
              <div
                className={`
                  w-20 h-20
                  rounded-full
                  flex items-center justify-center
                  text-2xl font-bold text-white
                  shadow-lg
                  ring-4 ring-white dark:ring-gray-800
                  transition-transform duration-300
                  group-hover:scale-105
                `}
                style={{
                  background:
                    avatarColor ||
                    'linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)',
                  // Fallback
                  backgroundColor: '#3b82f6',
                }}
              >
                {initials}
              </div>
              <div
                className='absolute inset-0 rounded-full pointer-events-none opacity-20'
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div
          className='relative bg-linear-to-br from-blue-50 via-indigo-50 to-white dark:from-gray-800 dark:via-blue-900/10 dark:to-gray-800 p-4 border-b border-gray-200 dark:border-gray-700'
          style={{
            background:
              'linear-gradient(135deg, rgb(239 246 255) 0%, rgb(238 242 255) 50%, white 100%)',
          }}
        >
          {/* Status indicator bar */}
          <div
            className='absolute left-0 top-0 bottom-0 w-1 transition-all duration-300'
            style={{
              background: status
                ? 'linear-gradient(180deg, rgb(52 211 153) 0%, rgb(16 185 129) 50%, rgb(5 150 105) 100%)'
                : 'linear-gradient(180deg, rgb(248 113 113) 0%, rgb(239 68 68) 50%, rgb(220 38 38) 100%)',
              backgroundColor: status ? '#10b981' : '#ef4444', // Fallback
              boxShadow: status
                ? '0 4px 6px -1px rgba(16, 185, 129, 0.5), 0 2px 4px -1px rgba(16, 185, 129, 0.3)'
                : '0 4px 6px -1px rgba(239, 68, 68, 0.5), 0 2px 4px -1px rgba(239, 68, 68, 0.3)',
            }}
            aria-hidden='true'
          />

          <div className='absolute top-3.5 right-3.5 z-10'>
            <StatusBadge status={status ?? false} showStatusLabel={showStatusLabel} />
          </div>

          <div className='flex items-start gap-3 pr-14'>
            {headerIcon && (
              <div className='relative shrink-0 group/icon'>
                <div
                  className='
                    w-12 h-12
                    rounded-xl
                    flex items-center justify-center
                    shadow-md
                    transition-all duration-300
                    border border-blue-100 dark:border-blue-800
                    group-hover:shadow-lg group-hover:scale-105
                  '
                  style={{
                    background: 'linear-gradient(135deg, white 0%, rgb(239 246 255) 100%)',
                    backgroundColor: 'white', // Fallback
                    transform: 'translateZ(0)', // GPU acceleration fallback
                  }}
                >
                  {headerIcon}
                </div>
                <div
                  className='absolute inset-0 rounded-xl opacity-0 group-hover/icon:opacity-100 transition-opacity duration-300 blur-sm -z-10'
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(167, 139, 250, 0.2) 100%)',
                  }}
                  aria-hidden='true'
                />
              </div>
            )}

            <div className='min-w-0 flex-1 pt-0.5'>
              <h3
                className='font-bold text-gray-900 dark:text-gray-100 text-base mb-1 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'
                title={title}
              >
                <TruncateTooltip text={title} />
              </h3>
              {subBadge && (
                <div className='flex flex-wrap gap-1.5 mt-1.5' role='list'>
                  {subBadge}
                </div>
              )}
              {subtitle && !subBadge && (
                <p
                  className='text-xs text-gray-600 dark:text-gray-400 font-medium truncate'
                  title={subtitle}
                >
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
          <div className='text-center mb-3.5'>
            <h3
              className='font-bold text-gray-900 dark:text-white text-base mb-1 truncate'
              title={title}
            >
              {title}
            </h3>
            <p
              className='text-sm text-gray-600 dark:text-gray-400 font-medium mb-2'
              title={subtitle}
            >
              {subtitle || '—'}
            </p>
            {subBadge && <div role='list'>{subBadge}</div>}
          </div>
        )}

        {customHeader}

        <div className='space-y-2' role='list'>
          {dataItems.map((item, idx) => {
            const optional = item.optional ?? false;
            if (optional && !item.value) return null;

            const isRemark = item.label === 'Remark';
            const ItemIcon = item.icon;

            return (
              <div
                key={idx}
                role='listitem'
                className='
                  flex items-center gap-2.5 p-2.5 rounded-lg
                  transition-all duration-200
                  border
                '
                style={{
                  background: isRemark
                    ? 'linear-gradient(135deg, rgb(254 252 232) 0%, rgb(254 243 199) 100%)'
                    : 'linear-gradient(135deg, rgb(249 250 251) 0%, rgb(241 245 249) 100%)',
                  backgroundColor: isRemark ? '#fef3c7' : '#f9fafb', // Fallback
                  borderColor: isRemark ? '#fcd34d' : '#e5e7eb',
                }}
              >
                <div
                  className='p-2 rounded-lg shadow-sm shrink-0 transition-all duration-200 border'
                  style={{
                    background: isRemark
                      ? 'linear-gradient(135deg, rgb(254 243 199) 0%, rgb(253 224 71) 100%)'
                      : 'linear-gradient(135deg, white 0%, rgb(239 246 255) 100%)',
                    backgroundColor: isRemark ? '#fde68a' : 'white', // Fallback
                    borderColor: isRemark ? '#fbbf24' : '#bfdbfe',
                  }}
                  aria-hidden='true'
                >
                  <ItemIcon
                    className='w-4 h-4'
                    style={{ color: isRemark ? '#d97706' : '#2563eb' }}
                    aria-hidden='true'
                  />
                </div>
                <div className='min-w-0 flex-1'>
                  <div
                    className='text-[10px] font-bold uppercase tracking-wider leading-none mb-1'
                    style={{ color: isRemark ? '#92400e' : '#6b7280' }}
                  >
                    {item.label}
                  </div>
                  <div
                    className='text-sm font-semibold truncate'
                    style={{ color: isRemark ? '#78350f' : '#111827' }}
                    title={typeof item.value === 'string' ? item.value : undefined}
                  >
                    {typeof item.value === 'string' ? (
                      <TruncateTooltip text={item.value} copyOnDoubleClick={item.copyable} />
                    ) : (
                      item.value || <span style={{ color: '#9ca3af' }}>—</span>
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
        className='
          px-3.5 py-2.5
          border-t border-gray-200 dark:border-gray-700
          flex items-center justify-between gap-2
        '
        style={{
          background:
            'linear-gradient(180deg, rgb(249 250 251) 0%, rgba(239 246 255, 0.3) 50%, transparent 100%)',
          backgroundColor: '#f9fafb', // Fallback
        }}
        onClick={(e) => e.stopPropagation()} // Important: stop click propagation for actions
        role='toolbar'
        aria-label='Card actions'
      >
        <div className='flex-1 flex gap-1.5' role='group'>
          {extraActions}
        </div>

        <div className='flex items-center gap-1.5' role='group' aria-label='Primary actions'>
          {onView && (
            <Button
              size='xs'
              variant={extraActions ? 'ghost' : 'secondary'}
              onClick={(e) => {
                e.stopPropagation();
                handleViewAction();
              }}
              disabled={isInteracting}
              title='View Details'
              aria-label={`View details for ${title}`}
              className='font-medium hover:scale-105 transition-transform duration-200'
            >
              <FiInfo className='w-4 h-4' aria-hidden='true' />
              {!isAvatarStyle && !extraActions && (
                <span className='ml-1.5 hidden sm:inline'>Details</span>
              )}
            </Button>
          )}

          {canEdit && onEdit && (
            <Button
              size='xs'
              variant='ghost'
              onClick={(e) => {
                e.stopPropagation();
                onEdit(entity);
              }}
              title='Edit'
              aria-label={`Edit ${title}`}
              className='text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20 hover:scale-105 transition-all duration-200'
            >
              <FiEdit2 className='w-4 h-4' aria-hidden='true' />
            </Button>
          )}

          {canDelete && onDelete && (
            <Button
              size='xs'
              variant='ghost'
              className='text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 hover:scale-105 transition-all duration-200'
              onClick={(e) => {
                e.stopPropagation();
                onDelete(entity);
              }}
              title='Delete'
              aria-label={`Delete ${title}`}
            >
              <FiTrash2 className='w-4 h-4' aria-hidden='true' />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
