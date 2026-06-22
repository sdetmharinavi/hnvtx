// app/dashboard/power-readings/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUser } from '@/providers/UserProvider';
import { useCrudManager, UseCrudManagerReturn } from '@/hooks/useCrudManager';
import { usePowerReadingsData, PowerReadingsDataReturn } from '@/hooks/data/usePowerReadingsData';
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { FiRefreshCw, FiDownload, FiCalendar, FiX, FiSearch, FiActivity } from 'react-icons/fi';
import { Zap, ShieldAlert, Activity } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { ConfirmModal } from '@/components/common/ui';
import { createStandardActions } from '@/components/table/action-helpers';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { V_port_power_readingsRowSchema } from '@/schemas/zod-schemas';
import { useActiveRingOptions, useDropdownOptions } from '@/hooks/data/useDropdownOptions';
import { formatDate } from '@/utils/formatters';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useDataSync } from '@/hooks/data/useDataSync';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/common/ui/select/SearchableSelect';
import DatePicker from 'react-datepicker';
import { PERMISSIONS } from '@/config/permissions';
import { StatProps } from '@/components/common/page-header/StatCard';
import { DataTable, TableAction } from '@/components/table';
import { useTableExcelDownload } from '@/hooks/database/excel-queries';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { ActionButton } from '@/components/common/page-header';
import { Row } from '@/hooks/database/queries-type-helpers';

// Custom Date Input Box to match system styles
const CustomDateInput = React.forwardRef<
  HTMLButtonElement,
  { onClick?: () => void; onClear: () => void; hasValue: boolean; displayText: string }
>(({ onClick, onClear, hasValue, displayText }, ref) => (
  <button
    type="button"
    ref={ref}
    onClick={onClick}
    className="flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <div className="flex items-center gap-2 truncate">
      <FiCalendar className={`shrink-0 ${hasValue ? 'text-blue-500' : 'text-gray-400'}`} />
      <span className={`truncate text-left ${hasValue ? 'font-medium text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
        {displayText}
      </span>
    </div>
    {hasValue && (
      <FiX
        className="w-4 h-4 text-gray-400 hover:text-red-500 shrink-0 ml-2"
        onClick={(e) => {
          e.stopPropagation();
          onClear();
        }}
      />
    )}
  </button>
));
CustomDateInput.displayName = 'CustomDateInput';

export default function PowerReadingsHistoryPage() {
  const supabase = createClient();
  const isOnline = useOnlineStatus();
  const { sync, isSyncing } = useDataSync();
  const { canAccess } = useUser();
  const canDelete = canAccess(PERMISSIONS.canDeleteCritical);

  // Date filter state
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;

  const crud = useCrudManager<'port_power_readings', V_port_power_readingsRowSchema>({
    tableName: 'port_power_readings' as any, // Cast as any because it's a view context
    dataQueryHook: usePowerReadingsData,
    displayNameField: 'port',
    syncTables: ['port_power_readings', 'v_port_power_readings'],
  }) as unknown as UseCrudManagerReturn<V_port_power_readingsRowSchema> & PowerReadingsDataReturn;

  const {
    data: readings,
    totalCount,
    isLoading,
    isMutating,
    isFetching,
    refetch,
    pagination,
    search,
    filters,
    bulkActions,
    deleteModal,
    actions: crudActions,
    stats,
  } = crud;

  // Dropdown options for filtering
  const { options: ringOptions, isLoading: loadingRings } = useActiveRingOptions();

  const selectedRingId = filters.filters.ring_id ? String(filters.filters.ring_id) : null;

  // Fetch systems belonging to selected ring, or all if no ring selected
  const { options: systemOptions, isLoading: loadingSystems, originalData: systemsData } = useDropdownOptions({
    tableName: 'v_systems_complete',
    valueField: 'id',
    labelField: 'system_name',
    filters: selectedRingId ? { ring_id: selectedRingId } : {},
    orderBy: 'system_name',
  });

  const { mutate: exportPower, isPending: isExporting } = useTableExcelDownload(
    supabase,
    'v_port_power_readings' as any,
  );

  const handleExport = useCallback(() => {
    const columns: Column<Row<'v_port_power_readings'>>[] = [
      { key: 'reading_date', title: 'Date', dataIndex: 'reading_date', excelFormat: 'date' },
      { key: 'system_name', title: 'System', dataIndex: 'system_name' },
      { key: 'port', title: 'Port', dataIndex: 'port' },
      { key: 'tx_power', title: 'Tx Power (dBm)', dataIndex: 'tx_power', excelFormat: 'number' },
      { key: 'rx_power', title: 'Rx Power (dBm)', dataIndex: 'rx_power', excelFormat: 'number' },
      { key: 'recorded_by_name', title: 'Recorded By', dataIndex: 'recorded_by_name' },
      { key: 'remark', title: 'Remark', dataIndex: 'remark', width: 300 },
    ];

    exportPower({
      fileName: `Power_Measurement_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'Power Readings',
      filters: filters.filters,
      columns,
      wrapText: true,
      autoFitColumns: true,
    });
  }, [exportPower, filters.filters]);

  const isBusy = isLoading || isFetching || isSyncing;

  const handleRefresh = useCallback(async () => {
    if (isOnline) {
      await sync(['port_power_readings', 'v_port_power_readings']);
    }
    refetch();
    toast.success('Power history refreshed.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, refetch, sync]);

  // Sync date picker values to our CRUD manager filters
  useEffect(() => {
    filters.setFilters((prev) => {
      const next = { ...prev };
      if (startDate) next.start_date = startDate as any;
      else delete next.start_date;

      if (endDate) next.end_date = endDate as any;
      else delete next.end_date;

      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const handleClearFilters = () => {
    search.setSearchQuery('');
    setDateRange([null, null]);
    filters.setFilters({});
  };

  const hasActiveFilters = !!(search.searchQuery || filters.filters.ring_id || filters.filters.system_id || startDate || endDate);

  const handleFilterChange = useCallback(
    (key: string, value: string | null) => {
      filters.setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [filters],
  );

  const tableColumns = useMemo(
    (): Column<Row<'v_port_power_readings'>>[] => [
      {
        key: 'reading_date',
        title: 'Date',
        dataIndex: 'reading_date',
        sortable: true,
        width: 140,
        render: (val) =>
          formatDate(val as string, {
            format: 'dd-mm-yyyy',
            hour: '2-digit',
            minute: '2-digit',
          }),
      },
      {
        key: 'system_name',
        title: 'System',
        dataIndex: 'system_name',
        sortable: true,
        width: 180,
        render: (val) => <TruncateTooltip text={val as string} className="font-semibold text-gray-900 dark:text-gray-100" />,
      },
      {
        key: 'port',
        title: 'Port',
        dataIndex: 'port',
        sortable: true,
        width: 100,
        render: (val) => (
          <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{val as string}</span>
        ),
      },
      {
        key: 'tx_power',
        title: 'Tx Power',
        dataIndex: 'tx_power',
        sortable: true,
        width: 120,
        render: (val) =>
          val !== null ? (
            <span className="font-mono text-orange-600 dark:text-orange-400 font-bold">
              {val as number} dBm
            </span>
          ) : (
            <span className="text-gray-400">—</span>
          ),
      },
      {
        key: 'rx_power',
        title: 'Rx Power',
        dataIndex: 'rx_power',
        sortable: true,
        width: 120,
        render: (val) =>
          val !== null ? (
            <span className="font-mono text-green-600 dark:text-green-400 font-bold">
              {val as number} dBm
            </span>
          ) : (
            <span className="text-gray-400">—</span>
          ),
      },
      {
        key: 'recorded_by_name',
        title: 'Recorded By',
        dataIndex: 'recorded_by_name',
        width: 150,
      },
      {
        key: 'remark',
        title: 'Remarks',
        dataIndex: 'remark',
        width: 250,
        render: (val) => (
          <TruncateTooltip text={val as string} className="italic text-gray-500 dark:text-gray-400" />
        ),
      },
    ],
    [],
  );

  const tableActions = useMemo(
    () =>
      createStandardActions<Row<'v_port_power_readings'>>({
        onDelete: canDelete ? crudActions.handleDelete as any : undefined,
      }) as TableAction<'v_port_power_readings'>[],
    [canDelete, crudActions.handleDelete],
  );

  const headerStats = useMemo<StatProps[]>(() => {
    const s = stats || { total: 0, maxTx: null, minTx: null, maxRx: null, minRx: null };
    return [
      { value: totalCount, label: 'Filtered Readings', color: 'default' },
      {
        value: s.maxTx !== null ? `${s.maxTx} dBm` : '—',
        label: 'Highest Tx Level',
        color: 'warning',
        icon: <Zap className="w-5 h-5 text-orange-500" />,
      },
      {
        value: s.minTx !== null ? `${s.minTx} dBm` : '—',
        label: 'Lowest Tx Level',
        color: 'warning',
        icon: <Zap className="w-5 h-5 text-orange-300" />,
      },
      {
        value: s.maxRx !== null ? `${s.maxRx} dBm` : '—',
        label: 'Highest Rx Level',
        color: 'success',
        icon: <Activity className="w-5 h-5 text-green-500" />,
      },
      {
        value: s.minRx !== null ? `${s.minRx} dBm` : '—',
        label: 'Lowest Rx Level',
        color: 'success',
        icon: <Activity className="w-5 h-5 text-green-300" />,
      },
    ];
  }, [stats, totalCount]);

  const headerActions = useMemo(
    (): ActionButton[] => [
      {
        label: 'Refresh',
        onClick: handleRefresh,
        variant: 'outline',
        leftIcon: <FiRefreshCw className={isBusy ? 'animate-spin' : ''} />,
        disabled: isBusy,
      },
      {
        label: isExporting ? 'Exporting...' : 'Export',
        onClick: handleExport,
        variant: 'outline',
        leftIcon: <FiDownload />,
        disabled: isExporting || isLoading,
        hideTextOnMobile: true,
      },
    ],
    [isBusy, isExporting, isLoading, handleRefresh, handleExport],
  );

  const customFilterToolbar = (
    <div className="flex flex-col lg:flex-row gap-3 items-center w-full flex-wrap">
      {/* Search Input */}
      <div className="relative w-full lg:w-64">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search port, remark..."
          value={search.searchQuery}
          onChange={(e) => search.setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Ring Selector */}
      <div className="w-full lg:w-48 z-40">
        <SearchableSelect
          options={ringOptions}
          value={filters.filters.ring_id ? String(filters.filters.ring_id) : ""}
          onChange={(v) => handleFilterChange("ring_id", v)}
          placeholder="All Rings"
          isLoading={loadingRings}
          clearable
        />
      </div>

      {/* System Selector */}
      <div className="w-full lg:w-48 z-40">
        <SearchableSelect
          options={systemOptions}
          value={filters.filters.system_id ? String(filters.filters.system_id) : ""}
          onChange={(v) => handleFilterChange("system_id", v)}
          placeholder="All Systems"
          disabled={!systemsData || (systemsData as any[]).length === 0}
          isLoading={loadingSystems}
          clearable
        />
      </div>

      {/* Date Range Picker */}
      <div className="w-full lg:w-auto z-40">
        <DatePicker
          selectsRange={true}
          startDate={startDate}
          endDate={endDate}
          onChange={(update: [Date | null, Date | null]) => setDateRange(update)}
          isClearable={false}
          dateFormat="dd MMM yyyy"
          maxDate={new Date()}
          portalId="root-portal"
          customInput={
            <CustomDateInput
              onClear={() => setDateRange([null, null])}
              hasValue={!!(startDate || endDate)}
              displayText={
                startDate && endDate
                  ? `${formatDate(startDate, { format: 'dd-mm-yyyy' })} → ${formatDate(endDate, { format: 'dd-mm-yyyy' })}`
                  : startDate
                    ? `${formatDate(startDate, { format: 'dd-mm-yyyy' })} → ...`
                    : 'Select Date Range'
              }
            />
          }
        />
      </div>
    </div>
  );

  return (
    <DashboardPageLayout
      header={{
        title: 'Global Power Readings Explorer',
        description: 'View and search all logged port power levels across the entire network.',
        icon: <FiActivity />,
        stats: headerStats, // Interactive Stats
        actions: headerActions,
        isLoading,
        isFetching,
      }}
      searchPlaceholder="" 
      onSearchChange={() => {}} 
      filters={{}} 
      onFilterChange={() => {}}
      filterConfigs={[]} 
      autoDeleteModal={false} 
      renderGrid={() => <div className="text-center py-10 text-gray-500">Grid view not supported. Please switch to Table view.</div>}
      tableProps={{
        tableName: 'v_port_power_readings',
        data: readings as unknown as Row<'v_port_power_readings'>[],
        columns: tableColumns,
        loading: isLoading,
        isFetching: isBusy || isMutating,
        actions: tableActions,
        selectable: canDelete,
        onRowSelect: (rows) => {
          const validRows = rows.filter(
            (row): row is Row<'v_port_power_readings'> & { id: string } => !!row.id,
          );
          bulkActions.handleRowSelect(validRows);
        },
        pagination: {
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          showSizeChanger: true,
          onChange: (page, pageSize) => {
            pagination.setCurrentPage(page);
            pagination.setPageLimit(pageSize);
          },
        },
        customToolbar: customFilterToolbar,
      }}
      modals={
        <>
          <ConfirmModal
            isOpen={deleteModal.isOpen}
            onConfirm={deleteModal.onConfirm}
            onCancel={deleteModal.onCancel}
            title="Delete Power Record"
            message={deleteModal.message}
            type="danger"
            loading={deleteModal.loading}
          />
        </>
      }
    />
  );
}