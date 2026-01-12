// hooks/data/useMutationQueue.ts
import { useEffect, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { localDb, MutationTask } from '@/hooks/data/localDb';
import { createClient } from '@/utils/supabase/client';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

/**
 * Recursively traverse an object/array and replace all occurrences of `oldId` with `newId`.
 * Used to update foreign keys in pending payloads when a parent record gets a real ID.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function swapIdsInPayload(payload: any, oldId: string, newId: string): any {
  if (typeof payload === 'string') {
    return payload === oldId ? newId : payload;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => swapIdsInPayload(item, oldId, newId));
  }

  if (payload && typeof payload === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newObj: any = {};
    for (const key in payload) {
      newObj[key] = swapIdsInPayload(payload[key], oldId, newId);
    }
    return newObj;
  }

  return payload;
}

export function useMutationQueue() {
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const supabase = createClient();
  const isProcessing = useRef(false);

  // Fetch all tasks for the UI list
  const allTasks = useLiveQuery(
    () => localDb.mutation_queue.orderBy('timestamp').reverse().toArray(),
    []
  );

  const pendingCount =
    allTasks?.filter((t) => t.status === 'pending' || t.status === 'processing').length ?? 0;
  const failedCount = allTasks?.filter((t) => t.status === 'failed').length ?? 0;

  const processQueue = useCallback(async () => {
    if (isProcessing.current || !isOnline) return;

    // Fetch pending tasks ordered by time (FIFO) to ensure parents are created before children
    const tasksToProcess = await localDb.mutation_queue
      .where('status')
      .equals('pending')
      .sortBy('timestamp');

    if (tasksToProcess.length === 0) return;

    isProcessing.current = true;

    // Process sequentially
    for (const task of tasksToProcess) {
      try {
        await localDb.mutation_queue.update(task.id!, {
          status: 'processing',
          lastAttempt: new Date().toISOString(),
        });

        let error: Error | null = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let responseData: any = null;

        // Perform the mutation
        switch (task.type) {
          case 'insert':
            const { data: insertData, error: insertError } = await supabase
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .from(task.tableName as any)
              .insert(task.payload)
              .select()
              .single(); // Get the single created record
            error = insertError;
            responseData = insertData;
            break;

          case 'update':
            const { error: updateError } = await supabase
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .from(task.tableName as any)
              .update(task.payload.data)
              .eq('id', task.payload.id);
            error = updateError;
            break;

          case 'delete':
            const { error: deleteError } = await supabase
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .from(task.tableName as any)
              .delete()
              .in('id', task.payload.ids);
            error = deleteError;
            break;
        }

        if (error) throw error;

        // --- ID SWAPPING LOGIC ---
        // If this was an INSERT and we got a response with an ID
        if (task.type === 'insert' && responseData && responseData.id) {
          const tempId = task.payload.id; // The ID we generated locally
          const realId = responseData.id; // The ID from the server

          // If the server assigned a different ID (it usually does for UUIDs unless we force it)
          if (tempId && tempId !== realId) {
            console.log(`[Queue] Swapping Temp ID ${tempId} -> Real ID ${realId}`);

            // 1. Find all subsequent pending tasks
            const remainingTasks = await localDb.mutation_queue
              .where('status')
              .equals('pending')
              .toArray();

            // 2. Update their payloads
            await localDb.transaction('rw', localDb.mutation_queue, async () => {
              for (const nextTask of remainingTasks) {
                // Skip the current task we just finished
                if (nextTask.id === task.id) continue;

                const newPayload = swapIdsInPayload(nextTask.payload, tempId, realId);

                // Check if anything actually changed to avoid unnecessary DB writes
                if (JSON.stringify(newPayload) !== JSON.stringify(nextTask.payload)) {
                  await localDb.mutation_queue.update(nextTask.id!, {
                    payload: newPayload,
                  });
                  console.log(`   -> Updated dependent task #${nextTask.id}`);
                }
              }
            });
            
            // 3. Update Local DB Record with Real ID
            // We need to delete the old local record (temp ID) and insert the new one (real ID)
            // to keep the local cache consistent with the server until the next full sync.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const table = (localDb as any)[task.tableName];
            if (table) {
                try {
                    await table.delete(tempId);
                    await table.put(responseData);
                } catch(e) {
                    console.warn("Failed to update local cache ID", e);
                }
            }
          }
        }
        // -------------------------

        // Mark as success (delete from queue)
        await localDb.mutation_queue.delete(task.id!);
        // console.log(`✅ [Queue] Processed task #${task.id}`);

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
      toast.error(
        `${remainingFailed} changes failed to sync. Click the indicator to view details.`,
        { id: 'mutation-sync' }
      );
    } else {
      toast.success('Sync complete.', { id: 'mutation-sync' });
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
    toast.info('Change discarded from queue.');
  };

  return {
    tasks: allTasks || [],
    pendingCount,
    failedCount,
    processQueue,
    retryTask,
    removeTask,
  };
}

export const addMutationToQueue = async (
  task: Omit<MutationTask, 'id' | 'timestamp' | 'status' | 'attempts'>
): Promise<void> => {
  await localDb.mutation_queue.add({
    ...task,
    timestamp: new Date().toISOString(),
    status: 'pending',
    attempts: 0,
  });
};