"use client";

import { Button } from "@/components/common/ui/Button";
import { Filters } from "@/hooks/database";
import { useTableExcelDownload } from "@/hooks/database/excel-queries";
import { useDynamicColumnConfig } from "@/hooks/useColumnConfig";
import { formatDate } from "@/utils/formatters";
import { createClient } from "@/utils/supabase/client";
import { useMemo } from "react";
import { FiDownload, FiPlus, FiRefreshCw, FiTrendingUp } from "react-icons/fi";
import { toast } from "sonner";
import { AuthTableOrViewName, TableOrViewName } from "@/hooks/database";
import { ButtonProps } from "./ui/Button/Button";

interface ExportConfig<T extends AuthTableOrViewName | TableOrViewName> {
  tableName: T;
  filters?: Filters;
  maxRows?: number;
  customStyles?: Record<string, unknown>;
}

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  rounded?: ButtonProps['rounded'];
  fullWidth?: ButtonProps['fullWidth'];
  leftIcon?: ButtonProps['leftIcon'];
  rightIcon?: ButtonProps['rightIcon'];
  disabled?: boolean;
  hideOnMobile?: boolean;
  hideTextOnMobile?: boolean;
  tooltip?: string;
  priority?: 'high' | 'medium' | 'low'; // For mobile button ordering
}

interface PageHeaderProps {
  title: string;
  description: string;
  totalCount: number;
  countLabel?: string;
  onRefresh?: () => void;
  onAddNew?: () => void;
  addButtonLabel?: string;
  isLoading?: boolean;
  showExport?: boolean;
  exportConfig?: ExportConfig<TableOrViewName>;
  customActions?: ActionButton[];
  showRefresh?: boolean;
  badge?: {
    text: string;
    badgeVariant?: 'success' | 'warning' | 'info' | 'error';
  };
  showTrend?: boolean;
  trendValue?: number;
  lastUpdated?: Date;
}

const Badge = ({ text, badgeVariant = 'info' }: { text: string; badgeVariant?: 'success' | 'warning' | 'info' | 'error' }) => {
  const variantStyles = {
    success: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    warning: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
    info: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    error: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles[badgeVariant]}`}>
      {text}
    </span>
  );
};

const CounterCard = ({ 
  count, 
  label, 
  showTrend, 
  trendValue, 
  lastUpdated 
}: { 
  count: number; 
  label: string; 
  showTrend?: boolean; 
  trendValue?: number; 
  lastUpdated?: Date;
}) => (
  <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 w-full sm:w-auto">
    <div className="flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
          {count.toLocaleString()}
        </p>
        {lastUpdated && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Updated {formatDate(lastUpdated, { format: "dd-mm-yyyy" })}
          </p>
        )}
      </div>
      {showTrend && trendValue !== undefined && (
        <div className="flex items-center flex-shrink-0 ml-4">
          <FiTrendingUp className={`h-4 w-4 ${trendValue >= 0 ? 'text-green-500' : 'text-red-500 rotate-180'}`} />
          <span className={`text-sm font-medium ml-1 ${trendValue >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {trendValue > 0 ? '+' : ''}{trendValue}%
          </span>
        </div>
      )}
    </div>
  </div>
);

export function PageHeader({
  title,
  description,
  totalCount,
  countLabel = "Total Items",
  onRefresh,
  onAddNew,
  addButtonLabel = "Add Item",
  isLoading = false,
  showExport = false,
  exportConfig,
  customActions = [],
  showRefresh = true,
  badge,
  showTrend = false,
  trendValue,
  lastUpdated,
}: PageHeaderProps) {
  // Download configuration
  const supabase = useMemo(() => createClient(), []);
  const tableName = exportConfig?.tableName;
  
  // Only enable export functionality if we have a valid table name
  const columns = useDynamicColumnConfig(tableName!);
  
  const serverFilters = useMemo(() => {
    return exportConfig?.filters || {};
  }, [exportConfig?.filters]);

  const tableExcelDownload = useTableExcelDownload(
    supabase, 
    tableName!,
    {
      onSuccess: () => {
        toast.success("Export completed successfully! 📊");
      },
      onError: (error) => {
        console.error("Export failed:", error);
        toast.error("Export failed. Please try again.");
      },
    }
  );

  const handleBuiltInExport = async () => {
    if (!tableName) {
      toast.error("Cannot export: No table name provided");
      return;
    }
    
    const tableOptions = {
      fileName: `${formatDate(new Date(), { format: "dd-mm-yyyy" })}-${exportConfig!.tableName}-export.xlsx`,
      sheetName: exportConfig!.tableName,
      columns: columns,
      filters: serverFilters,
      maxRows: exportConfig!.maxRows || 1000,
      customStyles: exportConfig!.customStyles || {},
    };
    
    toast.promise(
      tableExcelDownload.mutateAsync(tableOptions),
      {
        loading: 'Preparing export...',
        success: 'Export ready for download! 📥',
        error: 'Export failed. Please try again.',
      }
    );
  };

  // Create built-in actions based on props, but only if not provided in customActions
  const builtInActions: ActionButton[] = [];

  // Check if actions are already in customActions
  const hasCustomRefresh = customActions.some(action => 
    action.label.toLowerCase().includes('refresh') || 
    action.onClick === onRefresh
  );
  
  const hasCustomExport = customActions.some(action => 
    action.label.toLowerCase().includes('export')
  );
  
  const hasCustomAdd = customActions.some(action => 
    action.label.toLowerCase().includes('add') || 
    action.onClick === onAddNew
  );

  // Add built-in refresh if not in custom actions
  if (showRefresh && onRefresh && !hasCustomRefresh) {
    builtInActions.push({
      label: "Refresh",
      onClick: onRefresh,
      variant: "outline",
      size: "sm",
      leftIcon: <FiRefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />,
      disabled: isLoading,
      tooltip: "Refresh data",
      priority: 'medium',
    });
  }

  // Add built-in export if not in custom actions
  if (showExport && exportConfig?.tableName && !hasCustomExport) {
    builtInActions.push({
      label: tableExcelDownload.isPending ? 'Exporting...' : 'Export',
      onClick: handleBuiltInExport,
      variant: "outline",
      size: "sm",
      leftIcon: <FiDownload className="h-4 w-4" />,
      disabled: isLoading || tableExcelDownload.isPending,
      tooltip: "Export data to Excel",
      priority: 'low',
    });
  }

  // Add built-in add button if not in custom actions
  if (onAddNew && !hasCustomAdd) {
    builtInActions.push({
      label: addButtonLabel,
      onClick: onAddNew,
      variant: "outline",
      size: "sm",
      leftIcon: <FiPlus className="h-4 w-4" />,
      disabled: isLoading,
      tooltip: `Add new ${addButtonLabel.toLowerCase()}`,
      priority: 'high',
    });
  }

  // Combine and sort actions by priority for mobile
  const allActions = [...customActions, ...builtInActions];
  const sortedActionsForMobile = [...allActions].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = priorityOrder[a.priority || 'medium'];
    const bPriority = priorityOrder[b.priority || 'medium'];
    return aPriority - bPriority;
  });

  // Split actions for different layouts
  const visibleMobileActions = sortedActionsForMobile.filter(action => !action.hideOnMobile);
  const primaryActions = visibleMobileActions.slice(0, 2); // Show max 2 primary actions on mobile
  const secondaryActions = visibleMobileActions.slice(2); // Rest go to overflow

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
          {/* Title and Badge */}
          <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent leading-tight">
              {title}
            </h1>
            {badge && (
              <div className="flex-shrink-0">
                <Badge text={badge.text} badgeVariant={badge.badgeVariant} />
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg leading-relaxed">
            {description}
          </p>
        </div>

        {/* Desktop Action Buttons */}
        <div className="hidden lg:flex items-center gap-2 flex-shrink-0 ml-4">
          {allActions.map((action, index) => (
            <Button
              key={`desktop-${index}`}
              onClick={action.onClick}
              variant={action.variant || 'outline'}
              size={action.size || 'sm'}
              rounded={action.rounded || 'md'}
              leftIcon={action.leftIcon}
              rightIcon={action.rightIcon}
              className="transition-colors whitespace-nowrap"
              disabled={action.disabled || isLoading}
              title={action.tooltip}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats and Actions Row */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        {/* Stats Card */}
        <div className="flex-shrink-0 w-full sm:w-auto">
          <CounterCard
            count={totalCount}
            label={countLabel}
            showTrend={showTrend}
            trendValue={trendValue}
            lastUpdated={lastUpdated}
          />
        </div>

        {/* Mobile/Tablet Action Buttons */}
        <div className="flex lg:hidden flex-col space-y-3 w-full sm:w-auto sm:flex-shrink-0 sm:min-w-0">
          {/* Primary Actions Row */}
          {primaryActions.length > 0 && (
            <div className="flex gap-2 w-full sm:w-auto sm:justify-end">
              {primaryActions.map((action, index) => (
                <Button
                  key={`primary-${index}`}
                  onClick={action.onClick}
                  variant={action.variant || 'outline'}
                  size={action.size || 'sm'}
                  className="flex-1 sm:flex-none transition-colors"
                  disabled={action.disabled || isLoading}
                  title={action.tooltip}
                  leftIcon={action.leftIcon}
                  rightIcon={action.rightIcon}
                  rounded={action.rounded}
                >
                  <span className={`${action.hideTextOnMobile ? 'sr-only sm:not-sr-only' : ''} whitespace-nowrap`}>
                    {action.label}
                  </span>
                </Button>
              ))}
            </div>
          )}

          {/* Secondary Actions Row - Only show if there are secondary actions */}
          {secondaryActions.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 w-full sm:w-auto sm:justify-end">
              <div className="flex gap-2 flex-nowrap">
                {secondaryActions.map((action, index) => (
                  <Button
                    key={`secondary-${index}`}
                    onClick={action.onClick}
                    variant={action.variant || 'outline'}
                    size="sm"
                    className="flex-shrink-0 transition-colors"
                    disabled={action.disabled || isLoading}
                    title={action.tooltip}
                    leftIcon={action.leftIcon}
                    rightIcon={action.rightIcon}
                    rounded={action.rounded}
                  >
                    <span className={`${action.hideTextOnMobile ? 'sr-only' : ''} whitespace-nowrap`}>
                      {action.hideTextOnMobile ? '' : action.label}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}