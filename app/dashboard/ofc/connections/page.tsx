// app/dashboard/ofc/connections/page.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ErrorDisplay } from '@/components/common/ui';
import { DataTable } from '@/components/table';
import { useCrudManager } from '@/hooks/useCrudManager';
import { V_ofc_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { buildUploadConfig, TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { FiActivity, FiUpload, FiList, FiSearch } from 'react-icons/fi';
import { useAllOfcConnectionsData } from '@/hooks/data/useAllOfcConnectionsData';
import { OfcDetailsTableColumns } from '@/config/table-columns/OfcDetailsTableColumns';
import { Input } from '@/components/common/ui/Input';
import { SelectFilter } from '@/components/common/filters/FilterInputs';
import { useOfcConnectionsExcelUpload } from '@/hooks/database/excel-queries/useOfcConnectionsExcelUpload';
import { useUser } from '@/providers/UserProvider';
import { UserRole } from '@/types/user-roles';
import { Filters } from '@/hooks/database'; // THE FIX: Import Filters type

export default function GlobalOfcConnectionsPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isSuperAdmin, role } = useUser();

  const canEdit = !!isSuperAdmin || [UserRole.ADMIN, UserRole.ADMINPRO, UserRole.ASSETADMIN].includes(role as UserRole);
  
  // THE FIX: Use Filters type instead of Record<string, string>
  const [filters, setFilters] = useState<Filters>({});

  const {
    data: fibers,
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    isFetching,
    error,
    refetch,
    pagination,
    search,
  } = useCrudManager<'ofc_connections', V_ofc_connections_completeRowSchema>({
    tableName: 'ofc_connections',
    localTableName: 'v_ofc_connections_complete',
    dataQueryHook: useAllOfcConnectionsData,
    displayNameField: 'ofc_route_name',
    searchColumn: ['ofc_route_name', 'system_name'],
  });

  // --- UPLOAD LOGIC ---
  const { mutate: uploadFibers, isPending: isUploading } = useOfcConnectionsExcelUpload(supabase, {
    onSuccess: (result) => {
      if (result.successCount > 0) refetch();
    }
  });

  const handleUploadClick = useCallback(() => fileInputRef.current?.click(), []);
  
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
       const uploadConfig = buildUploadConfig("v_ofc_connections_complete");
       uploadFibers({ file, columns: uploadConfig.columnMapping });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [uploadFibers]);


  const columns = OfcDetailsTableColumns(fibers);
  const orderedColumns = useOrderedColumns(columns, ['ofc_route_name', 'fiber_no_sn', ...TABLE_COLUMN_KEYS.v_ofc_connections_complete]);

  const headerActions = useStandardHeaderActions({
    data: fibers,
    onRefresh: async () => { await refetch(); toast.success('Refreshed!'); },
    isLoading,
    exportConfig: canEdit ? { 
        tableName: 'v_ofc_connections_complete', 
        fileName: 'All_Physical_Fibers',
        useRpc: true,
        orderBy: [{ column: 'ofc_route_name', ascending: true }],
        maxRows: 50000 
    } : undefined,
  });

  if (canEdit) {
    headerActions.splice(1, 0, {
      label: isUploading ? 'Uploading...' : 'Upload Data',
      onClick: handleUploadClick,
      variant: 'outline',
      leftIcon: <FiUpload />,
      disabled: isUploading || isLoading,
      hideTextOnMobile: true
    });
  }

  const headerStats = [
    { value: totalCount, label: 'Total Fibers' },
    { value: activeCount, label: 'Active', color: 'success' as const },
    { value: inactiveCount, label: 'Inactive/Faulty', color: 'danger' as const },
  ];

  if (error) return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]} />;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls, .csv" />

      <PageHeader
        title="Physical Fiber Inventory"
        description="Search, export, and manage physical fiber properties across all cables."
        icon={<FiActivity />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isLoading && fibers.length === 0}
        isFetching={isFetching}
      />

      {/* Sticky Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center sticky top-20 z-10 mb-4">
          <div className="w-full lg:w-96">
            <Input 
                placeholder="Search route, system, node..." 
                value={search.searchQuery} 
                onChange={(e) => search.setSearchQuery(e.target.value)}
                leftIcon={<FiSearch className="text-gray-400" />}
                fullWidth
                clearable
            />
          </div>
          
          <div className="flex w-full lg:w-auto gap-3 overflow-x-auto pb-2 lg:pb-0">
             <div className="min-w-[120px]">
                 <SelectFilter
                    label=""
                    filterKey="status"
                    filters={filters}
                    setFilters={setFilters}
                    options={[
                        { value: 'true', label: 'Active' },
                        { value: 'false', label: 'Inactive' }
                    ]}
                    placeholder="All Status"
                 />
             </div>
             <div className="hidden sm:flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 h-10 shrink-0 self-end">
                <button className={`p-2 rounded-md transition-all bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400`} title="Table View">
                    <FiList size={16} />
                </button>
             </div>
          </div>
      </div>

      <DataTable
        autoHideEmptyColumns={true}
        tableName="v_ofc_connections_complete"
        data={fibers}
        columns={orderedColumns}
        loading={isLoading}
        isFetching={isFetching}
        searchable={false}
        pagination={{
            current: pagination.currentPage,
            pageSize: pagination.pageLimit,
            total: totalCount,
            showSizeChanger: true,
            onChange: (p, s) => { pagination.setCurrentPage(p); pagination.setPageLimit(s); },
        }}
        customToolbar={<></>}
      />
    </div>
  );
}