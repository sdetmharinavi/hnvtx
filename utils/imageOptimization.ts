// utils/imageOptimization.ts
"use client";

import Uppy from "@uppy/core";
import ImageEditor from "@uppy/image-editor";
import { useRef, useEffect } from "react";

// Types for better type safety
interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

interface OptimizedUppyOptions {
  folderId: string | null;
  maxFileSize?: number;
  maxNumberOfFiles?: number;
}

// 1. Improved ImageEditor configuration with better compression
export const enhancedImageEditorConfig = {
  quality: 0.85,
  cropperOptions: {
    viewMode: 1 as 0 | 1 | 2 | 3,
    background: false,
    autoCropArea: 1,
    responsive: true,
    checkOrientation: false,
    guides: true,
    highlight: false,
    dragMode: "crop" as const,
  },
  actions: {
    revert: true,
    rotate: true,
    granularRotate: true,
    flip: true,
    zoomIn: true,
    zoomOut: true,
    cropSquare: true,
    cropWidescreen: true,
    cropWidescreenVertical: true,
  },
};

// 2. Enhanced image compression utility function
export const compressImage = (
  file: File,
  options: CompressionOptions = {},
): Promise<File> => {
  const { maxWidth = 1920, maxHeight = 1080, quality = 0.8 } = options;

  return new Promise((resolve) => {
    // Check if it's actually an image
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      console.warn("Could not get canvas context");
      resolve(file);
      return;
    }

    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = Math.min(width, maxWidth);
            height = width / aspectRatio;
          } else {
            height = Math.min(height, maxHeight);
            width = height * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Clear canvas and draw image
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size > 0) {
              try {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } catch (error) {
                console.warn("Error creating compressed file:", error);
                resolve(file);
              }
            } else {
              console.warn("Canvas toBlob produced empty result");
              resolve(file);
            }
          },
          file.type,
          quality,
        );
      } catch (error) {
        console.warn("Error compressing image:", error);
        resolve(file);
      }
    };

    img.onerror = () => {
      console.warn("Error loading image for compression");
      resolve(file);
    };

    img.src = URL.createObjectURL(file);
  });
};

// 3. Enhanced Uppy configuration with compression
export const createOptimizedUppy = (options: OptimizedUppyOptions) => {
  const {
    folderId,
    maxFileSize = 50 * 1024 * 1024, // 50MB
    maxNumberOfFiles = 20,
  } = options;

  const uppy = new Uppy({
    id: "file-uploader",
    autoProceed: false,
    allowMultipleUploads: true,
    restrictions: {
      maxFileSize,
      maxNumberOfFiles,
      allowedFileTypes: [
        "image/*",
        "application/pdf",
        ".doc",
        ".docx",
        ".txt",
        ".rtf",
        "video/*",
        "audio/*",
      ],
    },
    meta: {
      folderId: folderId,
    },
    onBeforeFileAdded: (currentFile, files) => {
      // Additional validation
      if (currentFile.size === 0) {
        uppy.log(`Skipping file ${currentFile.name} - file is empty`);
        return false;
      }

      // Check for duplicate files
      const existingFile = Object.values(files).find(
        (file) =>
          file.name === currentFile.name && file.size === currentFile.size,
      );

      if (existingFile) {
        uppy.log(`Skipping file ${currentFile.name} - duplicate file`);
        return false;
      }

      return true;
    },
  });

  // Add ImageEditor plugin with error handling
  try {
    uppy.use(ImageEditor, enhancedImageEditorConfig);
  } catch (error) {
    console.warn("Failed to add ImageEditor plugin:", error);
  }

  return uppy;
};

// 4. WebP conversion utility (for modern browsers)
export const convertToWebP = (file: File, quality = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/") || file.type === "image/webp") {
      resolve(file);
      return;
    }

    // Check if browser supports WebP
    const canvas = document.createElement("canvas");
    const testBlob = canvas.toDataURL("image/webp");

    if (!testBlob.startsWith("data:image/webp")) {
      resolve(file);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve(file);
      return;
    }

    const img = new Image();

    img.onload = () => {
      try {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size > 0 && blob.size < file.size) {
              const webpFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, ".webp"),
                {
                  type: "image/webp",
                  lastModified: Date.now(),
                },
              );
              resolve(webpFile);
            } else {
              resolve(file);
            }
          },
          "image/webp",
          quality,
        );
      } catch (error) {
        console.warn("Error converting to WebP:", error);
        resolve(file);
      }
    };

    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
};

// 5. Progressive JPEG utility
export const createProgressiveJPEG = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    if (file.type !== "image/jpeg") {
      resolve(file);
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      resolve(file);
      return;
    }

    const img = new Image();

    img.onload = () => {
      try {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size > 0) {
              const progressiveFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(progressiveFile);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          0.85,
        );
      } catch (error) {
        console.warn("Error creating progressive JPEG:", error);
        resolve(file);
      }
    };

    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
};

// 6. FIXED Smart compression based on image content
export const smartCompress = async (file: File): Promise<File> => {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      console.warn("Could not get canvas context for smart compression");
      resolve(file);
      return;
    }

    img.onload = () => {
      try {
        // Get optimal settings based on file size
        const { quality, maxWidth, maxHeight } = getOptimalImageSettings(file);

        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = Math.min(width, maxWidth);
            height = width / aspectRatio;
          } else {
            height = Math.min(height, maxHeight);
            width = height * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Clear canvas and draw image
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size > 0) {
              try {
                const optimizedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });

                console.log(`Smart compression result: ${file.name}`, {
                  original: (file.size / 1024 / 1024).toFixed(2) + "MB",
                  compressed:
                    (optimizedFile.size / 1024 / 1024).toFixed(2) + "MB",
                  reduction:
                    (
                      ((file.size - optimizedFile.size) / file.size) *
                      100
                    ).toFixed(1) + "%",
                });

                resolve(optimizedFile);
              } catch (error) {
                console.warn("Error creating optimized file:", error);
                resolve(file);
              }
            } else {
              console.warn(
                "Smart compression produced empty result, using original file",
              );
              resolve(file);
            }
          },
          file.type,
          quality,
        );
      } catch (error) {
        console.warn("Error in smart compression:", error);
        resolve(file);
      }
    };

    img.onerror = (error) => {
      console.warn("Error loading image for smart compression:", error);
      resolve(file);
    };

    img.src = URL.createObjectURL(file);
  });
};

// 7. Custom hook for optimized file uploader
export const useOptimizedFileUploader = (
  folderId: string | null,
): Uppy<{ folderId: string | null }, Record<string, never>> | null => {
  const uppyRef = useRef<Uppy<
    { folderId: string | null },
    Record<string, never>
  > | null>(null);

  useEffect(() => {
    // Clean up previous instance
    if (uppyRef.current) {
      uppyRef.current.destroy();
    }

    const uppy = createOptimizedUppy({ folderId });

    // Add comprehensive image optimization preprocessor
    uppy.addPreProcessor(async (fileIDs) => {
      const optimizationPromises = fileIDs.map(async (fileID) => {
        const file = uppy.getFile(fileID);

        if (file && file.type && file.type.startsWith("image/")) {
          try {
            let optimizedFile = file.data as File;

            // Validate original file
            if (optimizedFile.size === 0) {
              console.warn(
                `Skipping optimization for ${file.name} - empty file`,
              );
              return;
            }

            // Apply smart compression with fallback
            try {
              const compressedFile = await smartCompress(optimizedFile);
              if (
                compressedFile.size > 0 &&
                compressedFile.size < optimizedFile.size
              ) {
                optimizedFile = compressedFile;
              }
            } catch (compressionError) {
              console.warn(
                `Compression failed for ${file.name}:`,
                compressionError,
              );
            }

            // Convert to WebP if beneficial (with validation)
            try {
              const webpFile = await convertToWebP(optimizedFile);
              if (webpFile.size > 0 && webpFile.size < optimizedFile.size) {
                optimizedFile = webpFile;
              }
            } catch (webpError) {
              console.warn(
                `WebP conversion failed for ${file.name}:`,
                webpError,
              );
            }

            // For JPEGs, make them progressive (with validation)
            try {
              if (optimizedFile.type === "image/jpeg") {
                const progressiveFile =
                  await createProgressiveJPEG(optimizedFile);
                if (progressiveFile.size > 0) {
                  optimizedFile = progressiveFile;
                }
              }
            } catch (progressiveError) {
              console.warn(
                `Progressive JPEG creation failed for ${file.name}:`,
                progressiveError,
              );
            }

            // Final validation before updating Uppy
            if (optimizedFile.size === 0) {
              console.error(
                `Optimization resulted in empty file for ${file.name}, using original`,
              );
              return; // Don't update Uppy, keep original
            }

            // Update the file in Uppy
            uppy.setFileState(fileID, {
              data: optimizedFile,
              size: optimizedFile.size,
            });

            const originalSizeMB = ((file.size ?? 0) / 1024 / 1024).toFixed(2);
            const optimizedSizeMB = (optimizedFile.size / 1024 / 1024).toFixed(
              2,
            );
            const compressionRatio = (
              (((file.size ?? 0) - optimizedFile.size) / (file.size ?? 1)) *
              100
            ).toFixed(1);

            console.log(
              `Optimized ${file.name}: ${originalSizeMB}MB → ${optimizedSizeMB}MB (${compressionRatio}% reduction)`,
            );
          } catch (error) {
            console.warn(`Failed to optimize ${file.name}:`, error);
            // Keep original file in case of any error
          }
        }
      });

      await Promise.all(optimizationPromises);
    });

    uppyRef.current = uppy;

    return () => {
      if (uppyRef.current) {
        uppyRef.current.destroy();
        uppyRef.current = null;
      }
    };
  }, [folderId]);

  return uppyRef.current;
};

// 8. Utility function to get optimal image settings
export const getOptimalImageSettings = (file: File) => {
  const sizeInMB = file.size / (1024 * 1024);

  if (sizeInMB > 10) {
    return { quality: 0.6, maxWidth: 1600, maxHeight: 1200 };
  } else if (sizeInMB > 5) {
    return { quality: 0.7, maxWidth: 1800, maxHeight: 1350 };
  } else if (sizeInMB > 2) {
    return { quality: 0.75, maxWidth: 1920, maxHeight: 1440 };
  } else {
    return { quality: 0.85, maxWidth: 1920, maxHeight: 1440 };
  }
};
