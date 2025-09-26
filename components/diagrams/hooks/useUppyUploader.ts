// hooks/useUppyUploader.ts
import { useRef, useState, useEffect } from 'react';
import Uppy, { type UppyFile } from '@uppy/core';
import XHRUpload from '@uppy/xhr-upload';
import Webcam from '@uppy/webcam';
import { createClient } from "@/utils/supabase/client";
import { createOptimizedUppy } from "@/utils/imageOptimization";
import { smartCompress, convertToWebP, createProgressiveJPEG } from "@/utils/imageOptimization";
import { useUploadFile } from "@/hooks/database/file-queries";


export interface UploadedFile {
  public_id: string;
  secure_url: string | null | undefined;
  [key: string]: unknown;
}

export interface SelectedFile {
  id: string;
  name: string;
  type: string;
  size: number;
}

type UppyMeta = { folderId: string | null };
type UppyBody = Record<string, never>;
export type AppUppy = Uppy<UppyMeta, UppyBody>;
type AppUppyFile = UppyFile<UppyMeta, UppyBody>;

interface UploadSuccessResponse {
  body?: unknown;
  status: number;
  bytesUploaded?: number;
  uploadURL?: string;
}

const isUploadedFile = (value: unknown): value is UploadedFile => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.public_id === "string";
};

interface UseUppyUploaderProps {
  folderId: string | null;
  // refresh: boolean;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
  // error?: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

interface UseUppyUploaderReturn {
  uppyRef: React.RefObject<AppUppy | null>;
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
  const uppyRef = useRef<AppUppy | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
    (localStorage.getItem("preferredCamera") as 'user' | 'environment') || 'environment'
  );
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [processedFiles, setProcessedFiles] = useState<Set<string>>(new Set());
  const processedFilesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    processedFilesRef.current = processedFiles;
  }, [processedFiles]);

  const addProcessedFile = (fileId: string) => {
    setProcessedFiles((prev) => {
      if (prev.has(fileId)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(fileId);
      processedFilesRef.current = next;
      return next;
    });
  };

  const removeProcessedFile = (fileId: string) => {
    setProcessedFiles((prev) => {
      if (!prev.has(fileId)) {
        return prev;
      }
      const next = new Set(prev);
      next.delete(fileId);
      processedFilesRef.current = next;
      return next;
    });
  };

  const resetProcessedFiles = () => {
    const empty = new Set<string>();
    processedFilesRef.current = empty;
    setProcessedFiles(empty);
  };


  // Initialize Uppy
  useEffect(() => {
    const uppy = createOptimizedUppy({ folderId }) as AppUppy;

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
      },
      showVideoSourceDropdown: true,
    });

    if (webcamPlugin && typeof webcamPlugin.on === "function") {
      webcamPlugin.on("error", (error: unknown) => {
        const message = error instanceof Error ? error.message : "Unknown camera error";
        setCameraError(`Camera error: ${message}`);
        console.error("Webcam error:", error);
      });
    }

    // Add optimization preprocessor
    uppy.addPreProcessor(async (fileIDs) => {
      const optimizationPromises = fileIDs.map(async (fileID) => {
        const file = uppy.getFile(fileID);

        if (file?.type?.startsWith("image/") && file.data instanceof Blob) {
          try {
            const originalName = typeof file.name === "string" && file.name ? file.name : "image-upload";
            const sourceFile =
              file.data instanceof File ? file.data : new File([file.data], originalName, { type: file.type ?? "application/octet-stream" });

            let optimizedFile = await smartCompress(sourceFile);
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

    uppy.on("upload", () => {
      setIsUploading(true);
      setCameraError(null);
    });

    uppy.on("upload-success", async (file: AppUppyFile | undefined, response: UploadSuccessResponse) => {
      try {
        if (!file || processedFilesRef.current.has(file.id)) return;
        addProcessedFile(file.id);

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          throw new Error("User not authenticated");
        }

        const responseBody = response?.body;

        if (!isUploadedFile(responseBody)) {
          console.error("Missing public_id in response:", {
            file: file.name,
            response: responseBody,
          });
          setError("Upload response is missing public_id.");
          return;
        }

        const fileName = typeof file.name === "string" ? file.name : "Unnamed File";

        if (!fileName) {
          throw new Error("File name is required");
        }

        const fileData = {
          user_id: userData.user.id,
          file_name: fileName,
          file_type: typeof file.type === "string" && file.type ? file.type : 'application/octet-stream',
          file_size: typeof file.size === "number" ? file.size.toString() : '0',
          file_route: responseBody.public_id,
          file_url: responseBody.secure_url ?? "",
          folder_id: folderId || null,
        };

        try {
          await uploadFile(fileData);
          setUploadedFiles((prev) => [...prev, responseBody]);
          setRefresh((prev) => !prev);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          console.error("Error saving file to database:", error);
          setError(`Database error: ${message}`);
          removeProcessedFile(file.id);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected error occurred during upload.";
        console.error("Upload success handler error:", error);
        setError(message);
        if (file) {
          removeProcessedFile(file.id);
        }
      }
    });

    uppy.on("upload-error", (_file: AppUppyFile | undefined, error: unknown) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Upload error:", error);
      setError(`Upload failed: ${message}`);
      setIsUploading(false);
    });

    uppy.on("complete", (result: { successful?: unknown[] } | undefined) => {
      console.log("Upload complete:", result);
      setIsUploading(false);
      if (Array.isArray(result?.successful) && result.successful.length > 0) {
        setError(null);
        setSelectedFiles([]);
        setTimeout(() => resetProcessedFiles(), 1000);
      }
    });

    uppy.on("file-added", (file: AppUppyFile) => {
      uppy.setFileMeta(file.id, { folderId });
      setSelectedFiles(prev => [
        ...prev.filter(f => f.id !== file.id),
        {
          id: file.id,
          name: typeof file.name === "string" ? file.name : "Unnamed File",
          type: typeof file.type === "string" && file.type ? file.type : "application/octet-stream",
          size: typeof file.size === "number" ? file.size : 0,
        },
      ]);
    });

    uppy.on("file-removed", (file: AppUppyFile) => {
      setSelectedFiles((prev) => prev.filter((f) => f.id !== file.id));
    });

    uppyRef.current = uppy;

    return () => {
      uppy.destroy();
      uppyRef.current = null;
    };
  }, [folderId, facingMode, setError, setRefresh, uploadFile, supabase]);

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
    setIsCameraActive((prev) => !prev);
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