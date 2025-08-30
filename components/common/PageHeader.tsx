"use client";

import React, { ReactNode, useCallback, useMemo, useState } from "react";
import { FiDownload, FiPlus, FiRefreshCw, FiChevronDown } from "react-icons/fi";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { Filters, TableOrViewName, Row } from "@/hooks/database";
import { useDynamicColumnConfig } from "@/hooks/useColumnConfig";
import { Button, ButtonProps } from "@/components/common/ui/Button/Button";
import { useTableExcelDownload } from "@/hooks/database/excel-queries";
import { formatDate } from "@/utils/formatters";
import { cn } from "@/lib/utils";

// --- TYPE DEFINITIONS ---

interface ExportFilterOption {
  label: string;
  filters?: Filters;
  fileName?: string;
}

interface ExportConfig<T extends TableOrViewName> {
  tableName: T;
  maxRows?: number;
  columns?: (keyof Row<T> & string)[]; // Allow specifying a subset of columns for export
  filterOptions?: ExportFilterOption[]; // New: array of filter options
  // Deprecated: keeping for backward compatibility
  filters?: Filters;
  fileName?: string;
}

export interface ActionButton extends ButtonProps {
  label: string;
  hideOnMobile?: boolean;
  hideTextOnMobile?: boolean;
  priority?: 'high' | 'medium' | 'low'; // For mobile button ordering
  isDropdown?: boolean; // New: indicates if this is a dropdown button
  dropdownOptions?: Array<{
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }>;
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
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 flex items-start gap-4">
        {icon && <div className={`flex-shrink-0 text-2xl ${statColors[color]}`}>{icon}</div>}
        <div>
          <div className={`text-2xl font-bold ${statColors[color]}`}>{value}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
        </div>
      </div>
    );
};

const DropdownButton: React.FC<ActionButton> = ({ 
  label, 
  dropdownOptions = [], 
  disabled, 
  variant = "outline",
  leftIcon,
  className,
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        {...props}
        variant={variant}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn("flex items-center gap-2", className)}
        leftIcon={leftIcon}
        rightIcon={<FiChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
      >
        {label}
      </Button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown Menu */}
          <div className="absolute right-0 top-full z-20 mt-1 min-w-[200px] rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {dropdownOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  option.onClick();
                  setIsOpen(false);
                }}
                disabled={option.disabled}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
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
            action.isDropdown ? (
              <DropdownButton
                key={`desktop-dropdown-${index}`}
                {...action}
                disabled={action.disabled || isLoading}
              />
            ) : (
              <Button
                key={`desktop-action-${index}`}
                {...action}
                disabled={action.disabled || isLoading}
              >
                {action.label}
              </Button>
            )
          ))}
        </div>
      </div>

      {/* Stats and Mobile Actions Row */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-grow">
          {isLoading ? (
            Array.from({ length: stats?.length || 2 }).map((_, i) => (
              <div key={`stat-skeleton-${i}`} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 animate-pulse">
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
            action.isDropdown ? (
              <DropdownButton
                key={`mobile-dropdown-${index}`}
                {...action}
                className={`flex-1 sm:flex-none ${action.hideOnMobile ? 'hidden sm:flex' : ''}`}
                disabled={action.disabled || isLoading}
              />
            ) : (
              <Button
                key={`mobile-action-${index}`}
                {...action}
                className={`flex-1 sm:flex-none ${action.hideOnMobile ? 'hidden sm:flex' : ''}`}
                disabled={action.disabled || isLoading}
              >
                {action.hideTextOnMobile ? '' : action.label}
              </Button>
            )
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
  const columns = useDynamicColumnConfig(exportConfig?.tableName as T, { data: data });

  const tableExcelDownload = useTableExcelDownload(
    supabase,
    exportConfig?.tableName as T,
    { 
      onSuccess: () => toast.success("Export successful!"), 
      onError: (err) => toast.error(`Export failed: ${err.message}`) 
    },
  );

  const handleExport = useCallback((filterOption?: ExportFilterOption) => {
    if (!exportConfig?.tableName) {
      toast.error("Export failed: Table name not configured.");
      return;
    }

    // Use filterOption filters if provided, otherwise fall back to exportConfig filters
    const filters = filterOption?.filters || exportConfig.filters;
    
    // Determine the file and sheet name
    let fileName: string;
    let sheetName: string;
    
    if (filterOption) {
      // If it's a filter option, use custom fileName or append label to table name
      if (filterOption.fileName) {
        fileName = filterOption.fileName;
        sheetName = filterOption.fileName;
      } else {
        // Append filter label to table name
        fileName = `${exportConfig.tableName}-${filterOption.label.toLowerCase().replace(/\s+/g, '-')}`;
        sheetName = `${exportConfig.tableName}-${filterOption.label}`;
      }
    } else {
      // No filter option - use default table name or custom fileName
      fileName = exportConfig.fileName || exportConfig.tableName;
      sheetName = exportConfig.fileName || exportConfig.tableName;
    }

    tableExcelDownload.mutate({
      fileName: `${formatDate(new Date(), { format: "dd-mm-yyyy" })}-${fileName}.xlsx`,
      sheetName: sheetName,
      filters: filters,
      columns: columns.filter(c => 
        exportConfig.columns ? exportConfig.columns.includes(c.key as keyof Row<T> & string) : true
      ),
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
      // Check if we have multiple filter options
      if (exportConfig.filterOptions && exportConfig.filterOptions.length > 0) {
        // Create dropdown with filter options
        const dropdownOptions = [
          {
            label: "Export All (No Filters)",
            onClick: () => handleExport({ label: "All", filters: undefined, fileName: undefined }),
            disabled: tableExcelDownload.isPending
          },
          ...exportConfig.filterOptions.map(option => ({
            label: `Export ${option.label}`,
            onClick: () => handleExport(option),
            disabled: tableExcelDownload.isPending
          }))
        ];

        actions.push({
          label: tableExcelDownload.isPending ? 'Exporting...' : 'Export',
          variant: "outline",
          leftIcon: <FiDownload />,
          disabled: isLoading || tableExcelDownload.isPending,
          isDropdown: true,
          dropdownOptions: dropdownOptions
        });
      } else {
        // Single export button (backward compatibility)
        actions.push({
          label: tableExcelDownload.isPending ? 'Exporting...' : 'Export',
          onClick: () => handleExport(),
          variant: "outline",
          leftIcon: <FiDownload />,
          disabled: isLoading || tableExcelDownload.isPending,
        });
      }
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