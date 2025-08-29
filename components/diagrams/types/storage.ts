export interface StoredFile {
  name: string;
  size: number;
  type: string;
  url: string;
  path?: string;
  uploadedAt: string;
}

export interface UploadProgress {
  [key: number]: number;
}

export interface StorageManagerProps {
  bucketName?: string;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  onUploadComplete?: (files: StoredFile[]) => void;
  onError?: (error: string) => void;
}

export interface SupabaseStorageError {
  error: string;
  message: string;
  statusCode?: string;
}

