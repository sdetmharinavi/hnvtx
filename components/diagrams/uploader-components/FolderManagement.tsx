// components/diagrams/uploader-components/FolderManagement.tsx
import { ConfirmModal } from "@/components/common/ui";
import { useUser } from "@/providers/UserProvider";
import React, { useState } from "react";
import { FiTrash2 } from "react-icons/fi";

interface FolderManagementProps {
  newFolderName: string;
  setNewFolderName: (value: string) => void;
  handleCreateFolder: () => void;
  folders: { id: string; name: string }[];
  folderId: string | null;
  setFolderId: (value: string | null) => void;
  // New Props for deletion
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

  return (
    <>
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
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Select Destination Folder
        </label>
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