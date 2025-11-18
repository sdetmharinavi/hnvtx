// hooks/data/useDiaryData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { Diary_notesRowSchema, User_profilesRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import { useUser } from '@/providers/UserProvider';
import { useAuthStore } from '@/stores/authStore';
import { useLiveQuery } from 'dexie-react-hooks';

export type DiaryEntryWithUser = Diary_notesRowSchema & { full_name?: string | null };

/**
 * A local-first data fetching hook for diary entries.
 * It fetches all entries for a given month and joins them with user information.
 */
export const useDiaryData = (
  params: DataQueryHookParams & { currentDate: Date }
): DataQueryHookReturn<DiaryEntryWithUser> => {
  const { currentPage, pageLimit, filters, searchQuery, currentDate } = params;
  const { isSuperAdmin, role } = useUser();
  const userId = useAuthStore(state => state.getUserId());

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split("T")[0];
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split("T")[0];

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
    return localDb.diary_notes
      .where('note_date')
      .between(startOfMonth, endOfMonth)
      .toArray();
  }, [startOfMonth, endOfMonth]);
  
  const {
    data: notesForMonth = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLocalFirstQuery<'diary_notes'>({
    queryKey: ['diary-data', startOfMonth, endOfMonth],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.diary_notes,
  });

  const userProfiles = useLiveQuery(() => localDb.user_profiles.toArray(), []);

  const processedData = useMemo(() => {
    if (!notesForMonth || !userProfiles) {
      return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };
    }
    
    const profileMap = new Map(userProfiles.map(p => [p.id, `${p.first_name} ${p.last_name}`]));

    const allNotes: DiaryEntryWithUser[] = notesForMonth.map(note => ({
      ...note,
      full_name: profileMap.get(note.user_id) || 'Unknown User'
    }));
    
    let roleFiltered = (isSuperAdmin || role === 'admin')
      ? allNotes
      : allNotes.filter(note => note.user_id === userId);

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      roleFiltered = roleFiltered.filter(note => 
        note.content?.toLowerCase().includes(lowerQuery) ||
        note.full_name?.toLowerCase().includes(lowerQuery)
      );
    }
    
    roleFiltered.sort((a, b) => new Date(b.note_date!).getTime() - new Date(a.note_date!).getTime());

    const totalCount = roleFiltered.length;
    
    // THE FIX: The `useCrudManager` was removed from the page, but this hook still needs to return all data for the month
    // so the page component can do the final filtering by `selectedDate`. The pagination logic here was incorrect for this page.
    return {
      data: roleFiltered,
      totalCount,
      activeCount: totalCount,
      inactiveCount: 0,
    };
  }, [notesForMonth, userProfiles, isSuperAdmin, role, userId, searchQuery]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};