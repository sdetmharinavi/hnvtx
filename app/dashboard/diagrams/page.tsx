// app/dashboard/diagrams/page.tsx
'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Database, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { FileTable } from '@/components/diagrams/FileTable';
import { useFoldersList } from '@/hooks/database/file-queries';
import { PageHeader } from '@/components/common/page-header';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useDataSync } from '@/hooks/data/useDataSync';

export default function DiagramsPage() {
  const queryClient = useQueryClient();
  const [folderId, setFolderId] = useState<string | null>(null);

  const isOnline = useOnlineStatus();
  const { sync: syncData, isSyncing } = useDataSync();

  const { folders, isLoading: isLoadingFolders, refetch: refetchFolders } = useFoldersList();

  const handlePageRefresh = useCallback(async () => {
    if (isOnline) {
      await syncData(['files', 'folders']);
    } else {
      await refetchFolders();
    }
    await queryClient.invalidateQueries({ queryKey: ['files'] });
    toast.success('Refreshed folders and files.');
  }, [isOnline, syncData, refetchFolders, queryClient]);

  return (
    <div className='mx-auto max-w-5xl space-y-6 p-4 sm:p-6'>
      <PageHeader
        title='Diagrams & Files Viewer'
        description='Read-only access to network diagrams, specifications, and documents.'
        icon={<Database className='h-6 w-6' />}
        actions={[
          {
            label: 'Refresh',
            variant: 'outline',
            leftIcon: (
              <RefreshCw
                className={`h-4 w-4 ${isLoadingFolders || isSyncing ? 'animate-spin' : ''}`}
              />
            ),
            onClick: handlePageRefresh,
            disabled: isLoadingFolders || isSyncing,
          },
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
