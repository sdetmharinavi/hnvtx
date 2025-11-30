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
  // This component doesn't render UI directly, it triggers side effects (toasts)
  // when errors change.
  
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (cameraError) {
      toast.warning(cameraError);
    }
  }, [cameraError]);

  return null;
};

export default ErrorDisplay;