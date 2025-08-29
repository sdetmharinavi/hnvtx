

"use client";

import React, { useRef } from "react";
import { Dashboard } from "@uppy/react";
import { Camera, CameraOff, Camera as CameraIcon, SwitchCamera } from "lucide-react";
import Uppy from "@uppy/core";

interface AdvancedUploadProps {
  uppyRef: React.RefObject<Uppy | null>;
  isCameraActive: boolean;
  toggleCameraActive: () => void;
  facingMode: "user" | "environment";
  toggleCamera: () => void;
}

const AdvancedUpload: React.FC<AdvancedUploadProps> = ({
  uppyRef,
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
    <div className={`uppy-dashboard-container rounded-lg dark:uppy-dark uppy-light`}>
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
            className={`flex items-center gap-2 rounded px-3 py-1 text-sm dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500 bg-gray-200 text-black hover:bg-gray-300`}
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
            height={400}
            width="100%"
            hideProgressDetails={true}
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
