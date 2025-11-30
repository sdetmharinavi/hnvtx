// components/diagrams/uploader-components/SimpleUpload.tsx
import React from "react";
import { AppUppy, SelectedFile } from "@/components/diagrams/hooks/useUppyUploader";
import { Loader2, Trash2 } from "lucide-react";

interface SimpleUploadProps {
  uppyRef: React.RefObject<AppUppy | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  triggerFileInput: () => void;
  selectedFiles: SelectedFile[];
  handleRemoveFile: (fileId: string) => void;
  isUploading: boolean;
  handleStartUpload: () => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const SimpleUpload: React.FC<SimpleUploadProps> = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  uppyRef,
  fileInputRef,
  handleFileInputChange,
  triggerFileInput,
  selectedFiles,
  handleRemoveFile,
  isUploading,
  handleStartUpload,
}) => {
  return (
    <div className="space-y-4">
      <div
        onClick={triggerFileInput}
        className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center transition-colors hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800/50 dark:hover:border-gray-500"
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
          <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
            Drag files here or click to browse
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 opacity-70">
            Supports images, PDFs, documents, audio, and video files
          </p>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-200">
            Selected Files ({selectedFiles.length})
          </h4>
          <div className="max-h-40 space-y-2 overflow-y-auto custom-scrollbar">
            {selectedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="flex min-w-0 flex-1 items-center space-x-3">
                  <div className="flex-shrink-0">
                    {file.type?.startsWith("image/") ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-green-100 text-xs">🖼️</div>
                    ) : file.type?.includes("pdf") ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-red-100 text-xs">📄</div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-xs">📁</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFile(file.id)}
                  className="ml-2 rounded-full p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  title="Remove file"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleStartUpload}
        disabled={selectedFiles.length === 0 || isUploading}
        className="flex w-full items-center justify-center gap-2 rounded px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed dark:bg-blue-600 dark:hover:bg-blue-700 dark:disabled:bg-gray-600"
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