// components/diagrams/hooks/useUppyUploader.ts
import { useRef, useState, useEffect } from 'react';
import Uppy from '@uppy/core';
import XHRUpload from '@uppy/xhr-upload';
import Webcam from '@uppy/webcam';
import { createClient } from "@/utils/supabase/client";
import { createOptimizedUppy } from "@/utils/imageOptimization";
import { smartCompress, convertToWebP, createProgressiveJPEG } from "@/utils/imageOptimization";

export interface UploadedFile {
  public_id: string;
  secure_url?: string;
  file_url?: string;
}

export interface SelectedFile {
  id: string;
  name: string;
  type: string;
  size: number;
}

// Export the AppUppy type so components can reference it
export type AppUppy = Uppy<{ folderId: string | null }, Record<string, never>>;

interface UseUppyUploaderProps {
  folderId: string | null;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
  setError: (error: string) => void;
}

export function useUppyUploader({
  folderId,
  setRefresh,
  setError,
}: UseUppyUploaderProps) {
  const supabase = createClient();
  const uppyRef = useRef<AppUppy | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [processedFiles, setProcessedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load preferred camera from local storage
    const storedCamera = localStorage.getItem("preferredCamera");
    if (storedCamera === 'user' || storedCamera === 'environment') {
        setFacingMode(storedCamera);
    }

    // Initialize Uppy
    // createOptimizedUppy expects generic Uppy options structure
    // We force cast to AppUppy because we know the meta structure we are using
    const uppy = createOptimizedUppy({ folderId }) as unknown as AppUppy;

    uppy.use(XHRUpload, {
      endpoint: "/api/upload",
      method: "POST",
      formData: true,
      fieldName: "file",
      bundle: false,
      headers: {
        "x-folder-id": folderId || "",
      },
      limit: 5,
    });

    // Configure Webcam
    const webcamPlugin = uppy.use(Webcam, {
      onBeforeSnapshot: () => Promise.resolve(),
      countdown: false,
      modes: ["video-audio", "video-only", "audio-only", "picture"],
      mirror: facingMode === "user",
      videoConstraints: {
        facingMode: facingMode,
      },
      showVideoSourceDropdown: true,
    });

    if (webcamPlugin && typeof webcamPlugin.on === "function") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      webcamPlugin.on("error", (error: any) => {
        setCameraError(`Camera error: ${error.message || "Unknown error"}`);
      });
    }

    // Pre-processing logic (Compression)
    uppy.addPreProcessor(async (fileIDs) => {
      await Promise.all(fileIDs.map(async (fileID) => {
        const file = uppy.getFile(fileID);
        if (file?.type?.startsWith("image/") && file.data instanceof Blob) {
          try {
            const sourceFile = file.data instanceof File 
              ? file.data 
              : new File([file.data], file.name || "image", { type: file.type });

            let optimized = await smartCompress(sourceFile);
            const webp = await convertToWebP(optimized);
            if (webp.size < optimized.size) optimized = webp;

            if (optimized.type === "image/jpeg") {
                optimized = await createProgressiveJPEG(optimized);
            }

            uppy.setFileState(fileID, { data: optimized, size: optimized.size });
          } catch (err) {
            console.warn("Optimization skipped", err);
          }
        }
      }));
    });

    // Events
    uppy.on("upload", () => {
      setIsUploading(true);
      setCameraError(null);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    uppy.on("upload-success", async (file: any, response: any) => {
      if (!file || processedFiles.has(file.id)) return;
      
      setProcessedFiles(prev => new Set(prev).add(file.id));
      
      const responseBody = response.body;
      if (!responseBody?.public_id) {
          setError("Upload failed: Missing file ID in response");
          return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const fileRecord = {
            user_id: user.id,
            file_name: file.name || "Unnamed",
            file_type: file.type || "application/octet-stream",
            file_size: String(file.size || 0),
            file_route: responseBody.public_id,
            file_url: responseBody.secure_url || "",
            folder_id: folderId
        };

        const { error: dbError } = await supabase.from("files").insert(fileRecord);
        if (dbError) throw dbError;

        setUploadedFiles(prev => [...prev, responseBody]);
        setRefresh(prev => !prev);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Database save failed";
        setError(msg);
        // Allow retry by removing from processed
        setProcessedFiles(prev => {
            const next = new Set(prev);
            next.delete(file.id);
            return next;
        });
      }
    });

    uppy.on("upload-error", (_file, error) => {
        setError(`Upload failed: ${error.message}`);
        setIsUploading(false);
    });

    uppy.on("complete", (result) => {
        setIsUploading(false);
        if (result && result.successful && Array.isArray(result.successful) && result.successful.length > 0) {
            setError(""); // Clear previous errors on success
            setSelectedFiles([]);
            setTimeout(() => setProcessedFiles(new Set()), 1000);
        }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    uppy.on("file-added", (file: any) => {
        uppy.setFileMeta(file.id, { folderId });
        setSelectedFiles(prev => [...prev, {
            id: file.id,
            name: file.name,
            type: file.type,
            size: file.size
        }]);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    uppy.on("file-removed", (file: any) => {
        setSelectedFiles(prev => prev.filter(f => f.id !== file.id));
    });

    uppyRef.current = uppy;
    return () => {
        uppy.destroy();
        uppyRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId, facingMode]); // Removed dependencies that cause re-init loops

  const handleStartUpload = () => {
    if (!folderId) {
      setError("Please select a folder first.");
      return;
    }
    if (selectedFiles.length === 0) {
      setError("No files selected.");
      return;
    }
    uppyRef.current?.upload();
  };

  const toggleCamera = () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
    localStorage.setItem("preferredCamera", newMode);
    // Webcam plugin update is handled by Uppy instance recreation in useEffect
  };

  const toggleCameraActive = () => setIsCameraActive(!isCameraActive);

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