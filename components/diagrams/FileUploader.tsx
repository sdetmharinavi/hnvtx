// components/diagrams/FileUploader.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Toaster } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useThemeStore } from '@/stores/themeStore';

import { FileTable } from './FileTable';
import { useUppyUploader } from './hooks/useUppyUploader';
import { useFolders } from './hooks/useFolders';
import { useFileHandling } from './hooks/useFileHandling';

// Components
import FolderManagement from "./uploader-components/FolderManagement";
import UploadModeToggle from "./uploader-components/UploadModeToggle";
import SimpleUpload from "./uploader-components/SimpleUpload";
import AdvancedUpload from "./uploader-components/AdvancedUpload";
import RecentlyUploaded from "./uploader-components/RecentlyUploaded";
import ErrorDisplay from "./uploader-components/ErrorDisplay";

export default function FileUploader() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(false);
  
  // Default to true so user sees upload controls immediately
  const [showUploadSection, setShowUploadSection] = useState(true);
  const [showDashboard, setShowDashboard] = useState(false);
  
  const { theme } = useThemeStore();

  // Determine the string theme for Uppy (it supports 'light', 'dark', 'auto')
  const uppyTheme = theme === 'system' ? 'auto' : theme;

  const {
    folders,
    folderId,
    newFolderName,
    setFolderId,
    setNewFolderName,
    handleCreateFolder,
    handleDeleteFolder, // Changed: Destructure delete handler
    isDeletingFolder,   // Changed: Destructure delete state
    isLoading: isLoadingFolders,
  } = useFolders({
    onError: (err) => setError(err),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['files'] });
        // We also want to show a success toast specifically for folder actions if handled here
        // But useFolders handles specific success callbacks generally
    },
  });
  
  // Helper to wrap delete with specific success message if needed
  const onDeleteFolderWrapper = (id: string) => {
      handleDeleteFolder(id);
      // The hook handles the toast on success/error, or we can chain here if useMutation promise was returned
  };

  const {
    uppyRef,
    uploadedFiles,
    selectedFiles,
    isUploading,
    handleStartUpload,
    toggleCamera,
    facingMode,
    cameraError,
  } = useUppyUploader({
    folderId: folderId || null,
    setRefresh: setRefresh,
    setError: (err) => setError(err),
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

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['files'] });
  }, [refresh, queryClient]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <Toaster position="top-right" duration={4000} />

      {/* Error Banner */}
      {(error || cameraError) && (
         <ErrorDisplay error={error} cameraError={cameraError} />
      )}

      {/* Visibility Toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowUploadSection(!showUploadSection)}
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
        >
          {showUploadSection ? 'Hide Upload Controls' : 'Show Upload Controls'}
        </button>
      </div>

      {/* Upload Area */}
      {showUploadSection && (
        <div className="space-y-6 p-6 border border-gray-200 rounded-xl bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
             Upload OFC Diagrams
          </h2>

          {/* Folder Management */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100 dark:bg-gray-700/30 dark:border-gray-700">
            <FolderManagement
              newFolderName={newFolderName}
              setNewFolderName={setNewFolderName}
              handleCreateFolder={handleCreateFolder}
              folders={folders}
              folderId={folderId}
              setFolderId={setFolderId}
              onDeleteFolder={onDeleteFolderWrapper} // Passed down
              isDeleting={isDeletingFolder}          // Passed down
            />
          </div>

          {/* Mode Switcher */}
          <UploadModeToggle
            showDashboard={showDashboard}
            setShowDashboard={setShowDashboard}
            folderId={folderId}
          />

          {/* Main Uploader */}
          {folderId ? (
            <div className="mt-4">
              {showDashboard ? (
                <AdvancedUpload
                  uppyRef={uppyRef}
                  facingMode={facingMode}
                  toggleCamera={toggleCamera}
                  theme={uppyTheme}
                />
              ) : (
                <SimpleUpload
                  uppyRef={uppyRef}
                  fileInputRef={fileInputRef}
                  handleFileInputChange={handleFileInputChange}
                  triggerFileInput={triggerFileInput}
                  selectedFiles={selectedFiles}
                  handleRemoveFile={handleRemoveFile}
                  isUploading={isUploading}
                  handleStartUpload={handleStartUpload}
                />
              )}
            </div>
          ) : (
            <div className="py-12 text-center border-2 border-dashed border-gray-300 rounded-xl dark:border-gray-600">
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                Please select or create a folder above to enable uploading.
              </p>
            </div>
          )}

          {/* Recents */}
          {uploadedFiles.length > 0 && (
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
               <RecentlyUploaded uploadedFiles={uploadedFiles} />
            </div>
          )}
        </div>
      )}

      {/* File Browser */}
      <FileTable
        folders={folders}
        onFileDelete={handleFileDeleted}
        folderId={folderId}
        onFolderSelect={setFolderId}
        isLoading={isLoadingFolders}
      />
    </div>
  );
}