// app/dashboard/connections/page.tsx
'use client';

import { useMemo, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ErrorDisplay } from '@/components/common/ui';
import { DataTable, TableAction } from '@/components/table';
import { useCrudManager } from '@/hooks/useCrudManager';
import {
  V_system_connections_completeRowSchema,
  Lookup_typesRowSchema,
} from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { buildUploadConfig, TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { useOfflineQuery } from '@/hooks/data/useOfflineQuery';
import { localDb } from '@/hooks/data/localDb';
import { FiGitBranch, FiMonitor, FiEye, FiGrid, FiList, FiSearch, FiUpload } from 'react-icons/fi';
import { useAllSystemConnectionsData } from '@/hooks/data/useAllSystemConnectionsData';
import { SystemConnectionDetailsModal } from '@/components/system-details/SystemConnectionDetailsModal';
import { useTracePath, TraceRoutes } from '@/hooks/database/trace-hooks';
import SystemFiberTraceModal from '@/components/system-details/SystemFiberTraceModal';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/common/ui/Input';
import { SearchableSelect } from '@/components/common/ui/select/SearchableSelect';
import { ConnectionCard } from '@/components/connections/ConnectionCard';
import { Row } from '@/hooks/database';
import { SystemConnectionsTableColumns } from '@/config/table-columns/SystemConnectionsTableColumns';
import { SelectFilter } from '@/components/common/filters/FilterInputs';
import { SearchAndFilters } from '@/components/common/filters/SearchAndFilters';
import { useSystemConnectionExcelUpload } from '@/hooks/database/excel-queries/useSystemConnectionExcelUpload';
import { useUser } from '@/providers/UserProvider';
import { UserRole } from '@/types/user-roles';
import { UploadColumnMapping } from '@/hooks/database';

export default function GlobalConnectionsPage() {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isSuperAdmin, role } = useUser();

  // Permissions
  const canEdit = !!isSuperAdmin || [
    UserRole.ADMIN, 
    UserRole.CPANADMIN, 
    UserRole.MAANADMIN, 
    UserRole.SDHADMIN
  ].includes(role as UserRole);

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

  // Trace State
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);
  const [traceModalData, setTraceModalData] = useState<TraceRoutes | null>(null);
  const [isTracing, setIsTracing] = useState(false);
  const tracePath = useTracePath(supabase);

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
    dataQueryHook: useAllSystemConnectionsData,
    displayNameField: 'service_name',
    searchColumn: ['service_name', 'system_name', 'connected_system_name'],
  });

  // --- UPLOAD LOGIC ---
  const { mutate: uploadConnections, isPending: isUploading } = useSystemConnectionExcelUpload(supabase, {
    onSuccess: (result) => {
      if (result.successCount > 0) refetch();
    }
  });

  const handleUploadClick = useCallback(() => fileInputRef.current?.click(), []);
  
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
       // We build a column config that mimics the one in system details, but expects system_name
       const uploadConfig = buildUploadConfig("v_system_connections_complete");
       const customMapping: UploadColumnMapping<'v_system_connections_complete'>[] = [
         { excelHeader: 'System Name', dbKey: 'system_name', required: true }, // IMPORTANT for global upload
         ...uploadConfig.columnMapping.filter(c => c.dbKey !== 'system_id')
       ];
       uploadConnections({ file, columns: customMapping });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [uploadConnections]);

  // Fetch Filters
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

  const mediaOptions = useMemo(() => (mediaTypesData || []).map((t) => ({ value: t.id, label: t.name })), [mediaTypesData]);
  const linkTypeOptions = useMemo(() => (linkTypesData || []).map((t) => ({ value: t.id, label: t.name })), [linkTypesData]);

  // Columns: Pass true to show the System Name context
  const columns = SystemConnectionsTableColumns(connections, true);
  const orderedColumns = useOrderedColumns(columns, ['system_name', ...TABLE_COLUMN_KEYS.v_system_connections_complete]);

  // Handlers
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
      toast.error(error instanceof Error ? error.message : 'Failed to trace path');
      setIsTraceModalOpen(false);
    } finally {
      setIsTracing(false);
    }
  };

  const handleGoToSystem = (record: V_system_connections_completeRowSchema) => {
    if (record.system_id) {
      router.push(`/dashboard/systems/${record.system_id}`);
    }
  };

  const tableActions = useMemo((): TableAction<'v_system_connections_complete'>[] => [
    { key: 'view-details', label: 'Full Details', icon: <FiMonitor />, onClick: handleViewDetails, variant: 'primary' },
    { key: 'view-path', label: 'View Path', icon: <FiEye />, onClick: handleTracePath, variant: 'secondary', hidden: (record) => !(Array.isArray(record.working_fiber_in_ids) && record.working_fiber_in_ids.length > 0) },
    { key: 'go-to-system', label: 'Go to System', icon: <FiGitBranch />, onClick: handleGoToSystem, variant: 'secondary' },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [handleGoToSystem]);

  const headerActions = useStandardHeaderActions({
    data: connections,
    onRefresh: async () => { await refetch(); toast.success('Refreshed!'); },
    isLoading,
    exportConfig: { tableName: 'v_system_connections_complete', fileName: 'Global_Connections_List' },
  });

  // Inject Upload Button if allowed
  if (canEdit) {
    headerActions.splice(1, 0, {
      label: isUploading ? 'Uploading...' : 'Upload List',
      onClick: handleUploadClick,
      variant: 'outline',
      leftIcon: <FiUpload />,
      disabled: isUploading || isLoading,
      hideTextOnMobile: true
    });
  }

  const headerStats = [
    { value: totalCount, label: 'Total Connections' },
    { value: activeCount, label: 'Active', color: 'success' as const },
    { value: inactiveCount, label: 'Inactive', color: 'danger' as const },
  ];
  
  // Mobile Render for Table Mode
  const renderMobileItem = useCallback((record: Row<'v_system_connections_complete'>) => {
     return (
        <ConnectionCard 
            connection={record as V_system_connections_completeRowSchema}
            onViewDetails={handleViewDetails}
            onViewPath={handleTracePath}
            onGoToSystem={handleGoToSystem}
        />
     );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleGoToSystem]);

  if (error) return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]} />;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls, .csv" />

      <PageHeader
        title="Global Connection Explorer"
        description="View and search all service connections across the entire network."
        icon={<FiGitBranch />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isLoading && connections.length === 0}
        isFetching={isFetching}
      />

      {/* Sticky Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center sticky top-20 z-10">
          <div className="w-full lg:w-96">
            <Input 
                placeholder="Search service, system, or ID..." 
                value={search.searchQuery} 
                onChange={(e) => search.setSearchQuery(e.target.value)}
                leftIcon={<FiSearch className="text-gray-400" />}
                fullWidth
                clearable
            />
          </div>
          
          <div className="flex w-full lg:w-auto gap-3 overflow-x-auto pb-2 lg:pb-0">
             <div className="min-w-[160px]">
                <SearchableSelect 
                   placeholder="Link Type"
                   options={linkTypeOptions}
                   value={filters.filters.connected_link_type_id as string}
                   onChange={(v) => filters.setFilters(prev => ({...prev, connected_link_type_id: v}))}
                   clearable
                />
             </div>
             <div className="min-w-[160px]">
                 <SearchableSelect 
                   placeholder="Media Type"
                   options={mediaOptions}
                   value={filters.filters.media_type_id as string}
                   onChange={(v) => filters.setFilters(prev => ({...prev, media_type_id: v}))}
                   clearable
                />
             </div>
             <div className="min-w-[120px]">
                 <select
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.filters.status as string || ''}
                    onChange={(e) => filters.setFilters(prev => ({...prev, status: e.target.value}))}
                 >
                    <option value="">Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                 </select>
             </div>
             {/* View Toggle */}
             <div className="hidden sm:flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 h-10 shrink-0">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700'}`} title="Grid View"><FiGrid /></button>
                <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700'}`} title="Table View"><FiList /></button>
             </div>
          </div>
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {connections.map(conn => (
                <ConnectionCard 
                    key={conn.id} 
                    connection={conn}
                    onViewDetails={handleViewDetails}
                    onViewPath={handleTracePath}
                    onGoToSystem={handleGoToSystem}
                />
             ))}
             {connections.length === 0 && !isLoading && (
                 <div className="col-span-full py-16 text-center text-gray-500">
                    <FiGitBranch className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No connections found matching your criteria.</p>
                 </div>
             )}
          </div>
      ) : (
           <DataTable
            autoHideEmptyColumns={true}
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
                onChange: (p, s) => { pagination.setCurrentPage(p); pagination.setPageLimit(s); },
            }}
            customToolbar={
              <SearchAndFilters
                searchTerm={search.searchQuery}
                onSearchChange={search.setSearchQuery}
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(!showFilters)}
                onClearFilters={() => { search.setSearchQuery(''); filters.setFilters({}); }}
                hasActiveFilters={Object.keys(filters.filters).length > 0 || !!search.searchQuery}
                activeFilterCount={Object.keys(filters.filters).length}
                searchPlaceholder="Search service, customer..."
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
                    placeholder="Filter by Link Type"
                 />
                 <SelectFilter
                    label="Status"
                    filterKey="status"
                    filters={filters.filters}
                    setFilters={filters.setFilters}
                    options={[
                        { value: 'true', label: 'Active' },
                        { value: 'false', label: 'Inactive' }
                    ]}
                 />
              </SearchAndFilters>
            }
          />
      )}

      <SystemConnectionDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} connectionId={selectedConnectionId} />
      <SystemFiberTraceModal isOpen={isTraceModalOpen} onClose={() => setIsTraceModalOpen(false)} traceData={traceModalData} isLoading={isTracing} />
    </div>
  );
}