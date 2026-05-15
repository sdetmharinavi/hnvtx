// components/diagrams/uploader-components/UploadModeToggle.tsx
import React from "react";

interface UploadModeToggleProps {
  showDashboard: boolean;
  setShowDashboard: (value: boolean) => void;
  folderId: string | null;
}

const UploadModeToggle: React.FC<UploadModeToggleProps> = ({
  showDashboard,
  setShowDashboard,
  folderId,
}) => {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => setShowDashboard(true)}
        disabled={!folderId}
        className={`flex-1 rounded px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          showDashboard
            ? "bg-blue-600 dark:bg-blue-700"
            : "bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500"
        }`}
      >
        Advanced Upload
      </button>
      <button
        onClick={() => setShowDashboard(false)}
        className={`flex-1 rounded px-4 py-2 text-sm font-medium text-white transition-colors ${
          !showDashboard
            ? "bg-blue-600 dark:bg-blue-700"
            : "bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500"
        }`}
      >
        Simple Upload
      </button>
    </div>
  );
};

export default UploadModeToggle;