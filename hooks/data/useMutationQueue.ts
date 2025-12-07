// hooks/data/useMutationQueue.ts
import { useEffect, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { localDb, MutationTask } from '@/hooks/data/localDb';
import { createClient } from '@/utils/supabase/client';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function useMutationQueue() {
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const supabase = createClient();
  const isProcessing = useRef(false);

  // Fetch all tasks for the UI list
  const allTasks = useLiveQuery(() => 
    localDb.mutation_queue.orderBy('timestamp').reverse().toArray(),
    []
  );

  const pendingCount = allTasks?.filter(t => t.status === 'pending' || t.status === 'processing').length ?? 0;
  const failedCount = allTasks?.filter(t => t.status === 'failed').length ?? 0;

  const processQueue = useCallback(async () => {
    if (isProcessing.current || !isOnline) return;

    const tasksToProcess = await localDb.mutation_queue
      .where('status').equals('pending')
      .toArray();

    if (tasksToProcess.length === 0) return;

    isProcessing.current = true;
    toast.loading(`Syncing ${tasksToProcess.length} changes...`, { id: 'mutation-sync' });

    for (const task of tasksToProcess) {
      try {
        await localDb.mutation_queue.update(task.id!, { status: 'processing', lastAttempt: new Date().toISOString() });
        let error: Error | null = null;

        switch (task.type) {
          case 'insert':
            ({ error } = await supabase.from(task.tableName).insert(task.payload));
            break;
          case 'update':
            ({ error } = await supabase.from(task.tableName).update(task.payload.data).eq('id', task.payload.id));
            break;
          case 'delete':
            ({ error } = await supabase.from(task.tableName).delete().in('id', task.payload.ids));
            break;
        }

        if (error) throw error;
        
        // Success
        await localDb.mutation_queue.delete(task.id!);
        console.log(`✅ [Queue] Processed task #${task.id}`);

      } catch (err) {
        console.error(`❌ [Queue] Failed task #${task.id}:`, err);
        await localDb.mutation_queue.update(task.id!, {
          status: 'failed',
          attempts: (task.attempts || 0) + 1,
          error: (err as Error).message,
        });
      }
    }
    
    // Check if any failed remaining to update toast state
    const remainingFailed = await localDb.mutation_queue.where('status').equals('failed').count();
    
    if (remainingFailed > 0) {
      toast.error(`${remainingFailed} changes failed to sync. Click the indicator to view details.`, { id: 'mutation-sync' });
    } else {
      toast.success("All changes synced successfully!", { id: 'mutation-sync' });
    }
    
    isProcessing.current = false;
    await queryClient.invalidateQueries();
  }, [isOnline, supabase, queryClient]);

  // Trigger processing when online status changes
  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline, processQueue]);

  // Manual Actions for UI
  const retryTask = async (id: number) => {
    await localDb.mutation_queue.update(id, { status: 'pending', error: undefined });
    processQueue(); // Try immediately
  };

  const removeTask = async (id: number) => {
    await localDb.mutation_queue.delete(id);
    toast.info("Change discarded from queue.");
  };

  return {
    tasks: allTasks || [],
    pendingCount,
    failedCount,
    processQueue,
    retryTask,
    removeTask
  };
}

export const addMutationToQueue = async (task: Omit<MutationTask, 'id' | 'timestamp' | 'status' | 'attempts'>): Promise<void> => {
  await localDb.mutation_queue.add({
    ...task,
    timestamp: new Date().toISOString(),
    status: 'pending',
    attempts: 0,
  });
  toast.info("Offline. Change saved to queue.");
};