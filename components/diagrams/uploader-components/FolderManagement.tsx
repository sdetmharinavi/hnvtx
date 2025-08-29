// components/diagrams/uploader-components/FolderManagement.tsx
import React from "react";

interface FolderManagementProps {
  newFolderName: string;
  setNewFolderName: (value: string) => void;
  handleCreateFolder: () => void;
  folders: any[];
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
  // Sort folders alphabetically by name
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
          className={`flex-1 rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400`}
          onKeyPress={(e) => e.key === "Enter" && handleCreateFolder()}
        />
        <button
          onClick={handleCreateFolder}
          disabled={!newFolderName.trim()}
          className={`rounded px-4 py-2 font-medium transition-colors dark:bg-green-700 dark:hover:bg-green-600 dark:disabled:bg-gray-600 bg-green-600 hover:bg-green-500 disabled:bg-gray-400 text-white disabled:cursor-not-allowed`}
        >
          Create
        </button>
      </div>

      <div>
        <label
          className={`mb-2 block text-sm font-medium dark:text-gray-200 text-gray-700`}
        >
          Select Destination Folder
        </label>
        <select
          className={`w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
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