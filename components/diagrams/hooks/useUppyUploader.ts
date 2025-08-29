// hooks/useUppyUploader.ts
import { useRef, useState, useEffect } from 'react';
import Uppy from '@uppy/core';
import XHRUpload from '@uppy/xhr-upload';
import Webcam from '@uppy/webcam';
import { createClient } from "@/utils/supabase/client";
import { createOptimizedUppy } from "@/utils/imageOptimization";
import { smartCompress, convertToWebP, createProgressiveJPEG } from "@/utils/imageOptimization";
import { useUploadFile } from "@/hooks/database/file-queries";


interface UploadedFile {
  public_id: string;
  secure_url: string;
  // Add other properties as needed
}

interface SelectedFile {
  id: string;
  name: string;
  type: string;
  size: number;
}

interface UseUppyUploaderProps {
  folderId: string | null;
  // refresh: boolean;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
  // error?: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

interface UseUppyUploaderReturn {
  uppyRef: React.RefObject<Uppy | null>;
  uploadedFiles: UploadedFile[];
  selectedFiles: SelectedFile[];
  isUploading: boolean;
  processedFiles: Set<string>;
  handleStartUpload: () => void;
  toggleCamera: () => void;
  toggleCameraActive: () => void;
  facingMode: 'user' | 'environment';
  isCameraActive: boolean;
  cameraError: string | null;
}

export function useUppyUploader({
  folderId,
  setRefresh,
  setError,
}: UseUppyUploaderProps): UseUppyUploaderReturn {
  const { mutate: uploadFile } = useUploadFile();
  const supabase = createClient();
  const uppyRef = useRef<Uppy<any, Record<string, never>> | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
    (localStorage.getItem("preferredCamera") as 'user' | 'environment') || 'environment'
  );
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [processedFiles, setProcessedFiles] = useState<Set<string>>(new Set());


  // Initialize Uppy
  useEffect(() => {
    const uppy = createOptimizedUppy({ folderId });

    uppy.use(XHRUpload, {
      endpoint: "/api/upload",
      method: "POST",
      formData: true,
      fieldName: "file",
      bundle: false,
      headers: {
        "x-folder-id": folderId || "",
      },
      limit: 14,
    });

    // Configure Webcam
    const webcamPlugin = uppy.use(Webcam, {
      onBeforeSnapshot: () => Promise.resolve(),
      countdown: false,
      modes: ["video-audio", "video-only", "audio-only", "picture"],
      mirror: facingMode === "user",
      videoConstraints: {
        facingMode: facingMode,
        width: { min: 720, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 },
      },
      showVideoSourceDropdown: true,
    });

    if (webcamPlugin && typeof webcamPlugin.on === "function") {
      webcamPlugin.on("error", (error: any) => {
        const errorMsg = `Camera error: ${error.message}`;
        setCameraError(errorMsg);
       console.error("Webcam error:", error);
      });
    }

    // Add optimization preprocessor
    uppy.addPreProcessor(async (fileIDs) => {
      const optimizationPromises = fileIDs.map(async (fileID) => {
        const file = uppy.getFile(fileID);

        if (file?.type?.startsWith("image/")) {
          try {
            let optimizedFile = await smartCompress(file.data as File);
            if (!optimizedFile || optimizedFile.size === 0) {
              console.warn("Optimization failed for", file.name, "- using original");
              return;
            }

            const webpFile = await convertToWebP(optimizedFile);
            if (webpFile.size < optimizedFile.size) {
              optimizedFile = webpFile;
            }

            if (optimizedFile.type === "image/jpeg") {
              optimizedFile = await createProgressiveJPEG(optimizedFile);
            }

            if (optimizedFile.size > 0) {
              uppy.setFileState(fileID, {
                data: optimizedFile,
                size: optimizedFile.size,
              });

              console.log(
                `Optimized ${file.name}: ${((file.size ?? 0) / 1024 / 1024).toFixed(2)}MB → ${(optimizedFile.size / 1024 / 1024).toFixed(2)}MB`,
              );
            }
          } catch (error) {
            console.warn(`Failed to optimize ${file.name}:`, error);
            uppy.setFileState(fileID, {
              data: file.data,
              size: file.size,
            });
          }
        }
      });

      await Promise.all(optimizationPromises);
    });

    // Event handlers
    uppy.on("upload", () => {
      setIsUploading(true);
      setCameraError(null);
    });

    uppy.on("upload-success", async (file, response) => {
      try {
       if (!file || processedFiles.has(file.id)) return;
        setProcessedFiles((prev) => new Set([...prev, file.id]));

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          throw new Error("User not authenticated");
        }

        if (!response.body?.public_id) {
          console.error("Missing public_id in response:", {
            file: file.name,
            response: response.body,
          });
          setError("Upload response is missing public_id.");
          return;
        }

        if (!file.name) {
          throw new Error("File name is required");
        }

        const fileData = {
          user_id: userData.user.id,
          file_name: file.name,
          file_type: file.type || 'application/octet-stream',
          file_size: file.size?.toString() || '0', // Convert to string
          file_route: response.body.public_id,
          file_url: response.body.secure_url || "",
          folder_id: folderId || null,
        };

        try {
          await uploadFile(fileData);
          setUploadedFiles((prev) => [...prev, response.body]);
          setRefresh((prev) => !prev);
        } catch (error) {
          console.error("Error saving file to database:", error);
          setError(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setProcessedFiles((prev) => {
            const newSet = new Set(prev);
            newSet.delete(file.id);
            return newSet;
          });
        }
      } catch (err: any) {
        console.error("Upload success handler error:", err);
        setError(err.message);
        if (file) {
          setProcessedFiles((prev) => {
            const newSet = new Set(prev);
            newSet.delete(file.id);
            return newSet;
          });
        }
      }
    });

    uppy.on("upload-error", (file, error) => {
     console.error("Upload error:", error);
      setError(`Upload failed: ${error.message}`);
      setIsUploading(false);
    });

   uppy.on("complete", (result) => {
      console.log("Upload complete:", result);
      setIsUploading(false);
      if ((result.successful ?? []).length > 0) {
        setError(null);
        setSelectedFiles([]);
        setTimeout(() => setProcessedFiles(new Set()), 1000);
      }
    });

    uppy.on("file-added", (file) => {
      uppy.setFileMeta(file.id, { folderId });
      setSelectedFiles(prev => [
        ...prev.filter(f => f.id !== file.id),
        {
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
        },
      ]);
    });

    uppy.on("file-removed", (file) => {
      setSelectedFiles((prev) => prev.filter((f) => f.id !== file.id));
    });

    uppyRef.current = uppy;

    return () => {
      uppy.destroy();
      uppyRef.current = null;
    };
  }, [folderId, supabase, facingMode, processedFiles]);



  const handleStartUpload = () => {
    if (!folderId) {
      setError("Please select a folder first.");
      return;
    }

    if (!selectedFiles.length) {
      setError("Please select files to upload first.");
      return;
    }

    uppyRef.current?.upload();
  };

  const toggleCamera = () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
    localStorage.setItem("preferredCamera", newMode);

    if (uppyRef.current) {
      const webcamPlugin = uppyRef.current.getPlugin("Webcam");
      if (webcamPlugin) {
        webcamPlugin.setOptions({
          mirror: newMode === "user",
          facingMode: newMode,
        });
      }
    }
  };

  const toggleCameraActive = () => {
    setIsCameraActive(!isCameraActive);
  };

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