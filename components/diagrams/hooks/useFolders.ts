// components/diagrams/hooks/useFolders.ts
"use client";

import { useState, useCallback } from 'react';
import { createClient } from "@/utils/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDeleteFolder, useFoldersList } from '@/hooks/database/file-queries'; 

interface UseFoldersReturn {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  folders: any[];
  folderId: string | null;
  setFolderId: (id: string | null) => void;
  newFolderName: string;
  setNewFolderName: (name: string) => void;
  handleCreateFolder: () => void;
  handleDeleteFolder: (id: string) => void;
  refreshFolders: () => Promise<void>;
  isCreatingFolder: boolean;
  isDeletingFolder: boolean;
  isLoading: boolean;
}

interface UseFoldersProps {
  onError?: (error: string) => void;
  onSuccess?: () => void;
}

export function useFolders({
  onError,
  onSuccess
}: UseFoldersProps = {}): UseFoldersReturn {
  const supabase = createClient();
  const [folderId, setFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const queryClient = useQueryClient();

  // THE FIX: Use the new local-first hook instead of direct useQuery
  const { folders, isLoading, refetch } = useFoldersList();

  // Create folder mutation
  const { mutate: createFolder, isPending: isCreating } = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Not authenticated");
      if (!name.trim()) throw new Error("Folder name cannot be empty");

      const { data, error } = await supabase
        .from("folders")
        .insert({
          user_id: user.id,
          name: name.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setNewFolderName("");
      // Invalidate to update local cache
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error("Create folder error:", error);
      onError?.(error.message);
    },
  });

  const { mutate: deleteFolder, isPending: isDeleting } = useDeleteFolder();

  const handleCreateFolder = useCallback(() => {
    if (newFolderName.trim()) {
      createFolder(newFolderName);
    }
  }, [createFolder, newFolderName]);

  const handleDeleteFolder = useCallback((idToDelete: string) => {
    deleteFolder(idToDelete, {
        onSuccess: () => {
            onSuccess?.();
            if (folderId === idToDelete) {
                setFolderId(null);
            }
        },
        onError: (error) => {
            onError?.(error.message);
        }
    });
  }, [deleteFolder, folderId, onSuccess, onError]);

  const refreshFolders = useCallback(async () => {
    await refetch(); // Use the refetch from useFoldersList
  }, [refetch]);

  return {
    folders,
    folderId,
    setFolderId,
    newFolderName,
    setNewFolderName,
    handleCreateFolder,
    handleDeleteFolder,
    refreshFolders,
    isCreatingFolder: isCreating,
    isDeletingFolder: isDeleting,
    isLoading,
  };
}