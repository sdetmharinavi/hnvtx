// components/diagrams/FileUploader.tsx
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useThemeStore } from '@/stores/themeStore';
import { Database, Download, Upload, WifiOff } from 'lucide-react';

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
import { PageHeader } from '@/components/common/page-header';
import { useExportDiagramsBackup, useImportDiagramsBackup } from '@/hooks/database/excel-queries/useDiagramsBackup';
import { useUser } from '@/providers/UserProvider';
import { useOnlineStatus } from '@/hooks/useOnlineStatus'; // ADDED

export default function FileUploader() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(false);
  
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  
  const { theme } = useThemeStore();
  const uppyTheme = theme === 'system' ? 'auto' : theme;

  const { isSuperAdmin, role } = useUser();
  const isOnline = useOnlineStatus(); // ADDED

  const canCreate = !!isSuperAdmin || role === 'admin' || role === 'admin_pro';
  const canDelete = !!isSuperAdmin || role === 'admin_pro';
  
  // Backup refs
  const backupInputRef = useRef<HTMLInputElement>(null);
  const { mutate: exportBackup, isPending: isBackingUp } = useExportDiagramsBackup();
  const { mutate: importBackup, isPending: isRestoring } = useImportDiagramsBackup();

  const handleBackupRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) importBackup(file);
    if (backupInputRef.current) backupInputRef.current.value = "";
  };

  const {
    folders,
    folderId,
    newFolderName,
    setFolderId,
    setNewFolderName,
    handleCreateFolder,
    handleDeleteFolder,
    isDeletingFolder,
    isLoading: isLoadingFolders,
  } = useFolders({
    onError: (err) => setError(err),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
  
  const onDeleteFolderWrapper = (id: string) => {
      handleDeleteFolder(id);
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

  // WRAPPER for Start Upload to check connectivity
  const handleSafeStartUpload = () => {
    if (!isOnline) {
      toast.error("You are offline. Please connect to the internet to upload files.", {
        icon: <WifiOff className="w-4 h-4" />
      });
      return;
    }
    handleStartUpload();
  };

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
      
      {/* Hidden input for backup restore */}
      <input 
         type="file" 
         ref={backupInputRef} 
         onChange={handleBackupRestore} 
         className="hidden" 
         accept=".xlsx" 
      />

      {/* Header with Backup Actions */}
      <PageHeader
        title="Diagrams & Files"
        description="Manage network diagrams, specifications, and other documents."
        icon={<Database className="h-6 w-6" />}
        actions={[
            {
                label: 'Backup / Restore',
                variant: 'outline',
                leftIcon: <Download className="h-4 w-4" />,
                disabled: isBackingUp || isRestoring || isLoadingFolders,
                'data-dropdown': true,
                dropdownoptions: [
                    {
                        label: isBackingUp ? "Exporting..." : "Export Full Backup (Excel)",
                        onClick: () => {
                           if (!isOnline) toast.error("Backup export requires online connection.");
                           else exportBackup();
                        },
                        disabled: isBackingUp
                    },
                    {
                        label: isRestoring ? "Restoring..." : "Restore from Backup",
                        onClick: () => {
                           if (!isOnline) toast.error("Backup restore requires online connection.");
                           else backupInputRef.current?.click();
                        },
                        disabled: isRestoring
                    }
                ]
            },
            {
                label: showUploadSection ? 'Hide Upload' : 'Show Upload',
                onClick: () => setShowUploadSection(!showUploadSection),
                variant: showUploadSection ? 'secondary' : 'primary',
                leftIcon: <Upload className="h-4 w-4" />
            }
        ]}
      />

      {(error || cameraError) && (
         <ErrorDisplay error={error} cameraError={cameraError} />
      )}

      {/* Upload Area */}
      {showUploadSection && (
        <div className="space-y-6 p-6 border border-gray-200 rounded-xl bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
          {/* Folder Management */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100 dark:bg-gray-700/30 dark:border-gray-700">
            <FolderManagement
              newFolderName={newFolderName}
              setNewFolderName={setNewFolderName}
              handleCreateFolder={handleCreateFolder}
              folders={folders}
              folderId={folderId}
              canCreate={canCreate}
              canDelete={canDelete}
              setFolderId={setFolderId}
              onDeleteFolder={onDeleteFolderWrapper}
              isDeleting={isDeletingFolder}
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
                  handleStartUpload={handleSafeStartUpload} // Updated Handler
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
        canDelete={canDelete}
        onFolderSelect={setFolderId}
        isLoading={isLoadingFolders}
      />
    </div>
  );
}