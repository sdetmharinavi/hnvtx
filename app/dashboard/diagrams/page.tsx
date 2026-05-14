// app/dashboard/diagrams/page.tsx
"use client";

import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Database, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { FileTable } from "@/components/diagrams/FileTable";
import { useFoldersList } from "@/hooks/database/file-queries";
import { PageHeader } from "@/components/common/page-header";
import {
  useExportDiagramsBackup,
  useImportDiagramsBackup,
} from "@/hooks/database/excel-queries/useDiagramsBackup";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useDataSync } from "@/hooks/data/useDataSync";
import { useUser } from "@/providers/UserProvider";
import { PERMISSIONS } from "@/config/permissions";

export default function DiagramsPage() {
  const queryClient = useQueryClient();
  const [folderId, setFolderId] = useState<string | null>(null);

  const isOnline = useOnlineStatus();
  const { sync: syncData, isSyncing } = useDataSync();
  const { canAccess } = useUser();
  const canBackup = canAccess(PERMISSIONS.canExportData);

  const {
    folders,
    isLoading: isLoadingFolders,
    refetch: refetchFolders,
  } = useFoldersList();

  // Backup refs
  const backupInputRef = useRef<HTMLInputElement>(null);
  const { mutate: exportBackup, isPending: isBackingUp } =
    useExportDiagramsBackup();
  const { mutate: importBackup, isPending: isRestoring } =
    useImportDiagramsBackup();

  const handleBackupRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) importBackup(file);
    if (backupInputRef.current) backupInputRef.current.value = "";
  };

  const handlePageRefresh = useCallback(async () => {
    if (isOnline) {
      await syncData(["files", "folders"]);
    } else {
      await refetchFolders();
    }
    await queryClient.invalidateQueries({ queryKey: ["files"] });
    toast.success("Refreshed folders and files.");
  }, [isOnline, syncData, refetchFolders, queryClient]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <input
        type="file"
        ref={backupInputRef}
        onChange={handleBackupRestore}
        className="hidden"
        accept=".xlsx"
      />

      <PageHeader
        title="Diagrams & Files Viewer"
        description="Read-only access to network diagrams, specifications, and documents."
        icon={<Database className="h-6 w-6" />}
        actions={[
          {
            label: "Refresh",
            variant: "outline",
            leftIcon: (
              <RefreshCw
                className={`h-4 w-4 ${isLoadingFolders || isSyncing ? "animate-spin" : ""}`}
              />
            ),
            onClick: handlePageRefresh,
            disabled: isLoadingFolders || isSyncing,
          },
          ...(canBackup
            ? [
                {
                  label: "Backup / Restore",
                  variant: "outline" as const,
                  leftIcon: <Download className="h-4 w-4" />,
                  disabled: isBackingUp || isRestoring || isLoadingFolders,
                  "data-dropdown": true,
                  dropdownoptions: [
                    {
                      label: isBackingUp
                        ? "Exporting..."
                        : "Export Full Backup (Excel)",
                      onClick: () => {
                        if (!isOnline)
                          toast.error(
                            "Backup export requires online connection.",
                          );
                        else exportBackup();
                      },
                      disabled: isBackingUp,
                    },
                    {
                      label: isRestoring
                        ? "Restoring..."
                        : "Restore from Backup",
                      onClick: () => {
                        if (!isOnline)
                          toast.error(
                            "Backup restore requires online connection.",
                          );
                        else backupInputRef.current?.click();
                      },
                      disabled: isRestoring,
                    },
                  ],
                },
              ]
            : []),
        ]}
      />

      <FileTable
        folders={folders}
        folderId={folderId}
        onFolderSelect={setFolderId}
        isLoading={isLoadingFolders}
      />
    </div>
  );
}
