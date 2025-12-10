// components/diagrams/hooks/useUppyUploader.ts
import { useRef, useState, useEffect } from 'react';
import Uppy, { UppyFile } from '@uppy/core';
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
    const uppy = createOptimizedUppy({ folderId }) as unknown as AppUppy;

    // THE FIX: Construct Absolute URL to prevent relative path issues
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const endpoint = `${origin}/api/upload`;

    // THE FIX: Cast to 'any' to bypass strict type definition of XHRUploadOptions 
    // which sometimes misses 'getResponseError' in specific versions
    uppy.use(XHRUpload, {
      endpoint: endpoint,
      method: "POST",
      formData: true,
      fieldName: "file",
      bundle: false,
      // Removed retryDelays as it is not natively supported by XHRUpload in this version
      headers: {
        "x-folder-id": folderId || "",
      },
      limit: 5,
      // THE FIX: Robust error parsing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getResponseError(responseText: string, response: any) {
        console.log("Raw Upload Response:", responseText); // Debugging
        try {
            const json = JSON.parse(responseText);
            if (json.error) return new Error(json.error);
        } catch (e) {
          console.log(e);
          
            // ignore JSON parse error
        }
        return new Error(response.statusText || "Upload failed due to network or server error");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Configure Webcam
    uppy.use(Webcam, {
      onBeforeSnapshot: () => Promise.resolve(),
      countdown: false,
      modes: ["video-audio", "video-only", "audio-only", "picture"],
      mirror: facingMode === "user",
      videoConstraints: {
        facingMode: facingMode,
      },
      showVideoSourceDropdown: true,
    });

    // Removed specific webcam 'error' listener here because it was catching 
    // general upload errors and displaying them as "Camera error".
    // General errors are handled by 'upload-error' below.

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
      setError(""); // Clear previous errors
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    uppy.on("upload-success", async (file: UppyFile<any, any> | undefined, response: any) => {
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
        console.error("Uppy Upload Error:", error);
        // Use the error message returned by getResponseError
        setError(error.message || "Upload failed");
        setIsUploading(false);
    });

    uppy.on("complete", (result) => {
        setIsUploading(false);
        if (result && result.successful && Array.isArray(result.successful) && result.successful.length > 0) {
            setError(""); 
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
  }, [folderId, facingMode]); 

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