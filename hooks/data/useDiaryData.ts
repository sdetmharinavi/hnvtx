// hooks/data/useDiaryData.ts
import { useMemo } from 'react';
import { Diary_notesRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { DEFAULTS } from '@/constants/constants';

export type DiaryEntryWithUser = Diary_notesRowSchema & { full_name?: string | null };

export const useDiaryData = (currentDate: Date) => {
  const supabase = createClient();

  const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // Format dates as YYYY-MM-DD
  const startOfMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(startDate.getDate()).padStart(2, '0')}`;

  const endOfMonth = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(endDate.getDate()).padStart(2, '0')}`;

  const {
    data: notes = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['diary_data-for-month', startOfMonth, endOfMonth],
    queryFn: async (): Promise<DiaryEntryWithUser[]> => {
      const { data, error } = await supabase.rpc('get_diary_notes_for_range', {
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
        full_name: entry.full_name // RPC joins this already
      }));
    },
    staleTime: DEFAULTS.CACHE_TIME,
  });

  // Client-side sort by date descending
  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => new Date(b.note_date!).getTime() - new Date(a.note_date!).getTime());
  }, [notes]);

  return {
    data: sortedNotes,
    isLoading,
    isFetching,
    error,
    refetch,
  };
};