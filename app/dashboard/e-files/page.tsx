"use client";

import { useState, useRef } from "react";
import { PageHeader } from "@/components/common/page-header";
import { DataTable } from "@/components/table";
import { useEFiles, useDeleteFile } from "@/hooks/data/useEFilesData"; 
import { InitiateFileModal, ForwardFileModal, EditFileModal } from "@/components/efile/ActionModals";
import { ConfirmModal } from "@/components/common/ui";
import { useRouter } from "next/navigation";
import { FileText, Eye, Plus, Send, Edit, Trash2, Database } from "lucide-react"; 
import { EFileRow } from "@/schemas/efile-schemas";
import { Column } from "@/hooks/database/excel-queries/excel-helpers";
import { formatDate } from "@/utils/formatters";
import TruncateTooltip from "@/components/common/TruncateTooltip";
import { createClient } from "@/utils/supabase/client";
import { buildColumnConfig } from "@/constants/table-column-keys";
import { V_e_files_extendedRowSchema } from "@/schemas/zod-schemas";
import { useUser } from "@/providers/UserProvider";

// Import the new Backup Hooks
import { useExportEFileSystem, useImportEFileSystem } from "@/hooks/database/excel-queries/useEFileSystemBackup";
import { useRPCExcelDownload } from "@/hooks/database/excel-queries";

export default function EFilesPage() {
  const router = useRouter();
  const supabase = createClient();
  const { isSuperAdmin, role } = useUser();
  
  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [forwardModal, setForwardModal] = useState<{isOpen: boolean, fileId: string | null}>({isOpen: false, fileId: null});
  const [editModal, setEditModal] = useState<{isOpen: boolean, file: V_e_files_extendedRowSchema | null}>({isOpen: false, file: null});
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, fileId: string | null}>({isOpen: false, fileId: null});
  
  // Input Refs
  const backupInputRef = useRef<HTMLInputElement>(null);

  // Data & Mutations
  const { data: files = [], isLoading, refetch } = useEFiles({ status: 'active' });
  const { mutate: deleteFile, isPending: isDeleting } = useDeleteFile();
  const { mutate: exportList, isPending: isExportingList } = useRPCExcelDownload(supabase);
  
  // Backup Hooks
  const { mutate: exportBackup, isPending: isBackingUp } = useExportEFileSystem();
  const { mutate: importBackup, isPending: isRestoring } = useImportEFileSystem();

  // Handlers
  const handleBackupRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) importBackup(file);
    if (backupInputRef.current) backupInputRef.current.value = "";
  };

  const handleConfirmDelete = () => {
    if (deleteModal.fileId) {
      deleteFile(deleteModal.fileId, {
        onSuccess: () => setDeleteModal({ isOpen: false, fileId: null })
      });
    }
  };

  const handleExportList = () => {
      exportList({
          fileName: `${formatDate(new Date(), { format: 'dd-mm-yyyy' })}_e-files_list.xlsx`,
          sheetName: 'Active Files',
          columns: buildColumnConfig("v_e_files_extended"),
          rpcConfig: {
              functionName: 'get_paged_data',
              parameters: {
                  p_view_name: 'v_e_files_extended',
                  p_limit: 10000,
                  p_offset: 0,
                  p_order_by: 'updated_at',
                  p_order_dir: 'desc'
              }
          }
      });
  };

  // --- COLUMNS ---
  const columns: Column<EFileRow>[] = [
      { key: 'file_number', title: 'File No.', dataIndex: 'file_number', sortable: true, width: 130,
        render: (val) => <span className="font-mono font-bold text-blue-700 dark:text-blue-300">{val as string}</span>
      },
      { key: 'subject', title: 'Subject / Description', dataIndex: 'subject', sortable: true, width: 220,
        render: (val, rec) => (
          <div className="flex flex-col">
             <TruncateTooltip text={val as string} className="font-medium text-sm" />
             <span className="text-xs text-gray-500 truncate">{rec.description}</span>
          </div>
        )
      },
      { key: 'priority', title: 'Priority', dataIndex: 'priority', width: 100,
        render: (val) => {
            const v = val as string;
            const styles = v === 'immediate' ? 'bg-red-100 text-red-800 border-red-200' : v === 'urgent' ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-blue-50 text-blue-700 border-blue-100';
            return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${styles}`}>{v}</span>
        }
      },
      { key: 'initiator_name', title: 'Started By', dataIndex: 'initiator_name', width: 160,
        render: (val, rec) => (
          <div className="flex flex-col">
             <span className="text-sm text-gray-900 dark:text-gray-100">{val as string}</span>
             <span className="text-[10px] text-gray-500">{rec.initiator_designation}</span>
          </div>
        )
      },
      { key: 'current_holder_name', title: 'Currently With', dataIndex: 'current_holder_name', width: 180,
        render: (val, rec) => (
          <div className="flex flex-col">
             <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="font-semibold text-sm text-gray-900 dark:text-white">{val as string}</span>
             </div>
             <span className="text-xs text-gray-500 pl-3.5">{rec.current_holder_designation}</span>
             {rec.current_holder_area && <span className="text-[10px] text-gray-400 pl-3.5">{rec.current_holder_area}</span>}
          </div>
        )
      },
      { key: 'updated_at', title: 'Last Action', dataIndex: 'updated_at', width: 120,
        render: (val) => (
          <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
            {formatDate(val as string, { format: 'dd-mm-yyyy' })}
          </span>
        )
      }
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <input 
         type="file" 
         ref={backupInputRef} 
         onChange={handleBackupRestore} 
         className="hidden" 
         accept=".xlsx" 
      />

      <PageHeader 
        title="E-File Tracking" 
        description="Track physical files, manage movement, and view history."
        icon={<FileText />}
        actions={[
            { 
                label: 'Refresh', 
                onClick: () => refetch(), 
                variant: 'outline' 
            },
            {
                label: 'System Backup/Restore',
                variant: 'outline',
                leftIcon: <Database className="h-4 w-4" />,
                disabled: isLoading || isRestoring || isBackingUp,
                'data-dropdown': true,
                dropdownoptions: [
                  { 
                    label: isBackingUp ? 'Generating Backup...' : 'Download Full Backup (Files + History)', 
                    onClick: () => exportBackup(),
                    disabled: isBackingUp 
                  },
                  { 
                    label: isRestoring ? 'Restoring...' : 'Restore from Backup', 
                    onClick: () => backupInputRef.current?.click(),
                    disabled: isRestoring 
                  },
                  {
                    label: isExportingList ? 'Exporting List...' : 'Export Current View Only',
                    onClick: handleExportList,
                    disabled: isExportingList
                  }
                ]
            },
            { 
                label: 'Initiate File', 
                onClick: () => setIsCreateModalOpen(true), 
                variant: 'primary',
                leftIcon: <Plus />
            }
        ]}
      />

      <DataTable 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tableName="e_files" data={files as any} columns={columns as any}
        loading={isLoading}
        searchable={true}
        actions={[
            {
                key: 'view',
                label: 'Details',
                icon: <Eye className="w-4 h-4" />,
                onClick: (rec) => router.push(`/dashboard/e-files/${rec.id}`),
                variant: 'secondary'
            },
            {
                key: 'forward',
                label: 'Forward',
                icon: <Send className="w-4 h-4" />,
                onClick: (rec) => setForwardModal({ isOpen: true, fileId: rec.id }),
                variant: 'primary',
                hidden: (rec) => rec.status !== 'active'
            },
            {
                key: 'edit',
                label: 'Edit Info',
                icon: <Edit className="w-4 h-4" />,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick: (rec) => setEditModal({ isOpen: true, file: rec as any }),
                variant: 'secondary',
                hidden: (rec) => rec.status !== 'active'
            },
            {
                key: 'delete',
                label: 'Delete',
                icon: <Trash2 className="w-4 h-4" />,
                onClick: (rec) => setDeleteModal({ isOpen: true, fileId: rec.id }),
                variant: 'danger',
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                disabled: (rec) => !isSuperAdmin && role !== 'admin'
            }
        ]}
      />

      {/* MODALS */}
      <InitiateFileModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      
      {forwardModal.isOpen && forwardModal.fileId && (
         <ForwardFileModal 
            isOpen={forwardModal.isOpen} 
            onClose={() => setForwardModal({isOpen: false, fileId: null})} 
            fileId={forwardModal.fileId} 
         />
      )}

      {editModal.isOpen && editModal.file && (
         <EditFileModal 
            isOpen={editModal.isOpen} 
            onClose={() => setEditModal({isOpen: false, file: null})} 
            file={editModal.file} 
         />
      )}

      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        onCancel={() => setDeleteModal({isOpen: false, fileId: null})}
        onConfirm={handleConfirmDelete}
        title="Delete File Record"
        message="Are you sure you want to delete this file record? This will also remove its entire movement history. This action cannot be undone."
        type="danger"
        confirmText="Delete Permanently"
        loading={isDeleting}
      />

    </div>
  );
}