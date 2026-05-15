
// components/OfcForm/LoadingOverlay.tsx
import React from "react";
import { ButtonSpinner } from "@/components/common/ui/LoadingSpinner";

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  message = "Loading form data..." 
}) => (
  <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
    <div className="flex items-center space-x-3 bg-white dark:bg-gray-800 rounded-lg px-6 py-4 shadow-lg border dark:border-gray-700">
      <ButtonSpinner size="sm" />
      <span className="text-gray-600 dark:text-gray-300">
        {message}
      </span>
    </div>
  </div>
);

export default LoadingOverlay;