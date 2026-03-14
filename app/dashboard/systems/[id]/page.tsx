// app/dashboard/systems/[id]/page.tsx
'use client';

import { useMemo, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ErrorDisplay, Input, PageSpinner } from '@/components/common/ui';
import { DataTable, TableAction } from '@/components/table';
import { Filters, Row, usePagedData } from '@/hooks/database';
import {
  V_system_connections_completeRowSchema,
  V_systems_completeRowSchema,
} from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { DEFAULTS } from '@/constants/constants';
import { createStandardActions } from '@/components/table/action-helpers';
import { useTracePath, TraceRoutes } from '@/hooks/database/trace-hooks';
import { Eye, Monitor } from 'lucide-react';
import { SystemConnectionsTableColumns } from '@/config/table-columns/SystemConnectionsTableColumns';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { StatProps } from '@/components/common/page-header/StatCard';
import { usePortsData } from '@/hooks/data/usePortsData';
import { useSystemConnectionsData } from '@/hooks/data/useSystemConnectionsData';
import { SelectFilter } from '@/components/common/filters/FilterInputs';
import { useLookupTypeOptions } from '@/hooks/data/useDropdownOptions';
import { FiDatabase, FiPieChart, FiGrid, FiList, FiSearch } from 'react-icons/fi';
import { StatsConfigModal, StatsFilterState } from '@/components/system-details/StatsConfigModal';
import { ConnectionCard } from '@/components/system-details/connections/ConnectionCard';
import { useDataSync } from '@/hooks/data/useDataSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import dynamic from 'next/dynamic';

const SystemFiberTraceModal = dynamic(
  () => import('@/components/system-details/SystemFiberTraceModal').then((mod) => mod.default),
  { ssr: false },
);

// Note: Ensure this Details Modal component has been updated to remove edit/delete buttons
const SystemConnectionDetailsModal = dynamic(
  () =>
    import('@/components/system-details/SystemConnectionDetailsModal').then(
      (mod) => mod.SystemConnectionDetailsModal,
    ),
  { ssr: false },
);

export default function SystemConnectionsPage() {
  const params = useParams();
  const systemId = params.id as string;
  const supabase = createClient();

  const { sync: syncData, isSyncing: isSyncingData } = useDataSync();
  const isOnline = useOnlineStatus();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(DEFAULTS.PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({});

  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);
  const [traceModalData, setTraceModalData] = useState<TraceRoutes | null>(null);
  const [isTracing, setIsTracing] = useState(false);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsConnectionId, setDetailsConnectionId] = useState<string | null>(null);

  const [isStatsConfigOpen, setIsStatsConfigOpen] = useState(false);
  const [statsFilters, setStatsFilters] = useState<StatsFilterState>({
    includeAdminDown: true,
    selectedCapacities: [],
    selectedTypes: [],
  });

  const tracePath = useTracePath(supabase);
  const { options: mediaOptions } = useLookupTypeOptions('MEDIA_TYPES');
  const { options: linkTypeOptions } = useLookupTypeOptions('LINK_TYPES');

  const useData = useSystemConnectionsData(systemId);
  const {
    data: connections,
    totalCount: totalConnections,
    isLoading: isLoadingConnections,
    refetch,
    isFetching,
  } = useData({
    currentPage,
    pageLimit,
    searchQuery,
    filters,
  });

  const sortedConnections = useMemo(() => {
    if (!searchQuery && connections.length > 0) {
      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
      return [...connections].sort((a, b) => {
        const portA = a.system_working_interface || '';
        const portB = b.system_working_interface || '';
        if (portA === portB) {
          return (a.service_name || '').localeCompare(b.service_name || '');
        }
        return collator.compare(portA, portB);
      });
    }
    return connections;
  }, [connections, searchQuery]);

  const { data: systemData, isLoading: isLoadingSystem } =
    usePagedData<V_systems_completeRowSchema>(supabase, 'v_systems_complete', {
      filters: { id: systemId },
    });
  const parentSystem = systemData?.data?.[0];

  const { data: ports = [] } = usePortsData(systemId)({
    currentPage: 1,
    pageLimit: 5000,
    searchQuery: '',
    filters: {},
  });

  const headerStats: StatProps[] = useMemo(() => {
    if (!ports || ports.length === 0) {
      return [{ label: 'Total Connections', value: totalConnections }];
    }

    const filteredPorts = ports.filter((p) => {
      if (!statsFilters.includeAdminDown && !p.port_admin_status) return false;
      if (statsFilters.selectedCapacities.length > 0) {
        if (!p.port_capacity || !statsFilters.selectedCapacities.includes(p.port_capacity))
          return false;
      }
      const typeLabel = p.port_type_code || p.port_type_name || 'Unknown';
      if (statsFilters.selectedTypes.length > 0) {
        if (!statsFilters.selectedTypes.includes(typeLabel)) return false;
      }
      return true;
    });

    const totalPorts = filteredPorts.length;
    const availablePorts = filteredPorts.filter(
      (p) => !p.port_utilization && p.port_admin_status,
    ).length;
    const portsDown = filteredPorts.filter((p) => !p.port_admin_status).length;
    const utilPercent =
      totalPorts > 0
        ? Math.round((filteredPorts.filter((p) => p.port_utilization).length / totalPorts) * 100)
        : 0;

    const typeStats = filteredPorts.reduce(
      (acc, port) => {
        const code =
          port.port_type_code ||
          (port.port_type_name
            ? port.port_type_name.replace(/[^A-Z0-9]/gi, '').substring(0, 6)
            : 'Other');
        if (!acc[code]) acc[code] = { total: 0, used: 0 };
        acc[code].total++;
        if (port.port_utilization) {
          acc[code].used++;
        }
        return acc;
      },
      {} as Record<string, { total: number; used: number }>,
    );

    const typeCards: StatProps[] = Object.entries(typeStats)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([code, stats]) => {
        const percentage = Math.round((stats.used / stats.total) * 100);
        return {
          label: `${code}`,
          value: `${stats.used} / ${stats.total} (${percentage}%)`,
          color: percentage > 90 ? 'warning' : 'default',
        };
      });

    return [
      { label: 'Connections', value: totalConnections, color: 'default' },
      {
        label: `Utilization ${statsFilters.selectedCapacities.length ? '(Filtered)' : ''}`,
        value: `${utilPercent}%`,
        color: utilPercent > 80 ? 'warning' : 'default',
      },
      {
        label: 'Free Ports',
        value: availablePorts,
        color: availablePorts === 0 ? 'danger' : 'success',
      },
      ...(portsDown > 0
        ? [{ label: 'Ports Down', value: portsDown, color: 'danger' as const }]
        : []),
      ...typeCards,
    ];
  }, [ports, totalConnections, statsFilters]);

  const columns = SystemConnectionsTableColumns(connections);
  const orderedColumns = useOrderedColumns(columns, [
    ...TABLE_COLUMN_KEYS.v_system_connections_complete,
  ]);

  const handleTracePath = useCallback(
    async (record: V_system_connections_completeRowSchema) => {
      setIsTracing(true);
      setIsTraceModalOpen(true);
      setTraceModalData(null);
      try {
        const traceData = await tracePath(record);
        setTraceModalData(traceData);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to trace path');
        setIsTraceModalOpen(false);
      } finally {
        setIsTracing(false);
      }
    },
    [tracePath],
  );

  const handleViewDetails = useCallback((record: V_system_connections_completeRowSchema) => {
    setDetailsConnectionId(record.id);
    setIsDetailsModalOpen(true);
  }, []);

  const tableActions = useMemo((): TableAction<'v_system_connections_complete'>[] => {
    const standard = createStandardActions<'v_system_connections_complete'>({
      // Read only - NO edit/delete
    });
    const isProvisioned = (record: V_system_connections_completeRowSchema) =>
      Array.isArray(record.working_fiber_in_ids) && record.working_fiber_in_ids.length > 0;

    return [
      {
        key: 'view-details',
        label: 'Full Details',
        icon: <Monitor className='w-4 h-4' />,
        onClick: handleViewDetails,
        variant: 'primary',
      },
      {
        key: 'view-path',
        label: 'View Path',
        icon: <Eye className='w-4 h-4' />,
        onClick: handleTracePath,
        variant: 'secondary',
        hidden: (record) => !isProvisioned(record),
      },
      ...standard,
    ];
  }, [handleTracePath, handleViewDetails]);

  const isBusy = isLoadingConnections || isSyncingData || isFetching;

  const headerActions = useStandardHeaderActions({
    onRefresh: async () => {
      if (isOnline) {
        await syncData([
          'system_connections',
          'v_system_connections_complete',
          'ports_management',
          'v_ports_management_complete',
          'services',
          'v_services',
        ]);
      } else {
        refetch();
      }
      toast.success('Connections refreshed!');
    },
    isLoading: isBusy,
  });

  headerActions.splice(0, 0, {
    label: 'Configure Stats',
    onClick: () => setIsStatsConfigOpen(true),
    variant: 'outline',
    leftIcon: <FiPieChart />,
    disabled: isLoadingConnections || !ports.length,
    hideTextOnMobile: true,
  });

  const renderMobileItem = useCallback(
    (record: Row<'v_system_connections_complete'>) => {
      return (
        <div className='flex flex-col gap-3'>
          <ConnectionCard
            connection={record as V_system_connections_completeRowSchema}
            parentSystemId={systemId}
            onViewDetails={handleViewDetails}
            onViewPath={handleTracePath}
            isSystemContext={true}
            // Force read-only
            canEdit={false}
            canDelete={false}
          />
        </div>
      );
    },
    [systemId, handleViewDetails, handleTracePath],
  );

  if (isLoadingSystem) return <PageSpinner text='Loading system details...' />;
  if (!parentSystem) return <ErrorDisplay error='System not found.' />;

  return (
    <div className='p-6 space-y-6'>
      <PageHeader
        title={`${parentSystem.system_name} (${parentSystem.ip_address?.split('/')[0] || 'N/A'})`}
        description={`Viewing connections for ${parentSystem.system_type_code} at ${parentSystem.node_name}`}
        icon={<FiDatabase />}
        actions={headerActions}
        stats={headerStats}
      />

      <StatsConfigModal
        isOpen={isStatsConfigOpen}
        onClose={() => setIsStatsConfigOpen(false)}
        ports={ports}
        filters={statsFilters}
        onApply={setStatsFilters}
      />

      <div className='bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center sticky top-20 z-10 mb-4'>
        <div className='w-full lg:w-96'>
          <Input
            placeholder='Search service, customer...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<FiSearch className='text-gray-400' />}
            fullWidth
            clearable
          />
        </div>

        <div className='flex w-full lg:w-auto gap-3 overflow-x-auto pb-2 lg:pb-0'>
          <div className='min-w-[160px]'>
            <SelectFilter
              label=''
              filterKey='media_type_id'
              filters={filters}
              setFilters={setFilters}
              options={mediaOptions}
              placeholder='All Media Types'
            />
          </div>
          <div className='min-w-[160px]'>
            <SelectFilter
              label=''
              filterKey='connected_link_type_id'
              filters={filters}
              setFilters={setFilters}
              options={linkTypeOptions}
              placeholder='All Link Types'
            />
          </div>
          <div className='min-w-[120px]'>
            <SelectFilter
              label=''
              filterKey='status'
              filters={filters}
              setFilters={setFilters}
              options={[
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ]}
              placeholder='All Status'
            />
          </div>
          <div className='hidden sm:flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 h-10 shrink-0 self-end'>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title='Grid View'
            >
              <FiGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title='Table View'
            >
              <FiList size={16} />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-6'>
          {sortedConnections.map((conn) => (
            <div key={conn.id} className='h-full'>
              <ConnectionCard
                connection={conn}
                parentSystemId={systemId}
                onViewDetails={handleViewDetails}
                onViewPath={handleTracePath}
                isSystemContext={true}
                canEdit={false} // Force read-only
                canDelete={false} // Force read-only
              />
            </div>
          ))}
          {sortedConnections.length === 0 && !isLoadingConnections && (
            <div className='col-span-full py-16 text-center text-gray-500'>
              <FiDatabase className='w-12 h-12 mx-auto mb-3 text-gray-300' />
              <div>No connections found matching your criteria.</div>
            </div>
          )}
        </div>
      ) : (
        <DataTable
          autoHideEmptyColumns={true}
          tableName='v_system_connections_complete'
          data={sortedConnections}
          columns={orderedColumns}
          loading={isLoadingConnections}
          isFetching={isLoadingConnections}
          actions={tableActions}
          renderMobileItem={renderMobileItem}
          selectable={false} // Force read-only
          pagination={{
            current: currentPage,
            pageSize: pageLimit,
            total: totalConnections,
            showSizeChanger: true,
            onChange: (page, limit) => {
              setCurrentPage(page);
              setPageLimit(limit);
            },
          }}
          searchable={false}
          customToolbar={<></>}
        />
      )}

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
        parentSystem={parentSystem}
      />
    </div>
  );
}
