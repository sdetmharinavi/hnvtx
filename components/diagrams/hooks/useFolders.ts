// components/diagrams/hooks/useFolders.ts
"use client";

import { useState, useCallback } from 'react';
import { createClient } from "@/utils/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDeleteFolder } from '@/hooks/database/file-queries'; // Import the new hook

interface Folder {
  id: string;
  name: string;
  user_id: string;
  uploaded_at: string;
}

interface UseFoldersReturn {
  folders: Folder[];
  folderId: string | null;
  setFolderId: (id: string | null) => void;
  newFolderName: string;
  setNewFolderName: (name: string) => void;
  handleCreateFolder: () => void;
  handleDeleteFolder: (id: string) => void; // Added
  refreshFolders: () => Promise<void>;
  isCreatingFolder: boolean;
  isDeletingFolder: boolean; // Added
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

  // Fetch folders
  const { data: folders = [], isLoading } = useQuery<Folder[]>({
    queryKey: ['folders'],
    queryFn: async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return [];

      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .order('name');

      if (error) {
        console.error("Fetch folders error:", error);
        onError?.("Failed to load folders");
        return [];
      }
      
      return data || [];
    }
  });

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
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error("Create folder error:", error);
      onError?.(error.message);
    },
  });

  // Added Delete Folder Mutation Wrapper
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
            // If the deleted folder was selected, deselect it
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
    await queryClient.invalidateQueries({ queryKey: ['folders'] });
  }, [queryClient]);

  return {
    folders,
    folderId,
    setFolderId,
    newFolderName,
    setNewFolderName,
    handleCreateFolder,
    handleDeleteFolder, // Return handler
    refreshFolders,
    isCreatingFolder: isCreating,
    isDeletingFolder: isDeleting, // Return state
    isLoading,
  };
}