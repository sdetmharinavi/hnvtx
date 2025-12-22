// app/dashboard/e-files/page.tsx
'use client';

import { useState, useRef, useMemo } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/table';
import { useEFiles, useDeleteFile } from '@/hooks/data/useEFilesData';
import {
  InitiateFileModal,
  ForwardFileModal,
  EditFileModal,
} from '@/components/efile/ActionModals';
import { ConfirmModal, ErrorDisplay } from '@/components/common/ui';
import { useRouter } from 'next/navigation';
import { FileText, Eye, Plus, Send, Edit, Trash2, Database, Grid, List, Search } from 'lucide-react';
import { EFileRow } from '@/schemas/efile-schemas';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { formatDate } from '@/utils/formatters';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { createClient } from '@/utils/supabase/client';
import { buildColumnConfig } from '@/constants/table-column-keys';
import { V_e_files_extendedRowSchema } from '@/schemas/zod-schemas';
import { useUser } from '@/providers/UserProvider';
import {
  useExportEFileSystem,
  useImportEFileSystem,
} from '@/hooks/database/excel-queries/useEFileSystemBackup';
import { useRPCExcelDownload } from '@/hooks/database/excel-queries';
import { Input } from '@/components/common/ui/Input';
import { EFileCard } from '@/components/efile/EFileCard';
import { UserRole } from '@/types/user-roles';
import { FancyEmptyState } from '@/components/common/ui/FancyEmptyState';

// Hardcoded categories to match the form options
const CATEGORY_OPTIONS = [
    { value: 'administrative', label: 'Administrative' },
    { value: 'technical', label: 'Technical' },
    { value: 'other', label: 'Other' }
];

export default function EFilesPage() {
  const router = useRouter();
  const supabase = createClient();
  const { isSuperAdmin, role } = useUser();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Local state for filters/search
  const [searchQuery, setSearchQuery] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [filters, setFilters] = useState<Record<string, any>>({ status: 'active' });

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [forwardModal, setForwardModal] = useState<{ isOpen: boolean; fileId: string | null }>({
    isOpen: false,
    fileId: null,
  });
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    file: V_e_files_extendedRowSchema | null;
  }>({ isOpen: false, file: null });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; fileId: string | null }>({
    isOpen: false,
    fileId: null,
  });

  const backupInputRef = useRef<HTMLInputElement>(null);

  const { data: files = [], isLoading, refetch, error } = useEFiles({ status: filters.status });
  const { mutate: deleteFile, isPending: isDeleting } = useDeleteFile();
  const { mutate: exportList, isPending: isExportingList } = useRPCExcelDownload(supabase);

  const { mutate: exportBackup, isPending: isBackingUp } = useExportEFileSystem();
  const { mutate: importBackup, isPending: isRestoring } = useImportEFileSystem();

  // --- PERMISSION LOGIC ---
  const canEdit = !!isSuperAdmin || role === UserRole.ADMIN || role === UserRole.ADMINPRO;
  // Strict check: Only true if isSuperAdmin is true.
  const canDelete = isSuperAdmin === true || role === UserRole.ADMINPRO;

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
        }
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
          p_filters: { status: filters.status }
        },
      },
    });
  };

  const filteredFiles = useMemo(() => {
     let result = files;

     if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        result = result.filter(f => 
            f.subject?.toLowerCase().includes(q) || 
            f.file_number?.toLowerCase().includes(q) ||
            f.description?.toLowerCase().includes(q) ||
            f.current_holder_name?.toLowerCase().includes(q)
        );
     }
     if (filters.priority) {
        result = result.filter(f => f.priority === filters.priority);
     }
     if (filters.category) {
        result = result.filter(f => f.category === filters.category);
     }

     return result;
  }, [files, searchQuery, filters]);

  const columns: Column<EFileRow>[] = [
    {
      key: 'file_number',
      title: 'File No.',
      dataIndex: 'file_number',
      sortable: true,
      width: 130,
      render: (val) => (
        <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
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
        <div className="flex flex-col">
          <TruncateTooltip text={val as string} className="font-medium text-sm" />
          <span className="text-xs text-gray-500 truncate">{rec.description}</span>
        </div>
      ),
    },
    {
      key: 'category',
      title: 'Category',
      dataIndex: 'category',
      width: 100,
      render: (val) => <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">{val as string}</span>
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
        <div className="flex flex-col">
          <span className="text-sm text-gray-900 dark:text-gray-100">{val as string}</span>
          <span className="text-[10px] text-gray-500">{rec.initiator_designation}</span>
        </div>
      ),
    },
    {
      key: 'current_holder_name',
      title: 'Currently With',
      dataIndex: 'current_holder_name',
      width: 180,
      render: (val, rec) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="font-semibold text-sm text-gray-900 dark:text-white">
              {val as string}
            </span>
          </div>
          <span className="text-xs text-gray-500 pl-3.5">{rec.current_holder_designation}</span>
          {rec.current_holder_area && (
            <span className="text-[10px] text-gray-400 pl-3.5">{rec.current_holder_area}</span>
          )}
        </div>
      ),
    },
    {
      key: 'updated_at',
      title: 'Last Action',
      dataIndex: 'updated_at',
      width: 120,
      render: (val) => {
        const canFormat = typeof val === 'string' || typeof val === 'number' || val instanceof Date;
        return (
          <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
            {canFormat && val
              ? formatDate(val as string | number | Date, { format: 'dd-mm-yyyy' })
              : 'N/A'}
          </span>
        );
      },
    },
  ];

  if (error) return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: () => refetch(), variant: 'primary' }]} />;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <input type="file" ref={backupInputRef} onChange={handleBackupRestore} className="hidden" accept=".xlsx" />

      <PageHeader
        title="E-File Tracking"
        description="Track physical files, manage movement, and view history."
        icon={<FileText />}
        stats={[{ value: filteredFiles.length, label: 'Visible Files' }]}
        actions={[
          {
            label: 'Refresh',
            onClick: () => refetch(),
            variant: 'outline',
          },
          {
            label: 'Backup / Restore',
            variant: 'outline',
            leftIcon: <Database className="h-4 w-4" />,
            disabled: isLoading || isRestoring || isBackingUp,
            'data-dropdown': true,
            hideTextOnMobile: true,
            dropdownoptions: [
              { label: isBackingUp ? 'Generating Backup...' : 'Download Full Backup', onClick: () => exportBackup(), disabled: isBackingUp },
              { label: isRestoring ? 'Restoring...' : 'Restore from Backup', onClick: () => backupInputRef.current?.click(), disabled: isRestoring },
              { label: isExportingList ? 'Exporting List...' : 'Export Current View Only', onClick: handleExportList, disabled: isExportingList },
            ],
          },
          {
            label: 'Initiate File',
            onClick: () => setIsCreateModalOpen(true),
            variant: 'primary',
            leftIcon: <Plus />,
          },
        ]}
      />

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center sticky top-20 z-10">
          <div className="w-full lg:w-96">
            <Input 
                placeholder="Search subject, number, holder..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="text-gray-400" />}
                fullWidth
            />
          </div>
          
          <div className="flex w-full lg:w-auto gap-3 overflow-x-auto pb-2 lg:pb-0">
             <div className="min-w-[140px]">
                 <select
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({...prev, status: e.target.value}))}
                 >
                    <option value="active">Active Files</option>
                    <option value="closed">Closed / Archived</option>
                    <option value="">All Files</option>
                 </select>
             </div>
             
             {/* Category Filter */}
             <div className="min-w-[140px]">
                 <select
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.category || ''}
                    onChange={(e) => setFilters(prev => ({...prev, category: e.target.value || undefined}))}
                 >
                    <option value="">All Categories</option>
                    {CATEGORY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                 </select>
             </div>

             <div className="min-w-[140px]">
                 <select
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.priority || ''}
                    onChange={(e) => setFilters(prev => ({...prev, priority: e.target.value || undefined}))}
                 >
                    <option value="">All Priorities</option>
                    <option value="immediate">Immediate</option>
                    <option value="urgent">Urgent</option>
                    <option value="normal">Normal</option>
                 </select>
             </div>
             {/* View Toggle */}
             <div className="hidden sm:flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 h-10 shrink-0">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700'}`} title="Grid View"><Grid size={16} /></button>
                <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700'}`} title="Table View"><List size={16} /></button>
             </div>
          </div>
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {filteredFiles.map(file => (
                <EFileCard 
                   key={file.id} 
                   file={file} 
                   onView={(f) => router.push(`/dashboard/e-files/${f.id}`)}
                   onForward={(f) => setForwardModal({ isOpen: true, fileId: f.id! })}
                   onEdit={(f) => setEditModal({ isOpen: true, file: f })}
                   onDelete={(f) => setDeleteModal({ isOpen: true, fileId: f.id! })}
                   canEdit={canEdit}
                   canDelete={canDelete}
                />
             ))}
             {filteredFiles.length === 0 && !isLoading && (
                 <div className="col-span-full">
                    <FancyEmptyState 
                        title="No files found"
                        description="Try adjusting your filters or initiate a new file."
                        icon={FileText}
                    />
                 </div>
             )}
          </div>
      ) : (
           <DataTable
            autoHideEmptyColumns={true}
            tableName="v_e_files_extended"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data={filteredFiles as any}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            columns={columns as any}
            loading={isLoading}
            searchable={false}
            pagination={{ current: 1, pageSize: 20, total: filteredFiles.length, onChange: () => {} }}
            customToolbar={<></>}
            actions={[
              {
                key: 'view', label: 'Details', icon: <Eye className="w-4 h-4" />, onClick: (rec) => router.push(`/dashboard/e-files/${rec.id}`), variant: 'secondary',
              },
              {
                key: 'forward', label: 'Forward', icon: <Send className="w-4 h-4" />, onClick: (rec) => setForwardModal({ isOpen: true, fileId: rec.id }), variant: 'primary', hidden: (rec) => rec.status !== 'active',
              },
              {
                key: 'edit', label: 'Edit Info', icon: <Edit className="w-4 h-4" />,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick: (rec) => setEditModal({ isOpen: true, file: rec as any }),
                variant: 'secondary', hidden: (rec) => rec.status !== 'active' || !canEdit,
              },
              {
                key: 'delete', label: 'Delete', icon: <Trash2 className="w-4 h-4" />, onClick: (rec) => setDeleteModal({ isOpen: true, fileId: rec.id }), variant: 'danger', 
                // Strict hiding based on canDelete boolean
                hidden: !canDelete,
              },
            ]}
          />
      )}

      {/* Modals */}
      <InitiateFileModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      {forwardModal.isOpen && forwardModal.fileId && <ForwardFileModal isOpen={forwardModal.isOpen} onClose={() => setForwardModal({ isOpen: false, fileId: null })} fileId={forwardModal.fileId} />}
      {editModal.isOpen && editModal.file && <EditFileModal isOpen={editModal.isOpen} onClose={() => setEditModal({ isOpen: false, file: null })} file={editModal.file} />}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onCancel={() => setDeleteModal({ isOpen: false, fileId: null })}
        onConfirm={handleConfirmDelete}
        title="Delete File Record"
        message="Are you sure you want to delete this file? This will remove its history. This action cannot be undone."
        type="danger"
        confirmText="Delete Permanently"
        loading={isDeleting}
      />
    </div>
  );
}