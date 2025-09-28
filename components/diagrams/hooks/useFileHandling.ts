// hooks/useFileHandling.ts
import { useCallback, useRef } from 'react';
import { AppUppy } from './useUppyUploader';

export function useFileHandling(uppyRef: React.RefObject<AppUppy | null>) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && uppyRef.current) {
      Array.from(files).forEach((file) => {
        uppyRef.current?.addFile({
          name: file.name,
          type: file.type,
          data: file,
          source: "file-input",
          isRemote: false,
        });
      });
      event.target.value = '';
    }
  }, [uppyRef]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemoveFile = useCallback((fileId: string) => {
    uppyRef.current?.removeFile(fileId);
  }, [uppyRef]);

  return {
    fileInputRef,
    handleFileInputChange,
    triggerFileInput,
    handleRemoveFile
  };
}