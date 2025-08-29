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
        className={`flex-1 rounded px-4 py-2 font-medium transition-colors ${
          showDashboard
            ? "dark:bg-blue-700 bg-blue-600"
            : "dark:bg-gray-600 dark:hover:bg-gray-500 bg-gray-400 hover:bg-gray-500"
        } text-white disabled:cursor-not-allowed disabled:opacity-50`}
      >
        Advanced Upload
      </button>
      <button
        onClick={() => setShowDashboard(false)}
        className={`flex-1 rounded px-4 py-2 font-medium transition-colors ${
          !showDashboard
            ? "dark:bg-blue-700 bg-blue-600"
            : "dark:bg-gray-600 dark:hover:bg-gray-500 bg-gray-400 hover:bg-gray-500"
        } text-white`}
      >
        Simple Upload
      </button>
    </div>
  );
};

export default UploadModeToggle;