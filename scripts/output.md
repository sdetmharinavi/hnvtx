<!-- path:components/diagrams/uploader-components/ErrorDisplay.tsx -->
```typescript
// components/diagrams/uploader-components/ErrorDisplay.tsx
import React, { useEffect } from "react";
import { toast } from "react-toastify";

interface ErrorDisplayProps {
  error: string | null;
  cameraError: string | null;
  isNightMode: boolean; // not used anymore unless you want to style toast themes
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  cameraError,
}) => {
  useEffect(() => {
    if (error) {
      toast.error(error, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        pauseOnHover: true,
        draggable: true,
      });
    }
  }, [error]);

  useEffect(() => {
    if (cameraError) {
      toast.warn(`Camera Error: ${cameraError}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        pauseOnHover: true,
        draggable: true,
      });
    }
  }, [cameraError]);

  return null; // Toasts are handled globally
};

export default ErrorDisplay;

```

<!-- path:components/diagrams/uploader-components/FolderManagement.tsx -->
```typescript
// components/diagrams/uploader-components/FolderManagement.tsx
import React from "react";

interface FolderManagementProps {
  newFolderName: string;
  setNewFolderName: (value: string) => void;
  handleCreateFolder: () => void;
  folders: any[];
  folderId: string | null;
  setFolderId: (value: string | null) => void;
  isNightMode: boolean;
}

const FolderManagement: React.FC<FolderManagementProps> = ({
  newFolderName,
  setNewFolderName,
  handleCreateFolder,
  folders,
  folderId,
  setFolderId,
  isNightMode,
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
          className={`flex-1 rounded border px-3 py-2 ${
            isNightMode
              ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
              : "border-gray-300 bg-white text-black placeholder-gray-500"
          }`}
          onKeyPress={(e) => e.key === "Enter" && handleCreateFolder()}
        />
        <button
          onClick={handleCreateFolder}
          disabled={!newFolderName.trim()}
          className={`rounded px-4 py-2 font-medium transition-colors ${
            isNightMode
              ? "bg-green-700 hover:bg-green-600 disabled:bg-gray-600"
              : "bg-green-600 hover:bg-green-500 disabled:bg-gray-400"
          } text-white disabled:cursor-not-allowed`}
        >
          Create
        </button>
      </div>

      <div>
        <label
          className={`mb-2 block text-sm font-medium ${
            isNightMode ? "text-gray-200" : "text-gray-700"
          }`}
        >
          Select Destination Folder
        </label>
        <select
          className={`w-full rounded border px-3 py-2 ${
            isNightMode
              ? "border-gray-600 bg-gray-700 text-white"
              : "border-gray-300 bg-white text-black"
          }`}
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
```

<!-- path:components/diagrams/uploader-components/RecentlyUploaded.tsx -->
```typescript
// components/diagrams/uploader-components/RecentlyUploaded.tsx
import React from "react";
import Image from "next/image";
import { Eye, Download } from "lucide-react";

interface RecentlyUploadedProps {
  uploadedFiles: any[];
  isNightMode: boolean;
}

const RecentlyUploaded: React.FC<RecentlyUploadedProps> = ({
  uploadedFiles,
  isNightMode,
}) => {
  return (
    <div className="space-y-4">
      <h3
        className={`text-lg font-semibold ${isNightMode ? "text-white" : "text-black"}`}
      >
        Recently Uploaded
      </h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {uploadedFiles.slice(-4).map((file, index) => (
          <div
            key={index}
            className={`group relative overflow-hidden rounded border p-2 ${
              isNightMode
                ? "border-gray-600 bg-gray-700"
                : "border-gray-200 bg-white"
            }`}
          >
            {file.secure_url &&
            file.secure_url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) ? (
              <Image
                src={file.secure_url}
                alt="Uploaded file"
                className="h-24 w-full rounded object-cover"
                width={300}
                height={96}
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div className="flex h-24 w-full items-center justify-center rounded bg-gray-100">
                <div className="text-center">
                  <div className="mb-1 text-xl">📄</div>
                  <p className="text-xs text-gray-600">
                    {file.format?.toUpperCase() || "FILE"}
                  </p>
                </div>
              </div>
            )}

            <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => window.open(file.secure_url, "_blank")}
                title="View"
                className="bg-opacity-60 hover:bg-opacity-80 rounded bg-black p-1 text-white transition-all"
              >
                <Eye className="h-3 w-3" />
              </button>
              <a
                href={file.secure_url}
                download
                title="Download"
                className="bg-opacity-60 hover:bg-opacity-80 rounded bg-black p-1 text-white transition-all"
              >
                <Download className="h-3 w-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentlyUploaded;
```

<!-- path:components/diagrams/uploader-components/UploadModeToggle.tsx -->
```typescript
// components/diagrams/uploader-components/UploadModeToggle.tsx
import React from "react";

interface UploadModeToggleProps {
  showDashboard: boolean;
  setShowDashboard: (value: boolean) => void;
  folderId: string | null;
  isNightMode: boolean;
}

const UploadModeToggle: React.FC<UploadModeToggleProps> = ({
  showDashboard,
  setShowDashboard,
  folderId,
  isNightMode,
}) => {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => setShowDashboard(true)}
        disabled={!folderId}
        className={`flex-1 rounded px-4 py-2 font-medium transition-colors ${
          showDashboard
            ? isNightMode
              ? "bg-blue-700"
              : "bg-blue-600"
            : isNightMode
              ? "bg-gray-600 hover:bg-gray-500"
              : "bg-gray-400 hover:bg-gray-500"
        } text-white disabled:cursor-not-allowed disabled:opacity-50`}
      >
        Advanced Upload
      </button>
      <button
        onClick={() => setShowDashboard(false)}
        className={`flex-1 rounded px-4 py-2 font-medium transition-colors ${
          !showDashboard
            ? isNightMode
              ? "bg-blue-700"
              : "bg-blue-600"
            : isNightMode
              ? "bg-gray-600 hover:bg-gray-500"
              : "bg-gray-400 hover:bg-gray-500"
        } text-white`}
      >
        Simple Upload
      </button>
    </div>
  );
};

export default UploadModeToggle;
```

<!-- path:components/diagrams/uploader-components/AdvancedUpload.tsx -->
```typescript
// // components/diagrams/uploader-components/AdvancedUpload.tsx
// import React from "react";
// import { Dashboard } from "@uppy/react";
// import { Camera, CameraOff } from "lucide-react";

// interface AdvancedUploadProps {
//   uppyRef: React.MutableRefObject<any>;
//   isNightMode: boolean;
//   isCameraActive: boolean;
//   toggleCameraActive: () => void;
//   facingMode: "user" | "environment";
//   toggleCamera: () => void;
// }

// const AdvancedUpload: React.FC<AdvancedUploadProps> = ({
//   uppyRef,
//   isNightMode,
//   isCameraActive,
//   toggleCameraActive,
//   facingMode,
//   toggleCamera,
// }) => {
//   return (
//     <div className={`uppy-dashboard-container rounded-lg ${isNightMode ? "uppy-dark" : ""}`}>
//       <div className="mb-2 flex justify-between">
//         <button
//           onClick={toggleCameraActive}
//           className={`flex items-center gap-2 rounded px-3 py-1 text-sm ${
//             isNightMode
//               ? "bg-gray-600 text-white hover:bg-gray-500"
//               : "bg-gray-200 text-black hover:bg-gray-300"
//           }`}
//         >
//           {isCameraActive ? (
//             <>
//               <CameraOff size={16} /> Stop Camera
//             </>
//           ) : (
//             <>
//               <Camera size={16} /> Start Camera
//             </>
//           )}
//         </button>
//         <button
//           onClick={toggleCamera}
//           className={`rounded px-3 py-1 text-sm ${
//             isNightMode
//               ? "bg-gray-600 text-white hover:bg-gray-500"
//               : "bg-gray-200 text-black hover:bg-gray-300"
//           }`}
//         >
//           Switch Camera ({facingMode === "user" ? "Front" : "Back"})
//         </button>
//       </div>
//       {uppyRef.current && (
//         <div className="relative overflow-hidden rounded-lg">
//           <Dashboard
//             uppy={uppyRef.current}
//             plugins={isCameraActive ? ["Webcam"] : []}
//             theme={isNightMode ? "dark" : "light"}
//             height={640}
//             width="100%"
//             showProgressDetails={true}
//             showSelectedFiles={true}
//             showRemoveButtonAfterComplete={true}
//             disableStatusBar={false}
//             disableInformer={false}
//             disableThumbnailGenerator={false}
//             proudlyDisplayPoweredByUppy={false}
//             note="Select files to upload or drag and drop them here"
//             locale={{
//               strings: {
//                 uploading: "Uploading...",
//                 complete: "Complete",
//                 uploadFailed: "Upload failed",
//                 paused: "Paused",
//                 retry: "Retry",
//                 cancel: "Cancel",
//                 pause: "Pause",
//                 resume: "Resume",
//                 done: "Done",
//                 filesUploadedOfTotal: {
//                   0: "%{complete} of %{smart_count} file uploaded",
//                   1: "%{complete} of %{smart_count} files uploaded",
//                 },
//                 dataUploadedOfTotal: "%{complete} of %{total}",
//                 dataUploadedOfUnknown: "%{complete} uploaded",
//                 xTimeLeft: "%{time} left",
//                 uploadXFiles: {
//                   0: "Upload %{smart_count} file",
//                   1: "Upload %{smart_count} files",
//                 },
//                 uploadXNewFiles: {
//                   0: "Upload %{smart_count} new file",
//                   1: "Upload %{smart_count} new files",
//                 },
//                 upload: "Upload",
//                 retryUpload: "Retry upload",
//                 xMoreFilesAdded: {
//                   0: "%{numFiles} more file added",
//                   1: "%{numFiles} more files added",
//                 },
//                 showErrorDetails: "Show error details",
//               },
//             }}
//           />
//         </div>
//       )}
//     </div>
//   );
// };

// export default AdvancedUpload;

"use client";

import React, { useRef } from "react";
import { Dashboard } from "@uppy/react";
import { Camera, CameraOff, Camera as CameraIcon, SwitchCamera } from "lucide-react";

interface AdvancedUploadProps {
  uppyRef: React.MutableRefObject<any>;
  isNightMode: boolean;
  isCameraActive: boolean;
  toggleCameraActive: () => void;
  facingMode: "user" | "environment";
  toggleCamera: () => void;
}

const AdvancedUpload: React.FC<AdvancedUploadProps> = ({
  uppyRef,
  isNightMode,
  isCameraActive,
  toggleCameraActive,
  facingMode,
  toggleCamera,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && uppyRef.current) {
      const file = e.target.files[0];
      uppyRef.current.addFile({
        name: file.name,
        type: file.type,
        data: file,
        source: "Camera",
      });
    }
  };

  const openNativeCamera = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`uppy-dashboard-container rounded-lg ${isNightMode ? "uppy-dark" : ""}`}>
      {/* Native camera file input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture={facingMode}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Action Buttons */}
      <div className="mb-2 flex flex-wrap gap-2 justify-between items-center">
        <div className="flex gap-2">
          {/* <button
            onClick={toggleCameraActive}
            className={`flex items-center gap-2 rounded px-3 py-1 text-sm ${
              isNightMode
                ? "bg-gray-600 text-white hover:bg-gray-500"
                : "bg-gray-200 text-black hover:bg-gray-300"
            }`}
          >
            {isCameraActive ? (
              <>
                <CameraOff size={16} /> Stop Camera
              </>
            ) : (
              <>
                <Camera size={16} /> Start Camera
              </>
            )}
          </button> */}

          <button
            onClick={toggleCamera}
            className={`flex items-center gap-2 rounded px-3 py-1 text-sm ${
              isNightMode
                ? "bg-gray-600 text-white hover:bg-gray-500"
                : "bg-gray-200 text-black hover:bg-gray-300"
            }`}
          >
            <SwitchCamera size={16} />
            Switch ({facingMode === "user" ? "Front" : "Back"})
          </button>
        </div>

        <button
          onClick={openNativeCamera}
          className="flex items-center gap-2 rounded px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700"
        >
          <CameraIcon size={16} /> Open Camera
        </button>
      </div>

      {/* Uppy Dashboard */}
      {uppyRef.current && (
        <div className="relative overflow-hidden rounded-lg">
          <Dashboard
            uppy={uppyRef.current}
            plugins={isCameraActive ? ["Webcam"] : []}
            theme={isNightMode ? "dark" : "light"}
            height={400}
            width="100%"
            showProgressDetails={true}
            showSelectedFiles={true}
            showRemoveButtonAfterComplete={true}
            disableStatusBar={false}
            disableInformer={false}
            disableThumbnailGenerator={false}
            proudlyDisplayPoweredByUppy={false}
            note="Select files to upload or drag and drop them here"
            locale={{
              strings: {
                uploading: "Uploading...",
                complete: "Complete",
                uploadFailed: "Upload failed",
                paused: "Paused",
                retry: "Retry",
                cancel: "Cancel",
                pause: "Pause",
                resume: "Resume",
                done: "Done",
                filesUploadedOfTotal: {
                  0: "%{complete} of %{smart_count} file uploaded",
                  1: "%{complete} of %{smart_count} files uploaded",
                },
                dataUploadedOfTotal: "%{complete} of %{total}",
                dataUploadedOfUnknown: "%{complete} uploaded",
                xTimeLeft: "%{time} left",
                uploadXFiles: {
                  0: "Upload %{smart_count} file",
                  1: "Upload %{smart_count} files",
                },
                uploadXNewFiles: {
                  0: "Upload %{smart_count} new file",
                  1: "Upload %{smart_count} new files",
                },
                upload: "Upload",
                retryUpload: "Retry upload",
                xMoreFilesAdded: {
                  0: "%{numFiles} more file added",
                  1: "%{numFiles} more files added",
                },
                showErrorDetails: "Show error details",
              },
            }}
          />
        </div>
      )}
    </div>
  );
};

export default AdvancedUpload;

```

<!-- path:components/diagrams/uploader-components/SimpleUpload.tsx -->
```typescript
// components/diagrams/uploader-components/SimpleUpload.tsx
import React from "react";
import { Loader2 } from "lucide-react";

interface SimpleUploadProps {
  uppyRef: React.MutableRefObject<any>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  triggerFileInput: () => void;
  selectedFiles: any[];
  handleRemoveFile: (fileId: string) => void;
  isUploading: boolean;
  handleStartUpload: () => void;
  isNightMode: boolean;
//   FileItemComponent?: ({ file }: { file: any }) => React.JSX.Element;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const SimpleUpload: React.FC<SimpleUploadProps> = ({
  uppyRef,
  fileInputRef,
  handleFileInputChange,
  triggerFileInput,
  selectedFiles,
  handleRemoveFile,
  isUploading,
  handleStartUpload,
  isNightMode,
}) => {
  return (
    <div className="space-y-4">
      <div
        id="uppy-drag-drop"
        onClick={triggerFileInput}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isNightMode
            ? "border-gray-600 bg-gray-750 hover:border-gray-500"
            : "border-gray-300 bg-gray-50 hover:border-gray-400"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf,.doc,.docx,.txt,.rtf,video/*,audio/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
        <div>
          <p className="text-lg font-medium">Drag files here or click to browse</p>
          <p className="mt-2 text-sm opacity-70">
            Supports images, PDFs, documents, audio, and video files
          </p>
        </div>
      </div>

      <div id="uppy-progress" className="w-full"></div>

      {selectedFiles.length > 0 && (
        <div
          className={`rounded-lg border p-4 ${
            isNightMode
              ? "border-gray-600 bg-gray-700"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <h4
            className={`mb-3 text-sm font-medium ${
              isNightMode ? "text-gray-200" : "text-gray-700"
            }`}
          >
            Selected Files ({selectedFiles.length})
          </h4>
          <div className="max-h-40 space-y-2 overflow-y-auto">
            {selectedFiles.map((file) => (
              <div
                key={file.id}
                className={`flex items-center justify-between rounded p-2 ${
                  isNightMode
                    ? "hover:bg-gray-600 bg-gray-650"
                    : "bg-white hover:bg-gray-100"
                } border ${
                  isNightMode ? "border-gray-500" : "border-gray-200"
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center space-x-3">
                  <div className="flex-shrink-0">
                    {file.type?.startsWith("image/") ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-green-100">
                        <span className="text-xs text-green-600">🖼️</span>
                      </div>
                    ) : file.type?.includes("pdf") ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-red-100">
                        <span className="text-xs text-red-600">📄</span>
                      </div>
                    ) : file.type?.startsWith("video/") ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-100">
                        <span className="text-xs text-blue-600">🎥</span>
                      </div>
                    ) : file.type?.startsWith("audio/") ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-purple-100">
                        <span className="text-xs text-purple-600">🎵</span>
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100">
                        <span className="text-xs text-gray-600">📁</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-medium ${
                        isNightMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {file.name}
                    </p>
                    <p
                      className={`text-xs ${
                        isNightMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFile(file.id)}
                  className={`ml-2 flex-shrink-0 rounded-full p-1 transition-colors ${
                    isNightMode
                      ? "text-gray-400 hover:bg-red-500 hover:text-red-400"
                      : "text-gray-500 hover:bg-red-500 hover:text-red"
                  } transition-colors`}
                  title="Remove file"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleStartUpload}
        disabled={selectedFiles.length === 0 || isUploading}
        className={`flex w-full items-center justify-center gap-2 rounded px-4 py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          isNightMode
            ? "bg-blue-700 hover:bg-blue-800 disabled:bg-gray-600"
            : "bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
        } text-white`}
      >
        {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
        {isUploading
          ? "Uploading..."
          : selectedFiles.length > 0
            ? `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? "s" : ""}`
            : "Start Upload"}
      </button>
    </div>
  );
};

export default SimpleUpload;
```

<!-- path:components/diagrams/types/storage.ts -->
```typescript
export interface StoredFile {
  name: string;
  size: number;
  type: string;
  url: string;
  path?: string;
  uploadedAt: string;
}

export interface UploadProgress {
  [key: number]: number;
}

export interface StorageManagerProps {
  bucketName?: string;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  onUploadComplete?: (files: StoredFile[]) => void;
  onError?: (error: string) => void;
}

export interface SupabaseStorageError {
  error: string;
  message: string;
  statusCode?: string;
}


```

<!-- path:components/diagrams/FileTable.tsx -->
```typescript
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useTheme } from "@/contexts/ThemeContext";
import { Eye, Download, Trash2, Search, Filter, Grid, List, X } from "lucide-react";
import "../../app/customuppy.css"; // Custom styles for Uppy

interface FileTableProps {
  folders: any[];
  onFileDelete?: () => void;
}

export function FileTable({ folders, onFileDelete }: FileTableProps) {
  const { isNightMode } = useTheme();
  const supabase = createClient();

  const [files, setFiles] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [folderSearchTerm, setFolderSearchTerm] = useState<string>("");
  const [fileSearchTerm, setFileSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "type">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [loading, setLoading] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  // Filter folders based on folder search term and sort alphabetically in ascending order
  const filteredFolders = folders
    .filter(folder =>
      folder.name.toLowerCase().includes(folderSearchTerm.toLowerCase())
    )
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  // Reset selected folder when it's not in filtered results
  useEffect(() => {
    if (selectedFolder && folderSearchTerm) {
      const isFolderVisible = filteredFolders.some(folder => folder.id === selectedFolder);
      if (!isFolderVisible) {
        setSelectedFolder(null);
      }
    }
  }, [folderSearchTerm, selectedFolder, filteredFolders]);

  useEffect(() => {
    const fetchFiles = async () => {
      if (!selectedFolder) {
        setFiles([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("files")
          .select("*")
          .eq("folder_id", selectedFolder)
          .order("uploaded_at", { ascending: false });

        if (error) {
          console.error("Fetch files error:", error);
        } else {
          setFiles(data ?? []);
        }
      } catch (error) {
        console.error("Fetch files error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [selectedFolder, supabase]);

  const handleView = (file: any) => {
    if (file.file_type === "application/pdf") {
      const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(file.file_url)}&embedded=true`;
      window.open(googleViewerUrl, '_blank');
    } else {
      window.open(file.file_url, '_blank');
    }
  };

  const handleDelete = async (file: any) => {
    if (!confirm(`Are you sure you want to delete "${file.file_name}"?`)) {
      return;
    }

    setDeletingFile(file.id);
    try {
      const { error } = await supabase
        .from("files")
        .delete()
        .eq("id", file.id);

      if (error) {
        console.error("Delete error:", error);
        alert("Failed to delete file");
      } else {
        setFiles(files.filter(f => f.id !== file.id));
        onFileDelete?.();
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete file");
    } finally {
      setDeletingFile(null);
    }
  };

  const getDownloadUrl = (file: any) => {
    if (file.file_type === "application/pdf") {
      return file.file_url.replace("/upload/", "/upload/fl_attachment/");
    }
    return file.file_url;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return "🖼️";
    if (fileType === "application/pdf") return "📄";
    if (fileType.startsWith("video/")) return "🎥";
    if (fileType.startsWith("audio/")) return "🎵";
    if (fileType.includes("document") || fileType.includes("word")) return "📝";
    if (fileType.includes("spreadsheet") || fileType.includes("excel")) return "📊";
    if (fileType.includes("presentation") || fileType.includes("powerpoint")) return "📈";
    return "📎";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper function to truncate folder names with ellipsis
  const truncateFolderName = (name: string, maxLength: number = 20) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + "...";
  };

  // Clear search functions
  const clearFolderSearch = () => {
    setFolderSearchTerm("");
  };

  const clearFileSearch = () => {
    setFileSearchTerm("");
  };

  // Filter and sort files
  const filteredAndSortedFiles = files
    .filter(file => {
      const matchesSearch = file.file_name.toLowerCase().includes(fileSearchTerm.toLowerCase());
      const matchesType = fileTypeFilter === "all" || file.file_type.startsWith(fileTypeFilter);
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "name":
          aValue = a.file_name.toLowerCase();
          bValue = b.file_name.toLowerCase();
          break;
        case "type":
          aValue = a.file_type;
          bValue = b.file_type;
          break;
        case "date":
        default:
          aValue = new Date(a.uploaded_at || a.created_at);
          bValue = new Date(b.uploaded_at || b.created_at);
          break;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getFileTypeOptions = () => {
    const types = [...new Set(files.map(file => file.file_type.split("/")[0]))];
    return types.map(type => ({
      value: type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
    }));
  };

  return (
    <div className="mt-8 space-y-6">
      <h2
        className={`text-xl font-semibold ${isNightMode ? "text-white" : "text-black"}`}
      >
        UPLOADED DIAGRAMS
      </h2>

      {/* Search and Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Folder Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search folders..."
            value={folderSearchTerm}
            onChange={(e) => setFolderSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-10 py-2 rounded border text-sm ${
              isNightMode
                ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                : "border-gray-300 bg-white text-black placeholder-gray-500"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {folderSearchTerm && (
            <button
              onClick={clearFolderSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sort By */}
        {/* <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className={`rounded border px-3 py-2 text-sm ${
            isNightMode
              ? "border-gray-600 bg-gray-700 text-white"
              : "border-gray-300 bg-white text-black"
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
        >
          <option value="date">Sort by Date</option>
          <option value="name">Sort by Name</option>
          <option value="type">Sort by Type</option>
        </select> */}

        {/* Sort Order */}
        {/* <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as any)}
          className={`rounded border px-3 py-2 text-sm ${
            isNightMode
              ? "border-gray-600 bg-gray-700 text-white"
              : "border-gray-300 bg-white text-black"
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select> */}

        {/* View Mode Toggle */}
        <div className="flex rounded border overflow-hidden">
          <button
            onClick={(e) => { e.stopPropagation(); setViewMode("grid"); }}
            className={`flex-1 px-3 py-2 text-sm transition-colors ${
              viewMode === "grid"
                ? isNightMode
                  ? "bg-blue-700 text-white"
                  : "bg-blue-600 text-white"
                : isNightMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Grid className="h-4 w-4 mx-auto" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setViewMode("list"); }}
            className={`flex-1 px-3 py-2 text-sm transition-colors ${
              viewMode === "list"
                ? isNightMode
                  ? "bg-blue-700 text-white"
                  : "bg-blue-600 text-white"
                : isNightMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <List className="h-4 w-4 mx-auto" />
          </button>
        </div>
      </div>

      {/* File Type Filter */}
      {files.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFileTypeFilter("all")}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              fileTypeFilter === "all"
                ? isNightMode
                  ? "bg-blue-700 text-white"
                  : "bg-blue-600 text-white"
                : isNightMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            All Files ({files.length})
          </button>
          {getFileTypeOptions().map((option) => {
            const count = files.filter(file => file.file_type.startsWith(option.value)).length;
            // console.log(`File type: ${option.value}, Count: ${count}`, "label:", option.label);

            return (
              <button
                key={option.value}
                onClick={() => setFileTypeFilter(option.value)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  fileTypeFilter === option.value
                    ? isNightMode
                      ? "bg-blue-700 text-white"
                      : "bg-blue-600 text-white"
                    : isNightMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {option.label === "Application" ? "Pdf" : option.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Folder Selection */}
      <div className="space-y-4">
        <h3 className={`text-lg font-medium ${isNightMode ? "text-white" : "text-black"}`}>
          Select Folder to View Files
        </h3>

        {filteredFolders.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {filteredFolders.map((folder) => (
              <div key={folder.id} className="group relative">
                <button
                  className={`w-full p-4 rounded border text-left transition-all hover:shadow-md ${
                    selectedFolder === folder.id
                      ? isNightMode
                        ? "border-blue-500 bg-blue-900 shadow-lg"
                        : "border-blue-400 bg-blue-50 shadow-lg"
                      : isNightMode
                        ? "border-gray-600 bg-gray-700 hover:bg-gray-600"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                  } ${isNightMode ? "text-white" : "text-black"}`}
                  onClick={() => setSelectedFolder(folder.id)}
                  title={folder.name} // Show full name on hover
                >
                  <div className="flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-lg flex-shrink-0">📁</span>
                      <span className="font-medium text-sm leading-tight break-words line-clamp-2 min-w-0">
                        {folder.name}
                      </span>
                    </div>
                    {selectedFolder === folder.id && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded flex-shrink-0 ml-2">
                        Selected
                      </span>
                    )}
                  </div>
                </button>

                {/* Tooltip for long folder names */}
                {folder.name.length > 25 && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-xs text-center">
                    {folder.name}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-center py-8 ${isNightMode ? "text-gray-400" : "text-gray-500"}`}>
            {folderSearchTerm ? "No folders found matching your search." : "No folders available."}
          </div>
        )}
      </div>

      {/* Files Display */}
      {selectedFolder && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-medium ${isNightMode ? "text-white" : "text-black"}`}>
              Files ({filteredAndSortedFiles.length})
            </h3>
            {loading && (
              <div className="text-sm text-gray-500">Loading files...</div>
            )}
          </div>

          {/* File Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={fileSearchTerm}
              onChange={(e) => setFileSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-10 py-2 rounded border text-sm ${
                isNightMode
                  ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                  : "border-gray-300 bg-white text-black placeholder-gray-500"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {fileSearchTerm && (
              <button
                onClick={clearFileSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredAndSortedFiles.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAndSortedFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`group relative overflow-hidden rounded-lg border p-3 transition-all hover:shadow-lg ${
                      isNightMode
                        ? "border-gray-600 bg-gray-700 hover:bg-gray-600"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    {/* File Preview */}
                    <div className="aspect-square mb-3 overflow-hidden rounded">
                      {file.file_type.includes("image") ? (
                        <img
                          src={file.file_url}
                          alt={file.file_name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className={`flex h-full w-full items-center justify-center ${
                          isNightMode ? "bg-gray-600" : "bg-gray-100"
                        }`}>
                          <div className="text-center">
                            <div className="mb-2 text-3xl">{getFileIcon(file.file_type)}</div>
                            <p className="text-xs text-gray-500 uppercase">
                              {file.file_type.split("/")[1] || "FILE"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="space-y-1">
                      <p
                        className={`truncate text-sm font-medium ${
                          isNightMode ? "text-white" : "text-black"
                        }`}
                        title={file.file_name}
                      >
                        {file.file_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(file.uploaded_at || file.created_at)}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => handleView(file)}
                        title="View"
                        className="bg-opacity-80 hover:bg-opacity-100 rounded bg-black p-1.5 text-white transition-all"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                      <a
                        href={getDownloadUrl(file)}
                        download={file.file_name}
                        title="Download"
                        className="bg-opacity-80 hover:bg-opacity-100 rounded bg-black p-1.5 text-white transition-all"
                      >
                        <Download className="h-3 w-3" />
                      </a>
                      <button
                        onClick={() => handleDelete(file)}
                        disabled={deletingFile === file.id}
                        title="Delete"
                        className="bg-opacity-80 hover:bg-opacity-100 rounded bg-red-600 p-1.5 text-white transition-all disabled:opacity-50"
                      >
                        {deletingFile === file.id ? (
                          <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent"></div>
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <div className={`${isNightMode ? "bg-gray-700" : "bg-gray-50"} px-4 py-2 border-b`}>
                  <div className="grid grid-cols-12 gap-4 text-xs font-medium uppercase tracking-wide text-gray-500">
                    <div className="col-span-5">Name</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-1">Actions</div>
                  </div>
                </div>
                <div className={`divide-y ${isNightMode ? "divide-gray-600" : "divide-gray-200"}`}>
                  {filteredAndSortedFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`group px-4 py-3 transition-colors hover:${
                        isNightMode ? "bg-gray-600" : "bg-gray-50"
                      }`}
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-5 flex items-center gap-3">
                          <span className="text-lg">{getFileIcon(file.file_type)}</span>
                          <span
                            className={`truncate text-sm ${
                              isNightMode ? "text-white" : "text-black"
                            }`}
                            title={file.file_name}
                          >
                            {file.file_name}
                          </span>
                        </div>
                        <div className="col-span-2 text-xs text-gray-500 uppercase">
                          {file.file_type.split("/")[1] || "Unknown"}
                        </div>
                        <div className="col-span-2 text-xs text-gray-500">
                          {formatDate(file.uploaded_at || file.created_at)}
                        </div>
                        <div className="col-span-1 flex gap-1">
                          <button
                            onClick={() => handleView(file)}
                            title="View"
                            className={`p-1 text-gray-400 hover:text-blue-500 transition-colors`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <a
                            href={getDownloadUrl(file)}
                            download={file.file_name}
                            title="Download"
                            className={`p-1 text-gray-400 hover:text-green-500 transition-colors`}
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(file)}
                            disabled={deletingFile === file.id}
                            title="Delete"
                            className={`p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50`}
                          >
                            {deletingFile === file.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border border-gray-400 border-t-transparent"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className={`text-center py-12 ${isNightMode ? "text-gray-400" : "text-gray-500"}`}>
              <div className="text-4xl mb-4">📭</div>
              <p className="text-lg font-medium">No files found</p>
              <p className="text-sm">
                {fileSearchTerm || fileTypeFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Upload some files to get started."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

<!-- path:components/diagrams/hooks/useUppyUploader.ts -->
```typescript
// hooks/useUppyUploader.ts
import { useRef, useState, useEffect } from 'react';
import Uppy from '@uppy/core';
import XHRUpload from '@uppy/xhr-upload';
import Webcam from '@uppy/webcam';
import { createClient } from "@/utils/supabase/client";
import { createOptimizedUppy } from "@/utils/imageOptimization";
import { smartCompress, convertToWebP, createProgressiveJPEG } from "@/utils/imageOptimization";


interface UploadedFile {
  public_id: string;
  secure_url: string;
  // Add other properties as needed
}

interface SelectedFile {
  id: string;
  name: string;
  type: string;
  size: number;
}

interface UseUppyUploaderProps {
  folderId: string | null;
  isNightMode: boolean;
  // refresh: boolean;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
  // error?: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

interface UseUppyUploaderReturn {
  uppyRef: React.RefObject<Uppy | null>;
  uploadedFiles: UploadedFile[];
  selectedFiles: SelectedFile[];
  isUploading: boolean;
  processedFiles: Set<string>;
  handleStartUpload: () => void;
  toggleCamera: () => void;
  toggleCameraActive: () => void;
  facingMode: 'user' | 'environment';
  isCameraActive: boolean;
  cameraError: string | null;
}

export function useUppyUploader({
  folderId,
  isNightMode,
  setRefresh,
  setError,
}: UseUppyUploaderProps): UseUppyUploaderReturn {
  const supabase = createClient();
  const uppyRef = useRef<Uppy<any, Record<string, never>> | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
    (localStorage.getItem("preferredCamera") as 'user' | 'environment') || 'environment'
  );
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [processedFiles, setProcessedFiles] = useState<Set<string>>(new Set());


  // Initialize Uppy
  useEffect(() => {
    const uppy = createOptimizedUppy({ folderId, isNightMode });

    uppy.use(XHRUpload, {
      endpoint: "/api/upload",
      method: "POST",
      formData: true,
      fieldName: "file",
      bundle: false,
      headers: {
        "x-folder-id": folderId || "",
      },
      limit: 14,
    });

    // Configure Webcam
    const webcamPlugin = uppy.use(Webcam, {
      onBeforeSnapshot: () => Promise.resolve(),
      countdown: false,
      modes: ["video-audio", "video-only", "audio-only", "picture"],
      mirror: facingMode === "user",
      videoConstraints: {
        facingMode: facingMode,
        width: { min: 720, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 },
      },
      showVideoSourceDropdown: true,
    });

    if (webcamPlugin && typeof webcamPlugin.on === "function") {
      webcamPlugin.on("error", (error: any) => {
        const errorMsg = `Camera error: ${error.message}`;
        setCameraError(errorMsg);
       console.error("Webcam error:", error);
      });
    }

    // Add optimization preprocessor
    uppy.addPreProcessor(async (fileIDs) => {
      const optimizationPromises = fileIDs.map(async (fileID) => {
        const file = uppy.getFile(fileID);

        if (file?.type?.startsWith("image/")) {
          try {
            let optimizedFile = await smartCompress(file.data as File);
            if (!optimizedFile || optimizedFile.size === 0) {
              console.warn("Optimization failed for", file.name, "- using original");
              return;
            }

            const webpFile = await convertToWebP(optimizedFile);
            if (webpFile.size < optimizedFile.size) {
              optimizedFile = webpFile;
            }

            if (optimizedFile.type === "image/jpeg") {
              optimizedFile = await createProgressiveJPEG(optimizedFile);
            }

            if (optimizedFile.size > 0) {
              uppy.setFileState(fileID, {
                data: optimizedFile,
                size: optimizedFile.size,
              });

              console.log(
                `Optimized ${file.name}: ${((file.size ?? 0) / 1024 / 1024).toFixed(2)}MB → ${(optimizedFile.size / 1024 / 1024).toFixed(2)}MB`,
              );
            }
          } catch (error) {
            console.warn(`Failed to optimize ${file.name}:`, error);
            uppy.setFileState(fileID, {
              data: file.data,
              size: file.size,
            });
          }
        }
      });

      await Promise.all(optimizationPromises);
    });

    // Event handlers
    uppy.on("upload", () => {
      setIsUploading(true);
      setCameraError(null);
    });

    uppy.on("upload-success", async (file, response) => {
      try {
       if (!file || processedFiles.has(file.id)) return;
        setProcessedFiles((prev) => new Set([...prev, file.id]));

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          throw new Error("User not authenticated");
        }

        if (!response.body?.public_id) {
          console.error("Missing public_id in response:", {
            file: file.name,
            response: response.body,
          });
          setError("Upload response is missing public_id.");
          return;
        }

        const { data: existingFile } = await supabase
          .from("files")
          .select("id")
          .eq("file_route", response.body.public_id)
          // .eq("user_id", userData.user.id)
          .single();

        if (existingFile) {
          console.log("File already exists in database, skipping insert");
          setUploadedFiles((prev) => [...prev, response.body]);
          return;
        }

        const fileData = {
          user_id: userData.user.id,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_route: response.body.public_id,
          file_url: response.body.secure_url || "",
          folder_id: folderId,
        };

        const { error: dbError } = await supabase
          .from("files")
          .insert(fileData);

        if (dbError) {
          console.error("Database error:", dbError);
          setError(`Database error: ${dbError.message}`);
          setProcessedFiles((prev) => {
            const newSet = new Set(prev);
            newSet.delete(file.id);
            return newSet;
          });
        } else {
          setUploadedFiles((prev) => [...prev, response.body]);
          setRefresh((prev) => !prev);
        }
      } catch (err: any) {
        console.error("Upload success handler error:", err);
        setError(err.message);
        if (file) {
          setProcessedFiles((prev) => {
            const newSet = new Set(prev);
            newSet.delete(file.id);
            return newSet;
          });
        }
      }
    });

    uppy.on("upload-error", (file, error) => {
     console.error("Upload error:", error);
      setError(`Upload failed: ${error.message}`);
      setIsUploading(false);
    });

   uppy.on("complete", (result) => {
      console.log("Upload complete:", result);
      setIsUploading(false);
      if ((result.successful ?? []).length > 0) {
        setError(null);
        setSelectedFiles([]);
        setTimeout(() => setProcessedFiles(new Set()), 1000);
      }
    });

    uppy.on("file-added", (file) => {
      uppy.setFileMeta(file.id, { folderId });
      setSelectedFiles(prev => [
        ...prev.filter(f => f.id !== file.id),
        {
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
        },
      ]);
    });

    uppy.on("file-removed", (file) => {
      setSelectedFiles((prev) => prev.filter((f) => f.id !== file.id));
    });

    uppyRef.current = uppy;

    return () => {
      uppy.destroy();
      uppyRef.current = null;
    };
  }, [folderId, supabase, facingMode, isNightMode, processedFiles]);



  const handleStartUpload = () => {
    if (!folderId) {
      setError("Please select a folder first.");
      return;
    }

    if (!selectedFiles.length) {
      setError("Please select files to upload first.");
      return;
    }

    uppyRef.current?.upload();
  };

  const toggleCamera = () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
    localStorage.setItem("preferredCamera", newMode);

    if (uppyRef.current) {
      const webcamPlugin = uppyRef.current.getPlugin("Webcam");
      if (webcamPlugin) {
        webcamPlugin.setOptions({
          mirror: newMode === "user",
          facingMode: newMode,
        });
      }
    }
  };

  const toggleCameraActive = () => {
    setIsCameraActive(!isCameraActive);
  };

  return {
    uppyRef,
    uploadedFiles,
    selectedFiles,
    isUploading,
    processedFiles,
    handleStartUpload,
    toggleCamera,
    toggleCameraActive,
    facingMode,
    isCameraActive,
    cameraError
  };
}
```

<!-- path:components/diagrams/hooks/useFolders.ts -->
```typescript
// hooks/useFolders.ts
import { useState, useCallback, useEffect } from 'react';
import { createClient } from "@/utils/supabase/client";

interface useFoldersProps {
  refresh: boolean;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
  error?: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useFolders({
  refresh,
  setRefresh,
  error,
  setError
}: useFoldersProps) {
  const supabase = createClient();
  const [folders, setFolders] = useState<any[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");

  const fetchFolders = useCallback(async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return;

    const { data, error } = await supabase
      .from("folders")
      .select("*")
      // .eq("user_id", user.id);

    if (error) {
      console.error("Fetch folders error:", error);
      setError("Failed to load folders");
    } else {
      setFolders(data || []);
    }
  }, [supabase]);

  const refreshFolders = useCallback(async () => {
    fetchFolders();
  }, [fetchFolders, refresh]);

  const handleCreateFolder = useCallback(async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || !newFolderName.trim()) return;

    const { error } = await supabase.from("folders").insert({
      user_id: user.id,
      name: newFolderName.trim(),
    });

    if (error) {
      setError(error.message);
    } else {
      setNewFolderName("");
      setRefresh((prev) => !prev);
    }
  }, [supabase, newFolderName]);

  // Effect to refresh folders when refreshFlag changes
  useEffect(() => {
    refreshFolders();
  }, [refreshFolders, refresh]);

  return {
    folders,
    folderId,
    setFolderId,
    newFolderName,
    setNewFolderName,
    handleCreateFolder,
    refreshFolders,
    error,
    setError
  };
}
```

<!-- path:components/diagrams/hooks/useFileHandling.ts -->
```typescript
// hooks/useFileHandling.ts
import { useCallback, useRef } from 'react';
import Uppy from "@uppy/core";

export function useFileHandling(uppyRef: React.RefObject<Uppy | null>) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && uppyRef.current) {
      Array.from(files).forEach((file) => {
        uppyRef.current?.addFile({
          name: file.name,
          type: file.type,
          data: file,
          source: "file-input",
          isRemote: false,
        });
      });
      event.target.value = '';
    }
  }, [uppyRef]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemoveFile = useCallback((fileId: string) => {
    uppyRef.current?.removeFile(fileId);
  }, [uppyRef]);

  return {
    fileInputRef,
    handleFileInputChange,
    triggerFileInput,
    handleRemoveFile
  };
}
```

<!-- path:components/diagrams/FileUploader.tsx -->
```typescript
// components/FileUploader.tsx
"use client";

import { useState } from "react";
import { FileTable } from "./FileTable";
import { useTheme } from "@/contexts/ThemeContext";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import Uppy styles
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import "@uppy/drag-drop/dist/style.min.css";
import "@uppy/progress-bar/dist/style.min.css";
import "@uppy/webcam/dist/style.min.css";
import FolderManagement from "./uploader-components/FolderManagement";
import UploadModeToggle from "./uploader-components/UploadModeToggle";
import ErrorDisplay from "./uploader-components/ErrorDisplay";
import RecentlyUploaded from "./uploader-components/RecentlyUploaded";
import SimpleUpload from "./uploader-components/SimpleUpload";
import AdvancedUpload from "./uploader-components/AdvancedUpload";
import { useFileHandling } from "./hooks/useFileHandling";
import { useFolders } from "./hooks/useFolders";
import { useUppyUploader } from "./hooks/useUppyUploader";

export default function FileUploader() {
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showUploadSection, setShowUploadSection] = useState(false);

  const { isNightMode } = useTheme();

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
    isNightMode,
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
      className={`mx-auto max-w-4xl space-y-6 rounded-lg border p-6 shadow-sm ${
        isNightMode
          ? "border-gray-700 bg-gray-800 text-white"
          : "border-gray-200 bg-white text-black"
      }`}
    >
      <ToastContainer
        position="top-right"
        autoClose={10000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <button
        className={`mb-4 px-4 py-2 rounded-md text-sm font-medium ${
          isNightMode
            ? "bg-gray-700 text-white hover:bg-gray-600"
            : "bg-gray-200 text-black hover:bg-gray-300"
        } ${
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
        isNightMode={isNightMode}
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        handleCreateFolder={handleCreateFolder}
        folderId={folderId}
        setFolderId={setFolderId}
        folders={folders}
      />

      {/* Upload Mode Toggle */}
      <UploadModeToggle
        isNightMode={isNightMode}
        showDashboard={showDashboard}
        setShowDashboard={setShowDashboard}
        folderId={folderId}
      />

      {/* Error Messages */}
      {error && (
        <ErrorDisplay
          error={error}
          isNightMode={isNightMode}
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
              isNightMode={isNightMode}
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
              isNightMode={isNightMode}
            />
          )}
        </div>
      ) : null}
      {/* No folder selected message */}

      {!folderId && (
        <div
          className={`py-8 text-center ${isNightMode ? "text-gray-400" : "text-gray-500"}`}
        >
          Please select a folder to start uploading files.
        </div>
      )}

      {/* Recently Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <RecentlyUploaded
          uploadedFiles={uploadedFiles}
          isNightMode={isNightMode}
        />
      )}
      </>
      )}

      {/* File Table */}
      <FileTable folders={folders} />
    </div>
  );
}

```

