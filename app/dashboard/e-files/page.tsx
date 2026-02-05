// app/dashboard/e-files/page.tsx
'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useEFiles, useDeleteFile } from '@/hooks/data/useEFilesData';
import { ConfirmModal, ErrorDisplay, PageSpinner } from '@/components/common/ui';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Send, Database, User, Folder, Clock } from 'lucide-react';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { formatDate } from '@/utils/formatters';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { createClient } from '@/utils/supabase/client';
import { buildColumnConfig } from '@/constants/table-column-keys';
import { useUser } from '@/providers/UserProvider';
import {
  useExportEFileSystem,
  useImportEFileSystem,
} from '@/hooks/database/excel-queries/useEFileSystemBackup';
import { useRPCExcelDownload } from '@/hooks/database/excel-queries';
import { ActionButton } from '@/components/common/page-header';
import { FilterConfig } from '@/components/common/filters/GenericFilterBar';
import { useDataSync } from '@/hooks/data/useDataSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { GenericEntityCard } from '@/components/common/ui/GenericEntityCard';
import { Button } from '@/components/common/ui';
import { createStandardActions } from '@/components/table/action-helpers';
import GenericRemarks from '@/components/common/GenericRemarks';
import { toast } from 'sonner';
import { Row } from '@/hooks/database';
import { DataGrid } from '@/components/common/DataGrid'; // NEW IMPORT
import { EFileRow } from '@/schemas/efile-schemas';
import { PERMISSIONS } from '@/config/permissions';

const InitiateFileModal = dynamic(
  () => import('@/components/efile/ActionModals').then((mod) => mod.InitiateFileModal),
  { loading: () => <PageSpinner text='Loading File Form...' /> },
);

const ForwardFileModal = dynamic(
  () => import('@/components/efile/ActionModals').then((mod) => mod.ForwardFileModal),
  { loading: () => <PageSpinner text='Loading Forward Form...' /> },
);

const EditFileModal = dynamic(
  () => import('@/components/efile/ActionModals').then((mod) => mod.EditFileModal),
  { loading: () => <PageSpinner text='Loading Edit Form...' /> },
);

const CATEGORY_OPTIONS = [
  { value: 'administrative', label: 'Administrative' },
  { value: 'technical', label: 'Technical' },
  { value: 'other', label: 'Other' },
];

export default function EFilesPage() {
  const router = useRouter();
  const supabase = createClient();

  const { sync: syncData, isSyncing: isSyncingData } = useDataSync();
  const isOnline = useOnlineStatus();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [filters, setFilters] = useState<Record<string, any>>({ status: 'active' });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [forwardModal, setForwardModal] = useState<{ isOpen: boolean; fileId: string | null }>({
    isOpen: false,
    fileId: null,
  });
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    file: Row<'v_e_files_extended'> | null;
  }>({ isOpen: false, file: null });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; fileId: string | null }>({
    isOpen: false,
    fileId: null,
  });

  const backupInputRef = useRef<HTMLInputElement>(null);

  const {
    data: files = [],
    isLoading,
    refetch,
    error,
    isFetching,
  } = useEFiles({ status: filters.status });

  const { mutate: deleteFile, isPending: isDeleting } = useDeleteFile();
  const { mutate: exportList, isPending: isExportingList } = useRPCExcelDownload(supabase);

  const { mutate: exportBackup, isPending: isBackingUp } = useExportEFileSystem();
  const { mutate: importBackup, isPending: isRestoring } = useImportEFileSystem();

  const { canAccess } = useUser();
  const canEdit = canAccess(PERMISSIONS.canManage);
  const canDelete = canAccess(PERMISSIONS.canDeleteCritical);

  const filterConfigs = useMemo<FilterConfig[]>(
    () => [
      {
        key: 'status',
        label: 'Status',
        type: 'native-select',
        options: [
          { value: 'active', label: 'Active Files' },
          { value: 'closed', label: 'Closed / Archived' },
          { value: '', label: 'All Files' },
        ],
      },
      {
        key: 'category',
        label: 'Category',
        type: 'native-select',
        options: CATEGORY_OPTIONS,
      },
      {
        key: 'priority',
        label: 'Priority',
        type: 'native-select',
        options: [
          { value: 'immediate', label: 'Immediate' },
          { value: 'urgent', label: 'Urgent' },
          { value: 'normal', label: 'Normal' },
        ],
      },
    ],
    [],
  );

  const handleFilterChange = useCallback((key: string, value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const handleBackupRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) importBackup(file);
    if (backupInputRef.current) backupInputRef.current.value = '';
  };

  const handleConfirmDelete = () => {
    if (deleteModal.fileId) {
      deleteFile(deleteModal.fileId, {
        onSuccess: () => {
          setDeleteModal({ isOpen: false, fileId: null });
          refetch();
        },
      });
    }
  };

  const handleExportList = () => {
    exportList({
      fileName: `${formatDate(new Date(), { format: 'dd-mm-yyyy' })}_e-files_list.xlsx`,
      sheetName: 'Active Files',
      columns: buildColumnConfig('v_e_files_extended'),
      rpcConfig: {
        functionName: 'get_paged_data',
        parameters: {
          p_view_name: 'v_e_files_extended',
          p_limit: 10000,
          p_offset: 0,
          p_order_by: 'updated_at',
          p_order_dir: 'desc',
          p_filters: { status: filters.status },
        },
      },
    });
  };

  const filteredFiles = useMemo(() => {
    let result = files;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.subject?.toLowerCase().includes(q) ||
          f.file_number?.toLowerCase().includes(q) ||
          f.description?.toLowerCase().includes(q) ||
          f.current_holder_name?.toLowerCase().includes(q),
      );
    }
    if (filters.priority) {
      result = result.filter((f) => f.priority === filters.priority);
    }
    if (filters.category) {
      result = result.filter((f) => f.category === filters.category);
    }
    return result;
  }, [files, searchQuery, filters]);

  const isBusy = isFetching || isSyncingData;

  const headerActions = useMemo((): ActionButton[] => {
    const actions: ActionButton[] = [
      {
        label: 'Refresh',
        onClick: async () => {
          if (isOnline) {
            await syncData([
              'e_files',
              'v_e_files_extended',
              'file_movements',
              'v_file_movements_extended',
            ]);
          } else {
            refetch();
          }
          toast.success('Files refreshed.');
        },
        variant: 'outline',
        leftIcon: isBusy ? (
          <div className='animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full' />
        ) : undefined,
        disabled: isBusy,
      },
    ];

    if (canEdit) {
      actions.push({
        label: 'Backup / Restore',
        variant: 'outline',
        leftIcon: <Database className='h-4 w-4' />,
        disabled: isLoading || isRestoring || isBackingUp,
        'data-dropdown': true,
        hideTextOnMobile: true,
        dropdownoptions: [
          {
            label: isBackingUp ? 'Generating Backup...' : 'Download Full Backup',
            onClick: () => exportBackup(),
            disabled: isBackingUp,
          },
          {
            label: isRestoring ? 'Restoring...' : 'Restore from Backup',
            onClick: () => backupInputRef.current?.click(),
            disabled: isRestoring,
          },
          {
            label: isExportingList ? 'Exporting List...' : 'Export Current View Only',
            onClick: handleExportList,
            disabled: isExportingList,
          },
        ],
      });
      actions.push({
        label: 'Initiate File',
        onClick: () => setIsCreateModalOpen(true),
        variant: 'primary',
        leftIcon: <Plus />,
      });
    }

    return actions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    refetch,
    canEdit,
    isLoading,
    isRestoring,
    isBackingUp,
    isExportingList,
    exportBackup,
    importBackup,
    handleExportList,
    isBusy,
  ]);

  const columns: Column<Row<'v_e_files_extended'>>[] = [
    {
      key: 'file_number',
      title: 'File No.',
      dataIndex: 'file_number',
      sortable: true,
      width: 130,
      render: (val) => (
        <span className='font-mono font-bold text-blue-700 dark:text-blue-300'>
          {val as string}
        </span>
      ),
    },
    {
      key: 'subject',
      title: 'Subject / Description',
      dataIndex: 'subject',
      sortable: true,
      width: 220,
      render: (val, rec) => (
        <div className='flex flex-col'>
          <TruncateTooltip text={val as string} className='font-medium text-sm' />
          <span className='text-xs text-gray-500 truncate'>{rec.description}</span>
        </div>
      ),
    },
    {
      key: 'category',
      title: 'Category',
      dataIndex: 'category',
      width: 100,
      render: (val) => (
        <span className='text-xs text-gray-600 dark:text-gray-400 capitalize'>{val as string}</span>
      ),
    },
    {
      key: 'priority',
      title: 'Priority',
      dataIndex: 'priority',
      width: 100,
      render: (val) => {
        const v = val as string;
        const styles =
          v === 'immediate'
            ? 'bg-red-100 text-red-800 border-red-200'
            : v === 'urgent'
              ? 'bg-orange-100 text-orange-800 border-orange-200'
              : 'bg-blue-50 text-blue-700 border-blue-100';
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${styles}`}>
            {v}
          </span>
        );
      },
    },
    {
      key: 'initiator_name',
      title: 'Started By',
      dataIndex: 'initiator_name',
      width: 160,
      render: (val, rec) => (
        <div className='flex flex-col'>
          <span className='text-sm text-gray-900 dark:text-gray-100'>{val as string}</span>
          <span className='text-[10px] text-gray-500'>{rec.initiator_designation}</span>
        </div>
      ),
    },
    {
      key: 'current_holder_name',
      title: 'Currently With',
      dataIndex: 'current_holder_name',
      width: 180,
      render: (val, rec) => (
        <div className='flex flex-col'>
          <div className='flex items-center gap-1.5'>
            <div className='w-2 h-2 rounded-full bg-green-500'></div>
            <span className='font-semibold text-sm text-gray-900 dark:text-white'>
              {val as string}
            </span>
          </div>
          <span className='text-xs text-gray-500 pl-3.5'>{rec.current_holder_designation}</span>
          {rec.current_holder_area && (
            <span className='text-[10px] text-gray-400 pl-3.5'>{rec.current_holder_area}</span>
          )}
        </div>
      ),
    },
    {
      key: 'updated_at',
      title: 'Last Action',
      dataIndex: 'updated_at',
      width: 120,
      render: (val, rec) => {
        // Use last_action_date if available (from view update), otherwise fallback to updated_at
        const dateToUse = (rec as EFileRow).last_action_date || val;
        const canFormat =
          typeof dateToUse === 'string' ||
          typeof dateToUse === 'number' ||
          dateToUse instanceof Date;
        return (
          <span className='text-xs text-gray-600 dark:text-gray-400 font-mono'>
            {canFormat && dateToUse
              ? formatDate(dateToUse as string | number | Date, {
                  format: 'dd-mm-yyyy',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })
              : 'N/A'}
          </span>
        );
      },
    },
  ];

  // THE FIX: Created memoized renderItem function
  const renderItem = useCallback(
    (file: Row<'v_e_files_extended'>) => {
      const isClosed = file.status === 'closed';
      // Type casting to access new field until codegen runs
      const fullFile = file as EFileRow;
      const lastActionDate = fullFile.last_action_date || fullFile.updated_at;

      return (
        <GenericEntityCard
          key={file.id}
          entity={file}
          title={file.subject || 'Unnamed File'}
          subtitle={file.file_number || ''}
          status={file.status}
          showStatusLabel={false}
          subBadge={
            <div className='flex items-center gap-2 mb-2'>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                  file.priority === 'immediate'
                    ? 'bg-red-100 text-red-800 border-red-200'
                    : file.priority === 'urgent'
                      ? 'bg-orange-100 text-orange-800 border-orange-200'
                      : 'bg-blue-50 text-blue-700 border-blue-100'
                }`}
              >
                {file.priority}
              </span>
              <span className='text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600'>
                {file.category}
              </span>
            </div>
          }
          headerIcon={<FileText className='w-6 h-6 text-blue-500' />}
          dataItems={[
            { icon: User, label: 'Started By', value: file.initiator_name },
            { icon: Folder, label: 'Current Holder', value: file.current_holder_name },
            {
              icon: Clock,
              label: 'Last Action',
              value: formatDate(lastActionDate || '', {
                format: 'dd-mm-yyyy',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              }),
            },
          ]}
          customFooter={
            <div className='w-full'>
              <GenericRemarks remark={file.description || ''} />
            </div>
          }
          extraActions={
            canEdit &&
            !isClosed && (
              <Button
                size='xs'
                variant='primary'
                onClick={() => setForwardModal({ isOpen: true, fileId: file.id! })}
                title='Forward File'
              >
                <Send className='w-3.5 h-3.5' />
              </Button>
            )
          }
          onView={(f) => router.push(`/dashboard/e-files/${f.id}`)}
          onEdit={canEdit && !isClosed ? (f) => setEditModal({ isOpen: true, file: f }) : undefined}
          onDelete={canDelete ? (f) => setDeleteModal({ isOpen: true, fileId: f.id! }) : undefined}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      );
    },
    [canEdit, canDelete, router, setEditModal, setDeleteModal, setForwardModal],
  );

  // THE FIX: Simplified renderGrid to use the new DataGrid component
  const renderGrid = useCallback(
    () => (
      <DataGrid
        data={filteredFiles}
        renderItem={renderItem}
        isLoading={isLoading}
        isEmpty={filteredFiles.length === 0 && !isLoading}
        // Since pagination is not used on this page for grid view, we omit the prop
      />
    ),
    [filteredFiles, renderItem, isLoading],
  );

  if (error)
    return (
      <ErrorDisplay
        error={error.message}
        actions={[{ label: 'Retry', onClick: () => refetch(), variant: 'primary' }]}
      />
    );

  return (
    <DashboardPageLayout
      header={{
        title: 'E-File Tracking',
        description: 'Track physical files, manage movement, and view history.',
        icon: <FileText />,
        stats: [{ value: filteredFiles.length, label: 'Visible Files' }],
        actions: headerActions,
        isLoading: isLoading,
      }}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder='Search subject, number, holder...'
      filters={filters}
      onFilterChange={handleFilterChange}
      filterConfigs={filterConfigs}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      bulkActions={undefined}
      renderGrid={renderGrid}
      tableProps={{
        tableName: 'v_e_files_extended',
        data: filteredFiles,
        columns: columns,
        loading: isLoading,
        isFetching: isFetching,
        searchable: false,
        pagination: { current: 1, pageSize: 20, total: filteredFiles.length, onChange: () => {} },
        customToolbar: <></>,
        actions: createStandardActions({
          onView: (rec) => router.push(`/dashboard/e-files/${rec.id}`),
          onEdit: canEdit
            ? (rec: Row<'v_e_files_extended'>) => setEditModal({ isOpen: true, file: rec })
            : undefined,
          onDelete: canDelete
            ? (rec) =>
                setDeleteModal({
                  isOpen: true,
                  fileId: rec.id != null ? String(rec.id) : null,
                })
            : undefined,
        }),
      }}
      isEmpty={filteredFiles.length === 0 && !isLoading}
      modals={
        <>
          <input
            type='file'
            ref={backupInputRef}
            onChange={handleBackupRestore}
            className='hidden'
            accept='.xlsx'
          />

          <InitiateFileModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
          />
          {forwardModal.isOpen && forwardModal.fileId && (
            <ForwardFileModal
              isOpen={forwardModal.isOpen}
              onClose={() => setForwardModal({ isOpen: false, fileId: null })}
              fileId={forwardModal.fileId}
            />
          )}
          {editModal.isOpen && editModal.file && (
            <EditFileModal
              isOpen={editModal.isOpen}
              onClose={() => setEditModal({ isOpen: false, file: null })}
              file={editModal.file}
            />
          )}
          <ConfirmModal
            isOpen={deleteModal.isOpen}
            onCancel={() => setDeleteModal({ isOpen: false, fileId: null })}
            onConfirm={handleConfirmDelete}
            title='Delete File Record'
            message='Are you sure you want to delete this file? This will remove its history. This action cannot be undone.'
            type='danger'
            confirmText='Delete Permanently'
            loading={isDeleting}
          />
        </>
      }
    />
  );
}
