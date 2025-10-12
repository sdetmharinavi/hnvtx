// hooks/data/useMutationQueue.ts
import { useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { localDb, MutationTask } from '@/data/localDb';
import { createClient } from '@/utils/supabase/client';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

/**
 * A hook that manages an offline mutation queue. It automatically processes
 * pending tasks when the application comes online.
 */
export function useMutationQueue() {
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const supabase = createClient();
  const isProcessing = useRef(false); // Lock to prevent concurrent processing

  // useLiveQuery will re-render the component whenever the pending tasks change
  const pendingTasks = useLiveQuery(() =>
    localDb.mutation_queue.where('status').anyOf('pending', 'failed').toArray(),
    []
  );

  const processQueue = async () => {
    if (isProcessing.current || !pendingTasks || pendingTasks.length === 0) {
      return;
    }

    isProcessing.current = true;
    toast.info(`Syncing ${pendingTasks.length} offline change(s)...`, { id: 'mutation-sync' });

    for (const task of pendingTasks) {
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

        if (error) {
          throw error;
        }

        // On success, remove the task from the queue
        await localDb.mutation_queue.delete(task.id!);
        console.log(`✅ [Queue] Processed task #${task.id} (${task.type} on ${task.tableName})`);

      } catch (err) {
        console.error(`❌ [Queue] Failed to process task #${task.id}:`, err);
        await localDb.mutation_queue.update(task.id!, {
          status: 'failed',
          attempts: (task.attempts || 0) + 1,
          error: (err as Error).message,
        });
      }
    }
    
    toast.success("Offline changes synced successfully!", { id: 'mutation-sync' });
    isProcessing.current = false;
    
    // Invalidate all queries to refetch fresh data after sync
    await queryClient.invalidateQueries();
  };
  
  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, pendingTasks]); // Effect runs when online status changes or when new tasks are added

  return {
    pendingCount: pendingTasks?.length ?? 0,
    processQueue,
  };
}

/**
 * A utility function to add a new task to the mutation queue.
 * This will be called by our data management hooks (e.g., useCrudManager).
 */
export const addMutationToQueue = async (task: Omit<MutationTask, 'id' | 'timestamp' | 'status' | 'attempts'>): Promise<void> => {
  await localDb.mutation_queue.add({
    ...task,
    timestamp: new Date().toISOString(),
    status: 'pending',
    attempts: 0,
  });
  toast.info("Offline. Your change has been saved and will sync when you're back online.");
};