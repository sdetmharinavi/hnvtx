// components/FileUploader.tsx
'use client';

import { useState, useCallback } from 'react';
import { FileTable } from './FileTable';
import { useUppyUploader } from './hooks/useUppyUploader';
import { useFolders } from './hooks/useFolders';
import { useFileHandling } from './hooks/useFileHandling';
import { Toaster } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function FileUploader() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  const {
    folders,
    folderId,
    newFolderName,
    setFolderId,
    setNewFolderName,
    handleCreateFolder,
    isCreatingFolder,
    isLoading: isLoadingFolders,
  } = useFolders({
    onError: setError,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'] }),
  });

  const handleUploadSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['files'] });
  }, [queryClient]);

  const {
    uppyRef,
    uploadedFiles,
    selectedFiles,
    isUploading,
    handleStartUpload,
    toggleCamera,
    toggleCameraActive,
    facingMode,
    isCameraActive,
    cameraError,
  } = useUppyUploader({
    folderId: folderId || null,
    setRefresh: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
    setError: (error) => {
      setError(error);
    },
  });

  const {
    fileInputRef,
    handleFileInputChange,
    triggerFileInput,
    handleRemoveFile,
  } = useFileHandling(uppyRef);

  const handleFileDeleted = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['files'] });
  }, [queryClient]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <Toaster position="top-right" duration={4000} />

      <button
        onClick={() => setShowUploadSection(!showUploadSection)}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        {showUploadSection ? 'Hide Upload Section' : 'Show Upload Section'}
      </button>

      {showUploadSection && (
        <div className="space-y-4 p-4 border rounded-lg bg-white dark:bg-gray-800">
          {/* Folder Management */}
          <div className="space-y-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="New folder name"
              className="w-full p-2 border rounded"
              disabled={isCreatingFolder}
            />
            <button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || isCreatingFolder}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isCreatingFolder ? 'Creating...' : 'Create Folder'}
            </button>
          </div>

          {/* File Upload Area */}
          <div className="mt-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              className="hidden"
              multiple
            />
            <button
              onClick={triggerFileInput}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Select Files'}
            </button>
            <button
              onClick={handleStartUpload}
              disabled={selectedFiles.length === 0 || isUploading}
              className="ml-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {isUploading
                ? 'Uploading...'
                : `Upload ${selectedFiles.length} Files`}
            </button>
          </div>
        </div>
      )}

      {/* File Table */}
      <div className="mt-6">
        <FileTable
          folders={folders}
          onFileDelete={handleFileDeleted}
          folderId={folderId}
          onFolderSelect={setFolderId}
          isLoading={isLoadingFolders}
        />
      </div>
    </div>
  );
}
