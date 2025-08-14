import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'h-4 rounded';
      case 'rect':
        return 'rounded';
      case 'circle':
        return 'rounded-full';
      case 'rounded':
        return 'rounded-lg';
      default:
        return 'h-4 rounded';
    }
  };

  const getAnimationClasses = () => {
    switch (animation) {
      case 'pulse':
        return 'animate-pulse';
      case 'wave':
        return 'animate-wave';
      case 'none':
        return '';
      default:
        return 'animate-pulse';
    }
  };

  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1rem' : '2rem'),
  };

  return (
    <div
      className={`bg-gray-300 dark:bg-gray-700 ${getVariantClasses()} ${getAnimationClasses()} ${className}`}
      style={style}
    />
  );
};

// Compound components for common patterns
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 6,
  showHeader = true,
  className = '',
}) => {
  return (
    <div className={`w-full ${className}`}>
      {showHeader && (
        <div className="mb-4 flex gap-4 border-b border-gray-200 pb-4 dark:border-gray-700">
          {Array.from({ length: columns }, (_, i) => (
            <Skeleton key={`header-${i}`} variant="text" width="100%" height="1.5rem" />
          ))}
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex gap-4">
            {Array.from({ length: columns }, (_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                variant="text"
                width="100%"
                height="2.5rem"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

interface CardSkeletonProps {
  showImage?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  lines?: number;
  className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  showImage = true,
  showTitle = true,
  showDescription = true,
  lines = 3,
  className = '',
}) => {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 ${className}`}>
      {showImage && (
        <Skeleton variant="rounded" width="100%" height="12rem" className="mb-4" />
      )}
      {showTitle && (
        <Skeleton variant="text" width="60%" height="1.5rem" className="mb-2" />
      )}
      {showDescription && (
        <div className="space-y-2">
          {Array.from({ length: lines }, (_, i) => (
            <Skeleton
              key={i}
              variant="text"
              width={i === lines - 1 ? '80%' : '100%'}
              height="1rem"
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface StatsSkeletonProps {
  count?: number;
  className?: string;
}

export const StatsCardsSkeleton: React.FC<StatsSkeletonProps> = ({
  count = 4,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <Skeleton variant="text" width="60%" height="2.5rem" className="mb-2" />
          <Skeleton variant="text" width="80%" height="1rem" />
        </div>
      ))}
    </div>
  );
};

interface PageSkeletonProps {
  showHeader?: boolean;
  showStats?: boolean;
  showFilters?: boolean;
  showTable?: boolean;
  statsCount?: number;
  tableRows?: number;
  tableColumns?: number;
  className?: string;
}

export const PageSkeleton: React.FC<PageSkeletonProps> = ({
  showHeader = true,
  showStats = true,
  showFilters = true,
  showTable = true,
  statsCount = 4,
  tableRows = 10,
  tableColumns = 6,
  className = '',
}) => {
  return (
    <div className={`min-h-screen bg-gray-50 p-6 dark:bg-gray-900 ${className}`}>
      <div className="mx-auto">
        {/* Header Skeleton */}
        {showHeader && (
          <div className="mb-6">
            <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <Skeleton variant="text" width="200px" height="2rem" className="mb-2" />
                <Skeleton variant="text" width="300px" height="1rem" />
              </div>
              <Skeleton variant="rounded" width="150px" height="40px" />
            </div>
          </div>
        )}

        {/* Stats Skeleton */}
        {showStats && <StatsCardsSkeleton count={statsCount} className="mb-6" />}

        {/* Filters Skeleton */}
        {showFilters && (
          <div className="mb-6 flex flex-wrap gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <Skeleton variant="rounded" width="200px" height="40px" />
            <Skeleton variant="rounded" width="150px" height="40px" />
            <Skeleton variant="rounded" width="150px" height="40px" />
            <Skeleton variant="rounded" width="100px" height="40px" />
          </div>
        )}

        {/* Table Skeleton */}
        {showTable && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <TableSkeleton rows={tableRows} columns={tableColumns} />
            {/* Pagination Skeleton */}
            <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
              <Skeleton variant="text" width="150px" height="1rem" />
              <div className="flex gap-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} variant="rounded" width="40px" height="40px" />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Skeleton;