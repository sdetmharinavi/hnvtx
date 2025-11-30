// components/diagrams/uploader-components/FolderManagement.tsx
import React, { useRef, useState } from "react";
import { FiTrash2, FiUpload } from "react-icons/fi";
import { ConfirmModal } from "@/components/common/ui";
import { useUser } from "@/providers/UserProvider";
import { useExcelUpload } from "@/hooks/database/excel-queries";
import { createClient } from "@/utils/supabase/client";
import { buildUploadConfig } from "@/constants/table-column-keys";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

interface FolderManagementProps {
  newFolderName: string;
  setNewFolderName: (value: string) => void;
  handleCreateFolder: () => void;
  folders: { id: string; name: string }[];
  folderId: string | null;
  setFolderId: (value: string | null) => void;
  onDeleteFolder: (id: string) => void;
  isDeleting: boolean;
}

const FolderManagement: React.FC<FolderManagementProps> = ({
  newFolderName,
  setNewFolderName,
  handleCreateFolder,
  folders,
  folderId,
  setFolderId,
  onDeleteFolder,
  isDeleting,
}) => {
  const { isSuperAdmin } = useUser();
  const user = useAuthStore(state => state.user);
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const sortedFolders = [...folders].sort((a, b) => 
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );
  
  const selectedFolderName = folders.find(f => f.id === folderId)?.name || "this folder";

  const handleConfirmDelete = () => {
    if (folderId) {
        onDeleteFolder(folderId);
        setIsDeleteModalOpen(false);
    }
  };

  // Setup Folder Excel Upload
  const { mutate: uploadFolders, isPending: isUploadingFolders } = useExcelUpload(
    supabase,
    "folders",
    {
      onSuccess: (result) => {
        if (result.successCount > 0) {
          toast.success(`Imported ${result.successCount} folders.`);
          // Note: Parent component invalidation handles UI refresh via prop-triggered refetch if needed,
          // but query key validation inside hook handles it globally.
        }
      }
    }
  );

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user?.id) {
      const uploadConfig = buildUploadConfig("folders");
      uploadFolders({
        file,
        columns: uploadConfig.columnMapping,
        uploadType: "upsert",
        conflictColumn: "id",
        // Inject current user ID for every folder row
        staticData: { user_id: user.id }
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".xlsx, .xls, .csv"
      />

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="New folder name"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          className="flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
        />
        <button
          onClick={handleCreateFolder}
          disabled={!newFolderName.trim()}
          className="rounded px-4 py-2 text-sm font-medium text-white transition-colors bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed dark:bg-green-700 dark:hover:bg-green-600 dark:disabled:bg-gray-600"
        >
          Create
        </button>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Destination Folder
            </label>
            
            <button
                onClick={handleImportClick}
                disabled={isUploadingFolders}
                className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                title="Import Folders from Excel"
            >
                <FiUpload className={isUploadingFolders ? "animate-spin" : ""} />
                {isUploadingFolders ? "Importing..." : "Import Folders"}
            </button>
        </div>

        <div className="flex gap-2 items-center">
            <div className="relative flex-1">
                <select
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={folderId || ""}
                onChange={(e) => setFolderId(e.target.value || null)}
                >
                <option value="">Select Folder</option>
                {sortedFolders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                    {folder.name}
                    </option>
                ))}
                </select>
            </div>
            
            {/* Delete Button: Only visible if a folder is selected AND user is super_admin */}
            {folderId && isSuperAdmin && (
                <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    disabled={isDeleting}
                    className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded border border-transparent hover:border-red-200 transition-all"
                    title="Delete Folder"
                >
                    <FiTrash2 className="w-5 h-5" />
                </button>
            )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        title="Delete Folder"
        message={
            <div className="space-y-2">
                <p>Are you sure you want to delete <strong>{selectedFolderName}</strong>?</p>
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    ⚠️ Warning: This action may fail if the folder contains files. Please delete all files inside this folder first.
                </p>
            </div>
        }
        confirmText="Delete Folder"
        type="danger"
        loading={isDeleting}
      />
    </>
  );
};

export default FolderManagement;