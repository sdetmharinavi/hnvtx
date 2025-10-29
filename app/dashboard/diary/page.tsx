// app/dashboard/diary/page.tsx
'use client';

import { useMemo } from 'react';
import { FiBookOpen } from 'react-icons/fi';
import { toast } from 'sonner';

import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ConfirmModal, ErrorDisplay } from '@/components/common/ui';
import { DataQueryHookParams, DataQueryHookReturn, useCrudManager } from '@/hooks/useCrudManager';
import { Diary_notesRowSchema } from '@/schemas/zod-schemas';
import { useAuthStore } from '@/stores/authStore';
import { useOfflineQuery } from '@/hooks/data/useOfflineQuery';
import { localDb } from '@/data/localDb';
import { createClient } from '@/utils/supabase/client';
import { DEFAULTS } from '@/constants/constants';
import { DiaryEntryCard } from '@/components/diary/DiaryEntryCard';
import { DiaryFormModal } from '@/components/diary/DiaryFormModal';

const useDiaryData = (params: DataQueryHookParams): DataQueryHookReturn<Diary_notesRowSchema> => {
  const { currentPage, pageLimit } = params;
  const userId = useAuthStore(state => state.getUserId());

  const onlineQueryFn = async (): Promise<Diary_notesRowSchema[]> => {
    const { data, error } = await createClient()
      .from('diary_notes')
      .select('*')
      .eq('user_id', userId!)
      .order('note_date', { ascending: false });
    if (error) throw error;
    return data || [];
  };

  const offlineQueryFn = async (): Promise<Diary_notesRowSchema[]> => {
    return await localDb.diary_notes.where({ user_id: userId! }).reverse().sortBy('note_date');
  };

  const { data: allNotes = [], isLoading, isFetching, error, refetch } = useOfflineQuery(
    ['diary-notes', userId],
    onlineQueryFn,
    offlineQueryFn,
    { enabled: !!userId, staleTime: DEFAULTS.CACHE_TIME }
  );

  const processedData = useMemo(() => {
    const totalCount = allNotes.length;
    const start = (currentPage - 1) * pageLimit;
    const end = start + pageLimit;
    return {
      data: allNotes.slice(start, end),
      totalCount,
      activeCount: totalCount, // Not applicable for diary
      inactiveCount: 0,
    };
  }, [allNotes, currentPage, pageLimit]);

  const normalizedError = error
    ? error instanceof Error
      ? error
      : new Error(String(error))
    : null;

  return { ...processedData, isLoading, isFetching, error: normalizedError, refetch };
};

export default function DiaryPage() {
  const {
    data: notes,
    totalCount,
    isLoading,
    isMutating,
    refetch,
    pagination,
    editModal,
    deleteModal,
    actions: crudActions,
    error
  } = useCrudManager<'diary_notes', Diary_notesRowSchema>({
    tableName: 'diary_notes',
    dataQueryHook: useDiaryData,
    displayNameField: 'note_date',
  });

  const headerActions = useStandardHeaderActions({
    data: notes,
    onRefresh: async () => { await refetch(); toast.success('Notes refreshed!'); },
    onAddNew: editModal.openAdd,
    isLoading,
    exportConfig: { tableName: 'diary_notes', fileName: 'diary_notes' },
  });

  if (error) return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]} />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="My Diary"
        description="A place for your daily notes and logs."
        icon={<FiBookOpen />}
        stats={[{ value: totalCount, label: 'Total Entries' }]}
        actions={headerActions}
        isLoading={isLoading}
      />

      {isLoading && notes.length === 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
            <FiBookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No diary entries yet</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Click &quot;Add New&quot; to create your first note.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {notes.map(note => (
            <DiaryEntryCard
              key={note.id}
              entry={note}
              onEdit={editModal.openEdit}
              onDelete={crudActions.handleDelete}
            />
          ))}
        </div>
      )}

      <DiaryFormModal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        editingNote={editModal.record}
        onSubmit={crudActions.handleSave}
        isLoading={isMutating}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onConfirm={deleteModal.onConfirm}
        onCancel={deleteModal.onCancel}
        title="Confirm Deletion"
        message={deleteModal.message}
        loading={deleteModal.loading}
        type="danger"
      />
    </div>
  );
}