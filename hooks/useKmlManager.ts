// hooks/useKmlManager.ts
import { useQuery } from "@tanstack/react-query";

export interface BlobFile {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
  downloadUrl: string;
}

export function useKmlManager() {
  const {
    data: kmlFiles = [],
    isLoading,
    error,
    refetch,
  } = useQuery<BlobFile[]>({
    queryKey: ["kml-files"],
    queryFn: async () => {
      const res = await fetch("/api/kml");
      if (!res.ok) throw new Error("Failed to fetch KML files");
      return res.json();
    },
  });

  return {
    kmlFiles,
    isLoading,
    isError: !!error,
    refetch,
  };
}
