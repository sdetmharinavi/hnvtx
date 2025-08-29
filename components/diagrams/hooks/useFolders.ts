// hooks/useFolders.ts
import { useState, useCallback, useEffect } from 'react';
import { createClient } from "@/utils/supabase/client";

interface useFoldersProps {
  refresh: boolean;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
  error?: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useFolders({
  refresh,
  setRefresh,
  error,
  setError
}: useFoldersProps) {
  const supabase = createClient();
  const [folders, setFolders] = useState<any[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");

  const fetchFolders = useCallback(async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return;

    const { data, error } = await supabase
      .from("folders")
      .select("*")
      // .eq("user_id", user.id);

    if (error) {
      console.error("Fetch folders error:", error);
      setError("Failed to load folders");
    } else {
      setFolders(data || []);
    }
  }, [supabase]);

  const refreshFolders = useCallback(async () => {
    fetchFolders();
  }, [fetchFolders, refresh]);

  const handleCreateFolder = useCallback(async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || !newFolderName.trim()) return;

    const { error } = await supabase.from("folders").insert({
      user_id: user.id,
      name: newFolderName.trim(),
    });

    if (error) {
      setError(error.message);
    } else {
      setNewFolderName("");
      setRefresh((prev) => !prev);
    }
  }, [supabase, newFolderName]);

  // Effect to refresh folders when refreshFlag changes
  useEffect(() => {
    refreshFolders();
  }, [refreshFolders, refresh]);

  return {
    folders,
    folderId,
    setFolderId,
    newFolderName,
    setNewFolderName,
    handleCreateFolder,
    refreshFolders,
    error,
    setError
  };
}