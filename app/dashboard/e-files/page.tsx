"use client";

import { useState, useRef } from "react";
import { PageHeader } from "@/components/common/page-header";
import { DataTable } from "@/components/table";
import { useEFiles } from "@/hooks/data/useEFilesData";
import { InitiateFileModal, ForwardFileModal, EditFileModal } from "@/components/efile/ActionModals";
import { useRouter } from "next/navigation";
import { FileText, Eye, Plus, Send, Edit } from "lucide-react";
import { EFileRow } from "@/schemas/efile-schemas";
import { Column } from "@/hooks/database/excel-queries/excel-helpers";
import { formatDate } from "@/utils/formatters";
import TruncateTooltip from "@/components/common/TruncateTooltip";
import { useEFilesExcelUpload } from "@/hooks/database/excel-queries/useEFilesExcelUpload";
import { useRPCExcelDownload } from "@/hooks/database/excel-queries";
import { createClient } from "@/utils/supabase/client";
import { buildColumnConfig } from "@/constants/table-column-keys";
import { V_e_files_extendedRowSchema } from "@/schemas/zod-schemas";
import { FiDownload, FiUpload } from "react-icons/fi";

export default function EFilesPage() {
  const router = useRouter();
  const supabase = createClient();
  
  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [forwardModal, setForwardModal] = useState<{isOpen: boolean, fileId: string | null}>({isOpen: false, fileId: null});
  const [editModal, setEditModal] = useState<{isOpen: boolean, file: V_e_files_extendedRowSchema | null}>({isOpen: false, file: null});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data
  const { data: files = [], isLoading, refetch } = useEFiles({ status: 'active' });
  
  // Upload Hook
  const { mutate: uploadFiles, isPending: isUploading } = useEFilesExcelUpload();

  // THE FIX: Switched to RPC Download to bypass View RLS issues
  const { mutate: exportFiles, isPending: isExporting } = useRPCExcelDownload(supabase);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) uploadFiles({ file });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleExport = () => {
      // Construct filters for the RPC
      // const filters = { status: 'active' };
      
      exportFiles({
          fileName: `${formatDate(new Date(), { format: 'dd-mm-yyyy' })}_e-files_all.xlsx`,
          sheetName: 'E-Files',
          columns: buildColumnConfig("v_e_files_extended"),
          // Using RPC Config instead of direct filters
          rpcConfig: {
              functionName: 'get_paged_data',
              parameters: {
                  p_view_name: 'v_e_files_extended',
                  p_limit: 10000, // Reasonable limit for export
                  p_offset: 0,
                  // p_filters: buildRpcFilters(filters),
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
      {/* Hidden File Input */}
      <input 
         type="file" 
         ref={fileInputRef} 
         onChange={handleFileChange} 
         className="hidden" 
         accept=".xlsx, .xls" 
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
                label: isExporting ? 'Exporting...' : 'Export',
                onClick: handleExport,
                variant: 'outline',
                leftIcon: <FiDownload />,
                disabled: isExporting || isLoading
            },
            {
                label: isUploading ? 'Uploading...' : 'Import',
                onClick: () => fileInputRef.current?.click(),
                variant: 'outline',
                leftIcon: <FiUpload />,
                disabled: isUploading || isLoading
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

    </div>
  );
}