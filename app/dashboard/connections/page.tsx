// app/dashboard/connections/page.tsx
"use client";

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ErrorDisplay } from '@/components/common/ui';
import { DataTable, TableAction } from '@/components/table';
import { useCrudManager } from '@/hooks/useCrudManager';
import { V_system_connections_completeRowSchema, Lookup_typesRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { SystemConnectionsTableColumns } from '@/config/table-columns/SystemConnectionsTableColumns';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { SearchAndFilters } from '@/components/common/filters/SearchAndFilters';
import { SelectFilter } from '@/components/common/filters/FilterInputs';
import { useOfflineQuery } from '@/hooks/data/useOfflineQuery';
import { localDb } from '@/hooks/data/localDb';
import { FiGitBranch, FiMonitor, FiEye } from 'react-icons/fi';
import { useAllSystemConnectionsData } from '@/hooks/data/useAllSystemConnectionsData';
import { SystemConnectionDetailsModal } from '@/components/system-details/SystemConnectionDetailsModal';
import { useTracePath, TraceRoutes } from '@/hooks/database/trace-hooks';
import SystemFiberTraceModal from '@/components/system-details/SystemFiberTraceModal';
import { useRouter } from 'next/navigation';

export default function GlobalConnectionsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [showFilters, setShowFilters] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

  // Trace State
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);
  const [traceModalData, setTraceModalData] = useState<TraceRoutes | null>(null);
  const [isTracing, setIsTracing] = useState(false);
  const tracePath = useTracePath(supabase);

  // 1. Initialize CRUD Manager with Global Data Hook
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
  } = useCrudManager<'system_connections', V_system_connections_completeRowSchema>({
    tableName: 'system_connections',
    localTableName: 'v_system_connections_complete',
    dataQueryHook: useAllSystemConnectionsData, // Uses the new global hook
    displayNameField: 'service_name',
    searchColumn: ['service_name', 'system_name', 'connected_system_name']
  });

  // 2. Fetch Options for Filters
  const { data: mediaTypesData } = useOfflineQuery<Lookup_typesRowSchema[]>(
    ['media-types-filter'],
    async () => (await supabase.from('lookup_types').select('*').eq('category', 'MEDIA_TYPES')).data ?? [],
    async () => await localDb.lookup_types.where({ category: 'MEDIA_TYPES' }).toArray()
  );

  const { data: linkTypesData } = useOfflineQuery<Lookup_typesRowSchema[]>(
    ['link-types-filter'],
    async () => (await supabase.from('lookup_types').select('*').eq('category', 'LINK_TYPES')).data ?? [],
    async () => await localDb.lookup_types.where({ category: 'LINK_TYPES' }).toArray()
  );

  const mediaOptions = useMemo(() => (mediaTypesData || []).map(t => ({ value: t.id, label: t.name })), [mediaTypesData]);
  const linkTypeOptions = useMemo(() => (linkTypesData || []).map(t => ({ value: t.id, label: t.name })), [linkTypesData]);

  // 3. Configure Columns
  // pass 'true' to show the System Name column since we are in global view
  const columns = SystemConnectionsTableColumns(connections, true);
  
  // THE FIX: We want 'system_name' first. Since we are passing the entire TABLE_COLUMN_KEYS list
  // which contains 'system_name', we construct the array to force system_name to the front.
  // The updated hook will handle the duplication gracefully now.
  const orderedColumns = useOrderedColumns(columns, ['system_name', ...TABLE_COLUMN_KEYS.v_system_connections_complete]);

  // 4. Handlers
  const handleViewDetails = (record: V_system_connections_completeRowSchema) => {
    setSelectedConnectionId(record.id);
    setIsDetailsModalOpen(true);
  };

  const handleTracePath = async (record: V_system_connections_completeRowSchema) => {
    setIsTracing(true);
    setIsTraceModalOpen(true);
    setTraceModalData(null);
    try {
      const traceData = await tracePath(record);
      setTraceModalData(traceData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to trace path");
      setIsTraceModalOpen(false);
    } finally {
      setIsTracing(false);
    }
  };

  const handleGoToSystem = (record: V_system_connections_completeRowSchema) => {
      if(record.system_id) {
          router.push(`/dashboard/systems/${record.system_id}`);
      }
  };

  const tableActions = useMemo((): TableAction<'v_system_connections_complete'>[] => [
    {
      key: 'view-details',
      label: 'Full Details',
      icon: <FiMonitor />,
      onClick: handleViewDetails,
      variant: 'primary'
    },
    {
      key: 'view-path',
      label: 'View Path',
      icon: <FiEye />,
      onClick: handleTracePath,
      variant: 'secondary',
      hidden: (record) => !(Array.isArray(record.working_fiber_in_ids) && record.working_fiber_in_ids.length > 0)
    },
    {
        key: 'go-to-system',
        label: 'Go to System',
        icon: <FiGitBranch />,
        onClick: handleGoToSystem,
        variant: 'secondary'
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [handleGoToSystem]);

  const headerActions = useStandardHeaderActions({
    data: connections,
    onRefresh: async () => { await refetch(); toast.success('Refreshed!'); },
    isLoading,
    exportConfig: {
        tableName: 'v_system_connections_complete',
        fileName: 'Global_Connections_List'
    }
  });

  const headerStats = [
    { value: totalCount, label: 'Total Connections' },
    { value: activeCount, label: 'Active', color: 'success' as const },
    { value: inactiveCount, label: 'Inactive', color: 'danger' as const },
  ];

  // Mobile Renderer
  const renderMobileItem = (record: V_system_connections_completeRowSchema, actions: React.ReactNode) => (
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start">
             <div className="min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                    {record.service_name || record.connected_system_name || 'Unnamed'}
                </h3>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                   {record.system_name}
                </div>
             </div>
             {actions}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
             <div>Type: {record.connected_link_type_name || '-'}</div>
             <div>BW: {record.bandwidth_allocated || '-'}</div>
        </div>
      </div>
  );

  if (error) return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]} />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Global Connection Explorer"
        description="View and search all service connections across the entire network."
        icon={<FiGitBranch />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isLoading && connections.length === 0}
        isFetching={isFetching}
      />

      <DataTable
        tableName="v_system_connections_complete"
        data={connections}
        columns={orderedColumns}
        loading={isLoading}
        isFetching={isFetching}
        actions={tableActions}
        renderMobileItem={renderMobileItem}
        pagination={{
            current: pagination.currentPage,
            pageSize: pagination.pageLimit,
            total: totalCount,
            showSizeChanger: true,
            onChange: (p, s) => { pagination.setCurrentPage(p); pagination.setPageLimit(s); }
        }}
        searchable={false}
        customToolbar={
            <SearchAndFilters
                searchTerm={search.searchQuery}
                onSearchChange={search.setSearchQuery}
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(!showFilters)}
                onClearFilters={() => { search.setSearchQuery(''); filters.setFilters({}); }}
                hasActiveFilters={Object.keys(filters.filters).length > 0 || !!search.searchQuery}
                activeFilterCount={Object.keys(filters.filters).length}
                searchPlaceholder="Search Service, System, or ID..."
            >
                <SelectFilter
                    label="Media Type"
                    filterKey="media_type_id"
                    filters={filters.filters}
                    setFilters={filters.setFilters}
                    options={mediaOptions}
                />
                <SelectFilter
                    label="Link Type"
                    filterKey="connected_link_type_id"
                    filters={filters.filters}
                    setFilters={filters.setFilters}
                    options={linkTypeOptions}
                />
                <SelectFilter
                    label="Status"
                    filterKey="status"
                    filters={filters.filters}
                    setFilters={filters.setFilters}
                    options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]}
                />
            </SearchAndFilters>
        }
      />

      <SystemConnectionDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        connectionId={selectedConnectionId}
      />

      <SystemFiberTraceModal
        isOpen={isTraceModalOpen}
        onClose={() => setIsTraceModalOpen(false)}
        traceData={traceModalData}
        isLoading={isTracing}
      />
    </div>
  );
}