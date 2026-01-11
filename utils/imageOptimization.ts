// utils/imageOptimization.ts
'use client';

import Uppy from '@uppy/core';
import ImageEditor from '@uppy/image-editor';
import { useRef, useEffect } from 'react';

// --- WORKER IMPLEMENTATION (INLINED) ---
// Defined as a string to avoid complex Webpack/Next.js worker loader configurations.
// Uses OffscreenCanvas for high-performance, non-blocking image processing.
const workerCode = `
self.onmessage = async (e) => {
  const { file, options } = e.data;
  const { maxWidth = 1920, maxHeight = 1080, quality = 0.8 } = options;

  try {
    // 1. Create bitmap from file (highly optimized browser API)
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;

    // 2. Calculate aspect-ratio safe scaling
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

    // 3. Draw to OffscreenCanvas
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get OffscreenCanvas context');

    // High quality smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.drawImage(bitmap, 0, 0, width, height);

    // 4. Compress and convert to Blob
    const blob = await canvas.convertToBlob({
      type: file.type === 'image/png' ? 'image/png' : 'image/jpeg', 
      quality: quality
    });

    // 5. Send result back
    self.postMessage({ success: true, blob });
    
    // Cleanup memory
    bitmap.close();
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};
`;

// --- MAIN THREAD UTILITIES ---

interface OptimizedUppyOptions {
  folderId: string | null;
  maxFileSize?: number;
  maxNumberOfFiles?: number;
}

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
    dragMode: 'crop' as const,
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

/**
 * Utility to determine optimal compression settings based on file size.
 */
export const getOptimalImageSettings = (file: File) => {
  const sizeInMB = file.size / (1024 * 1024);

  // Aggressive compression for very large files
  if (sizeInMB > 10) return { quality: 0.6, maxWidth: 1600, maxHeight: 1200 };
  // Moderate compression for medium files
  if (sizeInMB > 5) return { quality: 0.7, maxWidth: 1800, maxHeight: 1350 };
  // Light compression for typical photos
  return { quality: 0.85, maxWidth: 1920, maxHeight: 1440 };
};

/**
 * Compresses an image using a Web Worker to prevent UI blocking.
 * Falls back to original file if Workers/OffscreenCanvas are not supported.
 */
export const smartCompress = async (file: File): Promise<File> => {
  // Skip non-images or if Worker API is unavailable
  if (!file.type.startsWith('image/') || typeof Worker === 'undefined') {
    return file;
  }

  return new Promise((resolve) => {
    try {
      // Create worker from inline blob
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);

      const options = getOptimalImageSettings(file);

      // Handle worker response
      worker.onmessage = (e) => {
        const { success, blob, error } = e.data;

        if (success && blob) {
          // Log compression stats for debugging
          const reduction = (((file.size - blob.size) / file.size) * 100).toFixed(1);
          console.debug(
            `[SmartCompress] ${file.name}: -${reduction}% (${(blob.size / 1024 / 1024).toFixed(
              2
            )}MB)`
          );

          const optimizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          resolve(optimizedFile);
        } else {
          console.warn('[SmartCompress] Worker failed, using original:', error);
          resolve(file);
        }

        // Cleanup
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
      };

      // Handle worker startup errors
      worker.onerror = (err) => {
        console.error('[SmartCompress] Worker error:', err);
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
        resolve(file);
      };

      // Start the job
      worker.postMessage({ file, options });
    } catch (e) {
      console.error('[SmartCompress] Setup failed:', e);
      resolve(file);
    }
  });
};

/**
 * Creates an Uppy instance configured with restrictions and image editing.
 */
export const createOptimizedUppy = (options: OptimizedUppyOptions) => {
  const {
    folderId,
    maxFileSize = 50 * 1024 * 1024, // 50MB
    maxNumberOfFiles = 20,
  } = options;

  const uppy = new Uppy({
    id: 'file-uploader',
    autoProceed: false,
    allowMultipleUploads: true,
    restrictions: {
      maxFileSize,
      maxNumberOfFiles,
      allowedFileTypes: [
        'image/*',
        'application/pdf',
        '.doc',
        '.docx',
        '.txt',
        '.rtf',
        'video/*',
        'audio/*',
      ],
    },
    meta: {
      folderId: folderId,
    },
    onBeforeFileAdded: (currentFile, files) => {
      if (currentFile.size === 0) return false;

      const existingFile = Object.values(files).find(
        (file) => file.name === currentFile.name && file.size === currentFile.size
      );

      if (existingFile) return false;
      return true;
    },
  });

  try {
    uppy.use(ImageEditor, enhancedImageEditorConfig);
  } catch (error) {
    console.warn('Failed to add ImageEditor plugin:', error);
  }

  return uppy;
};

/**
 * Converts images to WebP format if supported by the browser (Main Thread).
 * This is a secondary optimization step.
 */
export const convertToWebP = (file: File, quality = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    // Skip if not image or already WebP
    if (!file.type.startsWith('image/') || file.type === 'image/webp') {
      resolve(file);
      return;
    }

    // Feature detection
    const canvas = document.createElement('canvas');
    if (!canvas.toDataURL('image/webp').startsWith('data:image/webp')) {
      resolve(file); // Browser doesn't support WebP export
      return;
    }

    const ctx = canvas.getContext('2d');
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
              const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              resolve(webpFile);
            } else {
              // If WebP is larger (rare but possible), keep original
              resolve(file);
            }
          },
          'image/webp',
          quality
        );
      } catch (error) {
        console.warn('WebP conversion failed:', error);
        resolve(file);
      }
    };

    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Placeholder for Progressive JPEG creation.
 * Real progressive encoding requires heavy WASM libraries (mozjpeg).
 * For now, we return the file as-is to avoid client-side bloat.
 */
export const createProgressiveJPEG = (file: File): Promise<File> => {
  return Promise.resolve(file);
};

/**
 * React Hook to manage the Uppy instance lifecycle with optimization pipeline.
 */
export const useOptimizedFileUploader = (
  folderId: string | null
): Uppy<{ folderId: string | null }, Record<string, never>> | null => {
  const uppyRef = useRef<Uppy<{ folderId: string | null }, Record<string, never>> | null>(null);

  useEffect(() => {
    // Cleanup previous instance
    if (uppyRef.current) {
      uppyRef.current.destroy();
    }

    const uppy = createOptimizedUppy({ folderId });

    // Inject Optimization Pipeline
    uppy.addPreProcessor(async (fileIDs) => {
      const optimizationPromises = fileIDs.map(async (fileID) => {
        const file = uppy.getFile(fileID);

        if (file && file.type && file.type.startsWith('image/')) {
          try {
            const rawFile = file.data as File;

            // 1. Off-thread resizing & compression (Web Worker)
            let optimizedFile = await smartCompress(rawFile);

            // 2. WebP Conversion (Optional, main thread)
            // Note: smartCompress output is already good, but WebP might squeeze more
            try {
              const webpFile = await convertToWebP(optimizedFile);
              if (webpFile.size < optimizedFile.size) {
                optimizedFile = webpFile;
              }
            } catch (e) {
              console.warn('WebP step skipped', e);
            }

            // 3. Update Uppy state with optimized file
            uppy.setFileState(fileID, {
              data: optimizedFile,
              size: optimizedFile.size,
            });
          } catch (error) {
            console.error(`Optimization failed for ${file.name}:`, error);
            // On error, Uppy continues with the original file automatically
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
