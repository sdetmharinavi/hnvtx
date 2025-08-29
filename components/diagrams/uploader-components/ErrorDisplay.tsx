// components/diagrams/uploader-components/ErrorDisplay.tsx
import React, { useEffect } from "react";
import { toast } from "sonner";

interface ErrorDisplayProps {
  error: string | null;
  cameraError: string | null;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  cameraError,
}) => {
  useEffect(() => {
    if (error) {
      toast.error(error, {
        position: "top-right",
        duration: 5000,
      });
    }
  }, [error]);

  useEffect(() => {
    if (cameraError) {
      toast.warning(`Camera Error: ${cameraError}`, {
        position: "top-right",
        duration: 5000,
      });
    }
  }, [cameraError]);

  return null; // Toasts are handled globally
};

export default ErrorDisplay;
