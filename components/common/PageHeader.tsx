"use client";

import React, { ReactNode, useCallback, useMemo } from "react";
import { FiDownload, FiPlus, FiRefreshCw, FiTrendingUp } from "react-icons/fi";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { Filters, TableOrViewName, Row } from "@/hooks/database";
import { useDynamicColumnConfig } from "@/hooks/useColumnConfig";
import { Button, ButtonProps } from "@/components/common/ui/Button/Button";
import { useTableExcelDownload } from "@/hooks/database/excel-queries";
import { formatDate } from "@/utils/formatters";
import { cn } from "@/lib/utils";

// --- TYPE DEFINITIONS ---

interface ExportConfig<T extends TableOrViewName> {
  tableName: T;
  filters?: Filters;
  maxRows?: number;
  columns?: (keyof Row<T> & string)[]; // Allow specifying a subset of columns for export
  fileName?: string;
}

export interface ActionButton extends ButtonProps {
  label: string;
  hideOnMobile?: boolean;
  hideTextOnMobile?: boolean;
  priority?: 'high' | 'medium' | 'low'; // For mobile button ordering
}

interface StatProps {
  value: string | number;
  label: string;
  icon?: ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'default';
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  stats?: StatProps[];
  actions?: ActionButton[];
  isLoading?: boolean;
  className?: string;
}

// --- SUB-COMPONENTS ---

const StatCard: React.FC<StatProps> = ({ value, label, icon, color = 'default' }) => {
    const statColors = {
      primary: 'text-blue-600 dark:text-blue-400',
      success: 'text-green-600 dark:text-green-400',
      warning: 'text-yellow-600 dark:text-yellow-400',
      danger: 'text-red-600 dark:text-red-400',
      default: 'text-gray-900 dark:text-white',
    };
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 flex items-start gap-4">
        {icon && <div className={`flex-shrink-0 text-2xl ${statColors[color]}`}>{icon}</div>}
        <div>
          <div className={`text-2xl font-bold ${statColors[color]}`}>{value}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
        </div>
      </div>
    );
};

// --- MAIN COMPONENT ---

export function PageHeader({
  title,
  description,
  icon,
  stats,
  actions = [],
  isLoading = false,
  className,
}: PageHeaderProps) {
  
  return (
    <div className={cn("space-y-4 sm:space-y-6", isLoading && "opacity-50",className)}>
      {/* Header Section */}
      <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
          <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:gap-3">
            {icon && <div className="text-2xl sm:text-3xl text-blue-600 dark:text-blue-400">{icon}</div>}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
              {title}
            </h1>
          </div>
          {description && (
            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg leading-relaxed">
              {description}
            </p>
          )}
        </div>
        
        {/* Desktop Action Buttons */}
        <div className="hidden lg:flex items-center gap-2 flex-shrink-0 ml-4">
          {actions.map((action, index) => (
            <Button
              key={`desktop-action-${index}`}
              {...action}
              disabled={action.disabled || isLoading}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats and Mobile Actions Row */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-grow">
          {isLoading ? (
            Array.from({ length: stats?.length || 2 }).map((_, i) => (
              <div key={`stat-skeleton-${i}`} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 animate-pulse">
                <div className="h-8 w-1/2 rounded-md bg-gray-200 dark:bg-gray-700 mb-2"></div>
                <div className="h-4 w-3/4 rounded-md bg-gray-200 dark:bg-gray-700"></div>
              </div>
            ))
          ) : (
            stats?.map(stat => <StatCard key={stat.label} {...stat} />)
          )}
        </div>

        {/* Mobile/Tablet Action Buttons */}
        <div className="flex lg:hidden items-center gap-2 w-full sm:w-auto sm:flex-shrink-0">
          {actions.map((action, index) => (
            <Button
              key={`mobile-action-${index}`}
              {...action}
              className={`flex-1 sm:flex-none ${action.hideOnMobile ? 'hidden sm:flex' : ''}`}
              disabled={action.disabled || isLoading}
            >
              {action.hideTextOnMobile ? '' : action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- HOOK FOR CREATING STANDARD ACTIONS ---

interface StandardActionsConfig<T extends TableOrViewName> {
  onRefresh?: () => void;
  onAddNew?: () => void;
  exportConfig?: ExportConfig<T>;
  isLoading?: boolean;
  data?: Row<T>[];
}

export function useStandardHeaderActions<T extends TableOrViewName>({
  onRefresh,
  onAddNew,
  exportConfig,
  isLoading,
  data
}: StandardActionsConfig<T>): ActionButton[] {
  const supabase = useMemo(() => createClient(), []);
  const columns = useDynamicColumnConfig(exportConfig?.tableName as T,{data: data});

  const tableExcelDownload = useTableExcelDownload(
    supabase,
    exportConfig?.tableName as T,
    { onSuccess: () => toast.success("Export successful!"), onError: (err) => toast.error(`Export failed: ${err.message}`) }
  );

  const handleExport = useCallback(() => {
    if (!exportConfig?.tableName) {
      toast.error("Export failed: Table name not configured.");
      return;
    }
    tableExcelDownload.mutate({
      fileName: `${formatDate(new Date(), { format: "dd-mm-yyyy" })}-${exportConfig.fileName ? exportConfig.fileName : exportConfig.tableName}.xlsx`,
      sheetName: exportConfig.fileName ? exportConfig.fileName : exportConfig.tableName,
      filters: exportConfig.filters,
      columns: columns.filter(c => exportConfig.columns ? exportConfig.columns.includes(c.key as any) : true),
      maxRows: exportConfig.maxRows
    });
  }, [exportConfig, columns, tableExcelDownload]);

  return useMemo(() => {
    const actions: ActionButton[] = [];

    if (onRefresh) {
      actions.push({
        label: "Refresh",
        onClick: onRefresh,
        variant: "outline",
        leftIcon: <FiRefreshCw className={isLoading ? "animate-spin" : ""} />,
        disabled: isLoading,
      });
    }

    if (exportConfig) {
      actions.push({
        label: tableExcelDownload.isPending ? 'Exporting...' : 'Export',
        onClick: handleExport,
        variant: "outline",
        leftIcon: <FiDownload />,
        disabled: isLoading || tableExcelDownload.isPending,
      });
    }

    if (onAddNew) {
      actions.push({
        label: "Add New",
        onClick: onAddNew,
        variant: "primary",
        leftIcon: <FiPlus />,
        disabled: isLoading,
      });
    }

    return actions;
  }, [onRefresh, onAddNew, exportConfig, isLoading, handleExport, tableExcelDownload.isPending]);
}