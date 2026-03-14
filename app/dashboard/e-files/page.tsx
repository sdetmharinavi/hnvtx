// app/dashboard/e-files/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { useEFiles } from '@/hooks/data/useEFilesData';
import { ErrorDisplay } from '@/components/common/ui';
import { useRouter } from 'next/navigation';
import { FileText, Database, User, Folder } from 'lucide-react';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { formatDate } from '@/utils/formatters';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { createClient } from '@/utils/supabase/client';
import { buildColumnConfig } from '@/constants/table-column-keys';
import { useRPCExcelDownload } from '@/hooks/database/excel-queries';
import { useDataSync } from '@/hooks/data/useDataSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { GenericEntityCard } from '@/components/common/ui/GenericEntityCard';
import { createStandardActions } from '@/components/table/action-helpers';
import { toast } from 'sonner';
import { Row } from '@/hooks/database';
import { DataGrid } from '@/components/common/DataGrid';
import { V_e_files_extendedRowSchema } from '@/schemas/zod-schemas';

export default function EFilesPage() {
  const router = useRouter();
  const supabase = createClient();
  const { sync: syncData, isSyncing: isSyncingData } = useDataSync();
  const isOnline = useOnlineStatus();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  // MODIFIED: Changed the initial state from { status: 'active' } to an empty object.
  // This removes the default filter, causing the page to load all files (active and closed) initially.
  const [filters, setFilters] = useState<Record<string, string | null>>({});

  const {
    data: files = [] as V_e_files_extendedRowSchema[],
    isLoading,
    refetch,
    error,
    isFetching,
  } = useEFiles({ status: filters.status || undefined });

  const { mutate: exportList, isPending: isExportingList } = useRPCExcelDownload(supabase);

  // FIX: Safely handle null properties during string filtering
  const filteredFiles = useMemo((): V_e_files_extendedRowSchema[] => {
    let result = files as V_e_files_extendedRowSchema[];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          (f.subject?.toLowerCase() || '').includes(q) ||
          (f.file_number?.toLowerCase() || '').includes(q) ||
          (f.description?.toLowerCase() || '').includes(q) ||
          (f.current_holder_name?.toLowerCase() || '').includes(q),
      );
    }
    if (filters.priority) result = result.filter((f) => f.priority === filters.priority);
    if (filters.category) result = result.filter((f) => f.category === filters.category);
    // MODIFIED: Added a filter for status to align with the new UI state.
    if (filters.status) result = result.filter((f) => f.status === filters.status);
    return result;
  }, [files, searchQuery, filters]);

  const headerActions = useMemo(
    () => [
      {
        label: 'Refresh',
        onClick: async () => {
          if (isOnline) {
            await syncData(['e_files', 'v_e_files_extended', 'file_movements']);
          } else {
            refetch();
          }
          toast.success('Files refreshed.');
        },
        variant: 'outline' as const,
        disabled: isFetching || isSyncingData,
      },
      {
        label: 'Export',
        variant: 'outline' as const,
        leftIcon: <Database className='h-4 w-4' />,
        disabled: isLoading || isExportingList,
        onClick: () =>
          exportList({
            fileName: `e-files-export.xlsx`,
            columns: buildColumnConfig('v_e_files_extended'),
            rpcConfig: {
              functionName: 'get_paged_data',
              parameters: {
                p_view_name: 'v_e_files_extended',
                p_limit: 5000,
                p_offset: 0,
                p_filters: { status: filters.status },
              },
            },
          }),
      },
    ],
    [
      isOnline,
      isFetching,
      isSyncingData,
      refetch,
      syncData,
      isLoading,
      isExportingList,
      exportList,
      filters.status,
    ],
  );

  const columns: Column<Row<'v_e_files_extended'>>[] = [
    {
      key: 'file_number',
      title: 'File No.',
      dataIndex: 'file_number',
      width: 130,
      render: (val) => (
        <span className='font-mono font-bold text-blue-700 dark:text-blue-300'>
          {val as string}
        </span>
      ),
    },
    {
      key: 'subject',
      title: 'Subject',
      dataIndex: 'subject',
      width: 220,
      render: (val, rec) => (
        <div className='flex flex-col'>
          <TruncateTooltip text={val as string} className='font-medium text-sm' />
          <span className='text-xs text-gray-500 truncate'>{rec.description}</span>
        </div>
      ),
    },
    {
      key: 'current_holder_name',
      title: 'Currently With',
      dataIndex: 'current_holder_name',
      width: 180,
    },
    {
      key: 'updated_at',
      title: 'Updated',
      dataIndex: 'updated_at',
      width: 120,
      render: (val) => <span className='text-xs text-gray-600'>{formatDate(val as string)}</span>,
    },
  ];

  if (error) return <ErrorDisplay error={error.message} />;

  return (
    <DashboardPageLayout<'v_e_files_extended'>
      header={{
        title: 'E-File Tracking Viewer',
        description: 'Read-only view of file movements.',
        icon: <FileText />,
        stats: [{ value: filteredFiles.length, label: 'Files Count' }],
        actions: headerActions,
        isLoading: isLoading,
      }}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      filters={filters}
      onFilterChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      renderGrid={() => (
        <DataGrid
          data={filteredFiles}
          renderItem={(f: V_e_files_extendedRowSchema) => (
            <GenericEntityCard
              entity={f}
              title={f.subject || 'No Subject'}
              subtitle={f.file_number || ''}
              dataItems={[
                { icon: User, label: 'Initiator', value: f.initiator_name },
                { icon: Folder, label: 'Holder', value: f.current_holder_name },
              ]}
              onView={() => router.push(`/dashboard/e-files/${f.id}`)}
            />
          )}
        />
      )}
      tableProps={{
        tableName: 'v_e_files_extended',
        data: filteredFiles as unknown as Row<'v_e_files_extended'>[],
        columns,
        loading: isLoading,
        // MODIFIED: Removed all modification actions (edit, delete) to make it read-only.
        actions: createStandardActions({
          onView: (rec) => router.push(`/dashboard/e-files/${rec.id}`),
        }),
        selectable: false,
      }}
    />
  );
}
