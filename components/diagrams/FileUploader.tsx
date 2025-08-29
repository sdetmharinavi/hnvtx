// components/FileUploader.tsx
"use client";

import { useState } from "react";
import { FileTable } from "./FileTable";

// Import Uppy styles
// import "@uppy/core/dist/style.min.css";
import "@uppy/core"
import "@uppy/dashboard"
import "@uppy/drag-drop"
import "@uppy/webcam"
// import "@uppy/dashboard/dist/style.min.css";
// import "@uppy/drag-drop/dist/style.min.css";
// import "@uppy/webcam/dist/style.min.css";
import FolderManagement from "./uploader-components/FolderManagement";
import UploadModeToggle from "./uploader-components/UploadModeToggle";
import ErrorDisplay from "./uploader-components/ErrorDisplay";
import RecentlyUploaded from "./uploader-components/RecentlyUploaded";
import SimpleUpload from "./uploader-components/SimpleUpload";
import AdvancedUpload from "./uploader-components/AdvancedUpload";
import { useFileHandling } from "./hooks/useFileHandling";
import { useFolders } from "./hooks/useFolders";
import { useUppyUploader } from "./hooks/useUppyUploader";
import { Toaster } from "sonner";

export default function FileUploader() {
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showUploadSection, setShowUploadSection] = useState(false);

  const {
    folders,
    folderId,
    newFolderName,
    setFolderId,
    setNewFolderName,
    handleCreateFolder,
  } = useFolders({
    refresh,
    setRefresh,
    error,
    setError,
  });

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
    folderId,
    setRefresh,
    setError,
  });

  const {
    fileInputRef,
    handleFileInputChange,
    triggerFileInput,
    handleRemoveFile,
  } = useFileHandling(uppyRef);

  return (
    <div
      className={`mx-auto max-w-4xl space-y-6 rounded-lg border p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white`}
    >
      <Toaster
        position="top-right"
        duration={10000}
      />
      <button
        className={`mb-4 px-4 py-2 rounded-md text-sm font-medium dark:bg-gray-700 dark:text-white hover:bg-gray-600 dark:hover:bg-gray-600 ${
          showUploadSection ? " animate-none" : " animate-pulse hover:animate-none duration-500 ease-linear"
        }`}
        type="button"
        aria-label="Toggle Upload Section"
        title="Toggle Upload Section"
        onClick={() => setShowUploadSection(!showUploadSection)}
      >
        {showUploadSection ? "Hide Upload Section" : "Show Upload Section"}
      </button>
      {showUploadSection && (
        <>
      {/* Create Folder */}
      <FolderManagement
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        handleCreateFolder={handleCreateFolder}
        folderId={folderId}
        setFolderId={setFolderId}
        folders={folders}
      />

      {/* Upload Mode Toggle */}
      <UploadModeToggle
        showDashboard={showDashboard}
        setShowDashboard={setShowDashboard}
        folderId={folderId}
      />

      {/* Error Messages */}
      {error && (
        <ErrorDisplay
          error={error}
          cameraError={cameraError}
        />
      )}

      {/* Uppy Upload Interface */}
      {folderId ? (
        <div className="space-y-4">
          {showDashboard ? (
            // Advanced Dashboard with all features
            <AdvancedUpload
              uppyRef={uppyRef}
              isCameraActive={isCameraActive}
              toggleCameraActive={toggleCameraActive}
              facingMode={facingMode}
              toggleCamera={toggleCamera}
            />
          ) : (
            // Simple drag-drop interface
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
      ) : null}
      {/* No folder selected message */}

      {!folderId && (
        <div
          className={`py-8 text-center dark:text-gray-400 text-gray-500`}
        >
          Please select a folder to start uploading files.
        </div>
      )}

      {/* Recently Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <RecentlyUploaded
          uploadedFiles={uploadedFiles}
        />
      )}
      </>
      )}

      {/* File Table */}
      <FileTable folders={folders} />
    </div>
  );
}
