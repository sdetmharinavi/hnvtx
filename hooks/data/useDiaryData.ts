// hooks/data/useDiaryData.ts
import { useMemo, useCallback } from 'react';
import { Diary_notesRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import { useLiveQuery } from 'dexie-react-hooks';

export type DiaryEntryWithUser = Diary_notesRowSchema & { full_name?: string | null };

/**
 * A local-first data fetching hook for diary entries.
 * Its ONLY responsibility is to fetch all entries for a given month
 * and join them with user information. It performs NO filtering.
 */
export const useDiaryData = (currentDate: Date) => {
  // Create dates in local timezone
  const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // Format dates as YYYY-MM-DD in local timezone
  const startOfMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(startDate.getDate()).padStart(2, '0')}`;
  const endOfMonth = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(endDate.getDate()).padStart(2, '0')}`;

  const onlineQueryFn = useCallback(async (): Promise<Diary_notesRowSchema[]> => {
    const { data, error } = await createClient().rpc('get_diary_notes_for_range', {
      start_date: startOfMonth,
      end_date: endOfMonth,
    });
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((entry: any) => ({
      id: entry.id,
      user_id: entry.user_id,
      note_date: entry.note_date,
      content: entry.content,
      tags: entry.tags,
      created_at: entry.created_at,
      updated_at: entry.updated_at,
    }));
  }, [startOfMonth, endOfMonth]);

  const localQueryFn = useCallback(() => {
    return (
      localDb.diary_notes
        .where('note_date')
        // THE FIX: Pass `true` for both includeLower and includeUpper to ensure the last day of the month is included.
        // Signature: between(lower, upper, includeLower, includeUpper)
        .between(startOfMonth, endOfMonth, true, true)
        .toArray()
    );
  }, [startOfMonth, endOfMonth]);

  const {
    data: notes,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLocalFirstQuery<'diary_notes'>({
    queryKey: ['diary_data-for-month', startOfMonth, endOfMonth],
    onlineQueryFn,
    localQueryFn,
    localQueryDeps: [startOfMonth, endOfMonth],
    dexieTable: localDb.diary_notes,
  });

  const userProfiles = useLiveQuery(() => localDb.user_profiles.toArray(), []);

  const entriesWithUsers = useMemo(() => {
    if (!notes || !userProfiles) return [];

    const profileMap = new Map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userProfiles.map((p: any) => [p.id, `${p.first_name} ${p.last_name}`])
    );

    return notes
      .map((note) => ({
        ...note,
        full_name: profileMap.get(note.user_id) || 'Unknown User',
      }))
      .sort((a, b) => new Date(b.note_date!).getTime() - new Date(a.note_date!).getTime());
  }, [notes, userProfiles]);

  return {
    data: entriesWithUsers,
    isLoading: isLoading || !userProfiles,
    isFetching,
    error,
    refetch,
  };
};
