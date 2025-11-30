// components/diagrams/uploader-components/FolderManagement.tsx
import React from "react";

interface FolderManagementProps {
  newFolderName: string;
  setNewFolderName: (value: string) => void;
  handleCreateFolder: () => void;
  folders: { id: string; name: string }[];
  folderId: string | null;
  setFolderId: (value: string | null) => void;
}

const FolderManagement: React.FC<FolderManagementProps> = ({
  newFolderName,
  setNewFolderName,
  handleCreateFolder,
  folders,
  folderId,
  setFolderId,
}) => {
  const sortedFolders = [...folders].sort((a, b) => 
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );

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
    </>
  );
};

export default FolderManagement;