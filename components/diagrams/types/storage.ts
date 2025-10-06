// components/diagrams/types/storage.ts
import { z } from 'zod';
import { filesRowSchema } from '@/schemas/zod-schemas';

//  Derive the type from the Zod schema.
export type StoredFile = z.infer<typeof filesRowSchema>;

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

