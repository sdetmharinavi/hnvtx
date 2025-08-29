// components/diagrams/uploader-components/SimpleUpload.tsx
import React from "react";
import { Loader2 } from "lucide-react";

interface SimpleUploadProps {
  uppyRef: React.RefObject<any>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  triggerFileInput: () => void;
  selectedFiles: any[];
  handleRemoveFile: (fileId: string) => void;
  isUploading: boolean;
  handleStartUpload: () => void;
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
}) => {
  return (
    <div className="space-y-4">
      <div
        id="uppy-drag-drop"
        onClick={triggerFileInput}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors dark:border-gray-600 dark:bg-gray-750 dark:hover:border-gray-500`}
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
          className={`rounded-lg border p-4 dark:border-gray-600 dark:bg-gray-700`}
        >
          <h4
            className={`mb-3 text-sm font-medium dark:text-gray-200 text-gray-700`}
          >
            Selected Files ({selectedFiles.length})
          </h4>
          <div className="max-h-40 space-y-2 overflow-y-auto">
            {selectedFiles.map((file) => (
              <div
                key={file.id}
                className={`flex items-center justify-between rounded p-2 dark:hover:bg-gray-600 dark:bg-gray-650 border dark:border-gray-500`}
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
                      className={`truncate text-sm font-medium dark:text-white text-gray-900`}
                    >
                      {file.name}
                    </p>
                    <p
                      className={`text-xs dark:text-gray-400 text-gray-500`}
                    >
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFile(file.id)}
                  className={`ml-2 flex-shrink-0 rounded-full p-1 transition-colors dark:text-gray-400 dark:hover:bg-red-500 dark:hover:text-red-400 text-gray-500 hover:bg-red-500 hover:text-red`}
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
        className={`flex w-full items-center justify-center gap-2 rounded px-4 py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800 dark:disabled:bg-gray-600 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white`}
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