// hooks/useKmlManager.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface BlobFile {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
  downloadUrl: string;
}

export function useKmlManager() {
  const queryClient = useQueryClient();

  // 1. Fetch List
  const { data: kmlFiles = [], isLoading, error, refetch } = useQuery<BlobFile[]>({
    queryKey: ['kml-files'],
    queryFn: async () => {
      const res = await fetch('/api/kml');
      if (!res.ok) throw new Error('Failed to fetch KML files');
      return res.json();
    },
  });

  // 2. Upload
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const response = await fetch(`/api/kml?filename=${file.name}`, {
        method: 'POST',
        body: file,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      toast.success('KML uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['kml-files'] });
    },
    onError: () => toast.error('Failed to upload KML'),
  });

  // 3. Delete
  const deleteMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch('/api/kml/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) throw new Error('Delete failed');
    },
    onSuccess: () => {
      toast.success('File deleted');
      queryClient.invalidateQueries({ queryKey: ['kml-files'] });
    },
    onError: () => toast.error('Failed to delete file'),
  });

  return {
    kmlFiles,
    isLoading,
    isError: !!error,
    refetch,
    uploadKml: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    deleteKml: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}