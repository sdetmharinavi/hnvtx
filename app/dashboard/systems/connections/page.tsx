// app/dashboard/systems/connections/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { FiDatabase } from 'react-icons/fi';
import { toast } from 'sonner';

import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { ErrorDisplay, PageSpinner } from '@/components/common/ui';
import { ConnectionCard } from '@/components/system-details/connections/ConnectionCard';
import { SystemConnectionsTableColumns } from '@/config/table-columns/SystemConnectionsTableColumns';
import { V_system_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { useCrudManager } from '@/hooks/useCrudManager';
import { useStandardHeaderActions } from '@/components/common/page-header';
import { DataGrid } from '@/components/common/DataGrid';
import { createStandardActions } from '@/components/table/action-helpers';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import { useLookupTypeOptions } from '@/hooks/data/useDropdownOptions';
import { FilterConfig } from '@/components/common/filters/GenericFilterBar';
import { createClient } from '@/utils/supabase/client';
import { Row } from '@/hooks/database';
import { useTracePath } from '@/hooks/database/trace-hooks';
import dynamic from 'next/dynamic';
import { useDataSync } from '@/hooks/data/useDataSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useAllSystemConnectionsData } from '@/hooks/data/useAllSystemConnectionsData';
import { StatProps } from '@/components/common/page-header/StatCard';
import { TableAction } from '@/components/table/datatable-types';
import { Monitor, Eye } from 'lucide-react';

const SystemFiberTraceModal = dynamic(
  () => import('@/components/system-details/SystemFiberTraceModal').then((mod) => mod.default),
  { ssr: false },
);

const SystemConnectionDetailsModal = dynamic(
  () =>
    import('@/components/system-details/SystemConnectionDetailsModal').then(
      (mod) => mod.SystemConnectionDetailsModal,
    ),
  { ssr: false },
);

export default function GlobalConnectionsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { sync: syncData, isSyncing: isSyncingData } = useDataSync();
  const isOnline = useOnlineStatus();

  const[viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const[isTraceModalOpen, setIsTraceModalOpen] = useState(false);
  const [traceModalData, setTraceModalData] = useState<any>(null); 
  const [isTracing, setIsTracing] = useState(false);
  const[isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const[detailsConnectionId, setDetailsConnectionId] = useState<string | null>(null);

  const tracePath = useTracePath(supabase);

  // Read-only CRUD Manager
  const crud = useCrudManager<'system_connections', V_system_connections_completeRowSchema>({
    tableName: 'system_connections',
    localTableName: 'v_system_connections_complete',
    dataQueryHook: useAllSystemConnectionsData,
    displayNameField: 'service_name',
    syncTables:[
      'system_connections',
      'v_system_connections_complete',
      'systems',
      'v_systems_complete',
    ],
  });

  const {
    data: connections,
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    isFetching,
    error,
    refetch,
    pagination,
    search,
    filters,
  } = crud;

  const { options: mediaOptions, isLoading: loadingMedia } = useLookupTypeOptions('MEDIA_TYPES');
  const { options: linkOptions, isLoading: loadingLink } = useLookupTypeOptions('LINK_TYPES');

  const filterConfigs = useMemo<FilterConfig[]>(
    () =>[
      {
        key: 'connected_link_type_id',
        type: 'multi-select',
        options: linkOptions,
        isLoading: loadingLink,
        placeholder: 'Link Type',
      },
      {
        key: 'media_type_id',
        type: 'multi-select',
        options: mediaOptions,
        isLoading: loadingMedia,
        placeholder: 'Media Type',
      },
      {
        key: 'status',
        type: 'native-select',
        options:[
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' },
        ],
        placeholder: 'All Status',
      },
    ],[linkOptions, mediaOptions, loadingLink, loadingMedia],
  );

  const columns = SystemConnectionsTableColumns(connections);
  const orderedColumns = useOrderedColumns(columns, [...TABLE_COLUMN_KEYS.v_system_connections_complete]);

  const handleTrace = async (record: V_system_connections_completeRowSchema) => {
    setIsTracing(true);
    setIsTraceModalOpen(true);
    setTraceModalData(null);
    try {
      const data = await tracePath(record);
      setTraceModalData(data);
    } catch (err: any) {
      toast.error(err.message || 'Trace failed');
      setIsTraceModalOpen(false);
    } finally {
      setIsTracing(false);
    }
  };

  const handleViewDetails = (record: V_system_connections_completeRowSchema) => {
    setDetailsConnectionId(record.id);
    setIsDetailsModalOpen(true);
  };

  const handleGoToSystem = (record: V_system_connections_completeRowSchema) => {
    if (record.system_id) router.push(`/dashboard/systems/${record.system_id}`);
  };

  const renderItem = useCallback(
    (conn: V_system_connections_completeRowSchema) => (
      <ConnectionCard
        key={conn.id}
        connection={conn}
        onViewDetails={handleViewDetails}
        onViewPath={handleTrace}
        onGoToSystem={handleGoToSystem}
        canEdit={false} // Strictly read-only
        canDelete={false}
      />
    ),[handleTrace, handleGoToSystem]
  );

  const isBusy = isLoading || isFetching || isSyncingData;

  const headerActions = useStandardHeaderActions({
    data: connections,
    onRefresh: async () => {
      if (isOnline) {
        await syncData(['system_connections', 'v_system_connections_complete']);
        toast.success('Connections synchronized');
      } else {
        refetch();
      }
    },
    isLoading: isBusy,
    isFetching: isFetching,
  });

  const headerStats = useMemo<StatProps[]>(() => {
    const currentStatus = filters.filters.status;

    return[
      {
        value: totalCount,
        label: 'Total Connections',
        color: 'default',
        onClick: () =>
          filters.setFilters((prev) => {
            const next = { ...prev };
            delete next.status;
            return next;
          }),
        isActive: !currentStatus,
      },
      {
        value: activeCount,
        label: 'Active',
        color: 'success',
        onClick: () => filters.setFilters((prev) => ({ ...prev, status: 'true' })),
        isActive: currentStatus === 'true',
      },
      {
        value: inactiveCount,
        label: 'Inactive',
        color: 'danger',
        onClick: () => filters.setFilters((prev) => ({ ...prev, status: 'false' })),
        isActive: currentStatus === 'false',
      },
    ];
  },[totalCount, activeCount, inactiveCount, filters.filters.status, filters.setFilters]);

  const handleFilterChange = useCallback(
    (key: string, value: string | null) => {
      filters.setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [filters],
  );

  const tableActions = useMemo((): TableAction<'v_system_connections_complete'>[] => {
    const standard = createStandardActions<V_system_connections_completeRowSchema>({});
    const isProvisioned = (record: V_system_connections_completeRowSchema) =>
      Array.isArray(record.working_fiber_in_ids) && record.working_fiber_in_ids.length > 0;

    return[
      {
        key: 'view-details',
        label: 'Full Details',
        icon: <Monitor className="w-4 h-4" />,
        onClick: handleViewDetails,
        variant: 'primary',
      },
      {
        key: 'view-path',
        label: 'View Path',
        icon: <Eye className="w-4 h-4" />,
        onClick: handleTrace,
        variant: 'secondary',
        hidden: (record) => !isProvisioned(record),
      },
      ...standard,
    ];
  },[handleTrace]);

  if (error)
    return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch }]} />;

  return (
    <DashboardPageLayout
      header={{
        title: 'Global Connection Explorer',
        description: 'View and search all service connections across the entire network.',
        icon: <FiDatabase />,
        stats: headerStats,
        actions: headerActions,
        isLoading: isLoading && connections.length === 0,
        isFetching: isBusy,
      }}
      crud={crud}
      searchQuery={search.searchQuery}
      onSearchChange={search.setSearchQuery}
      searchPlaceholder='Search service, system, or ID...'
      filters={filters.filters}
      onFilterChange={handleFilterChange}
      filterConfigs={filterConfigs}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      renderGrid={() => (
        <DataGrid
          data={connections}
          renderItem={renderItem}
          isLoading={isLoading}
          isEmpty={connections.length === 0 && !isLoading}
          pagination={{
            current: pagination.currentPage,
            pageSize: pagination.pageLimit,
            total: totalCount,
            onChange: (p, s) => {
              pagination.setCurrentPage(p);
              pagination.setPageLimit(s);
            },
          }}
        />
      )}
      tableProps={{
        tableName: 'v_system_connections_complete',
        data: connections,
        columns: orderedColumns,
        loading: isLoading,
        isFetching: isFetching,
        actions: tableActions,
        searchable: false,
        selectable: false, // Read-only
        pagination: {
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          showSizeChanger: true,
          onChange: (p, s) => {
            pagination.setCurrentPage(p);
            pagination.setPageLimit(s);
          },
        },
        customToolbar: <></>,
      }}
      isEmpty={connections.length === 0 && !isLoading}
      modals={
        <>
          <SystemFiberTraceModal
            isOpen={isTraceModalOpen}
            onClose={() => setIsTraceModalOpen(false)}
            traceData={traceModalData}
            isLoading={isTracing}
          />
          <SystemConnectionDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            connectionId={detailsConnectionId}
            parentSystem={null}
          />
        </>
      }
    />
  );
}