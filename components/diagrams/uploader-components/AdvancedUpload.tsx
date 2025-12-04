// components/diagrams/uploader-components/AdvancedUpload.tsx
"use client";

import React, { useRef } from "react";
import Dashboard from "@uppy/react/dashboard";
import { Camera as CameraIcon, SwitchCamera } from "lucide-react";
import type { AppUppy } from "@/components/diagrams/hooks/useUppyUploader";

interface AdvancedUploadProps {
  uppyRef: React.RefObject<AppUppy | null>;
  facingMode: "user" | "environment";
  toggleCamera: () => void;
  theme: "light" | "dark" | "auto"; // Pass the specific theme string for Uppy
}

const AdvancedUpload: React.FC<AdvancedUploadProps> = ({
  uppyRef,
  facingMode,
  toggleCamera,
  theme,
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
    if (e.target) e.target.value = '';
  };

  const openNativeCamera = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="uppy-dashboard-container rounded-lg overflow-hidden bg-white dark:bg-gray-800">
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
      <div className="mb-3 flex justify-between items-center">
        <button
          onClick={toggleCamera}
          className="flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <SwitchCamera size={16} />
          Switch Camera
        </button>

        <button
          onClick={openNativeCamera}
          className="flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <CameraIcon size={16} /> Native Camera
        </button>
      </div>

      {/* Uppy Dashboard */}
      {uppyRef.current && (
        <div className="relative">
          <Dashboard
            uppy={uppyRef.current}
            plugins={["Webcam", "ImageEditor"]}
            height={450}
            width="100%"
            hideProgressDetails={false}
            showSelectedFiles={true}
            showRemoveButtonAfterComplete={true}
            theme={theme} // Pass the theme prop here
            proudlyDisplayPoweredByUppy={false}
            note="Select files, drag & drop, or use the camera"
          />
        </div>
      )}
    </div>
  );
};

export default AdvancedUpload;