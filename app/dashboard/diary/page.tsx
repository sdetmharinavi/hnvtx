// app/dashboard/diary/page.tsx
'use client';

import { useMemo, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { FiBookOpen, FiUpload, FiCalendar, FiPrinter } from 'react-icons/fi';
import { toast } from 'sonner';
import { useDebounce } from 'use-debounce';
import { v4 as uuidv4 } from 'uuid';

import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ConfirmModal, ErrorDisplay, Button, PageSpinner } from '@/components/common/ui';
import { DiaryEntryCard } from '@/components/diary/DiaryEntryCard';
import { DiaryCalendar } from '@/components/diary/DiaryCalendar';
import { Diary_notesRowSchema, Diary_notesInsertSchema } from '@/schemas/zod-schemas';
import { useAuthStore } from '@/stores/authStore';
import { useUser } from '@/providers/UserProvider';
import { useDiaryExcelUpload } from '@/hooks/database/excel-queries/useDiaryExcelUpload';
import { buildUploadConfig } from '@/constants/table-column-keys';
import { createClient } from '@/utils/supabase/client';
import { useDeleteManager } from '@/hooks/useDeleteManager';
import { useTableInsert, useTableUpdate } from '@/hooks/database';
import { useDiaryData } from '@/hooks/data/useDiaryData';
import { UserRole } from '@/types/user-roles';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { localDb } from '@/hooks/data/localDb';
import { addMutationToQueue } from '@/hooks/data/useMutationQueue';
import { GenericFilterBar } from '@/components/common/filters/GenericFilterBar'; // IMPORT
import { useDataSync } from '@/hooks/data/useDataSync';

const DiaryFormModal = dynamic(
  () => import('@/components/diary/DiaryFormModal').then((mod) => mod.DiaryFormModal),
  { loading: () => <PageSpinner text='Loading Form...' /> },
);

type ViewMode = 'day' | 'feed';

export default function DiaryPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  // We'll map "grid" to "day" and "table" to "feed" for the generic bar
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebounce(searchQuery, 300);

  const { sync: syncData } = useDataSync();
  const isOnline = useOnlineStatus();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Diary_notesRowSchema | null>(null);

  const { user } = useAuthStore();
  const { role: currentUserRole, isSuperAdmin } = useUser();
  const supabase = createClient();

  const {
    data: allNotesForMonth = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useDiaryData(currentDate);

  const canViewAll =
    isSuperAdmin ||
    [UserRole.ADMIN, UserRole.ADMINPRO, UserRole.VIEWER].includes(currentUserRole as UserRole);
  const canEdit =
    isSuperAdmin || currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.ADMINPRO;
  const canDelete = isSuperAdmin === true || currentUserRole === UserRole.ADMINPRO;

  const filteredNotes = useMemo(() => {
    let notes = canViewAll
      ? allNotesForMonth
      : allNotesForMonth.filter((note) => note.user_id === user?.id);

    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      notes = notes.filter(
        (note) =>
          (note.content?.toLowerCase() || '').includes(query) ||
          (note.tags && note.tags.some((tag: string) => tag.toLowerCase().includes(query))),
      );
    }

    if (viewMode === 'day' && !debouncedSearch) {
      const selectedDateString = `${selectedDate.getFullYear()}-${String(
        selectedDate.getMonth() + 1,
      ).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      notes = notes.filter((note) => note.note_date === selectedDateString);
    }

    return notes;
  }, [allNotesForMonth, canViewAll, user?.id, debouncedSearch, viewMode, selectedDate]);

  const { mutate: insertNote, isPending: isInserting } = useTableInsert(supabase, 'diary_notes', {
    onSuccess: () => {
      toast.success('Note created successfully!');
      refetch();
      setIsFormOpen(false);
    },
    onError: (err) => toast.error(`Failed to create note: ${err.message}`),
  });

  const { mutate: updateNote, isPending: isUpdating } = useTableUpdate(supabase, 'diary_notes', {
    onSuccess: () => {
      toast.success('Note updated successfully!');
      refetch();
      setIsFormOpen(false);
    },
    onError: (err) => toast.error(`Failed to update note: ${err.message}`),
  });

  const deleteManager = useDeleteManager({
    tableName: 'diary_notes',
    onSuccess: () => {
      refetch();
    },
  });

  const isMutating = isInserting || isUpdating || deleteManager.isPending;

  const openAddModal = () => {
    setEditingNote(null);
    setIsFormOpen(true);
  };
  const openEditModal = (note: Diary_notesRowSchema) => {
    setEditingNote(note);
    setIsFormOpen(true);
  };
  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingNote(null);
  };

  const handleSaveNote = async (data: Diary_notesInsertSchema) => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    const payload = { ...data, user_id: user.id };

    if (isOnline) {
      if (editingNote) {
        updateNote({ id: editingNote.id, data: payload });
      } else {
        insertNote(payload);
      }
    } else {
      try {
        if (editingNote) {
          await localDb.diary_notes.update(editingNote.id, payload);
          await addMutationToQueue({
            tableName: 'diary_notes',
            type: 'update',
            payload: { id: editingNote.id, data: payload },
          });
          toast.success('Note updated (Offline Mode). Will sync later.');
        } else {
          const tempId = uuidv4();
          const newRecord = { ...payload, id: tempId, created_at: new Date().toISOString() };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await localDb.diary_notes.add(newRecord as any);
          await addMutationToQueue({
            tableName: 'diary_notes',
            type: 'insert',
            payload: newRecord,
          });
          toast.success('Note created (Offline Mode). Will sync later.');
        }
        setIsFormOpen(false);
        refetch();
      } catch (e) {
        console.error('Offline save failed', e);
        toast.error('Failed to save offline note.');
      }
    }
  };

  const { mutate: uploadDiaryNotes, isPending: isUploading } = useDiaryExcelUpload();

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user?.id) {
      const uploadConfig = buildUploadConfig('diary_notes');
      uploadDiaryNotes({
        file,
        columns: uploadConfig.columnMapping,
        currentUserId: user.id,
        currentUserRole,
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const highlightedDates = useMemo(() => {
    return (allNotesForMonth || []).map((note) => {
      const [y, m, d] = note.note_date!.split('-').map(Number);
      return new Date(y, m - 1, d);
    });
  }, [allNotesForMonth]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setViewMode('day');
    if (
      date.getMonth() !== currentDate.getMonth() ||
      date.getFullYear() !== currentDate.getFullYear()
    ) {
      setCurrentDate(date);
    }
  };

  const handleMonthChange = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  const jumpToToday = () => {
    const now = new Date();
    setSelectedDate(now);
    setCurrentDate(now);
    setViewMode('day');
  };

  const headerActions = useStandardHeaderActions({
    data: allNotesForMonth,
    onRefresh: async () => {
      // ADDED: Conditional Granular Sync
      if (isOnline) {
        await syncData(['diary_notes']);
      }
      refetch();
      toast.success('Diary refreshed!');
    },
    onAddNew: canEdit ? openAddModal : undefined,
    isLoading,
    isFetching: isFetching,
    exportConfig: canEdit ? { tableName: 'diary_notes', fileName: 'my_diary_notes' } : undefined,
  });

  if (canEdit) {
    headerActions.splice(1, 0, {
      label: isUploading ? 'Uploading...' : 'Upload',
      onClick: handleUploadClick,
      variant: 'outline',
      leftIcon: <FiUpload />,
      disabled: isUploading || isLoading,
      hideTextOnMobile: true,
    });
  }

  const handlePrintFeed = () => {
    window.print();
  };

  if (error)
    return (
      <ErrorDisplay
        error={error.message}
        actions={[{ label: 'Retry', onClick: () => refetch(), variant: 'primary' }]}
      />
    );

  const selectedDateString = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Map generic view modes back to domain-specific modes
  const handleViewModeChange = (mode: 'grid' | 'table') => {
    setViewMode(mode === 'grid' ? 'day' : 'feed');
  };
  const genericViewMode = viewMode === 'day' ? 'grid' : 'table';

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'>
      <div className='mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
        <input
          type='file'
          ref={fileInputRef}
          onChange={handleFileChange}
          className='hidden'
          accept='.xlsx, .xls, .csv'
        />

        <div className='mb-6'>
          <PageHeader
            title='Log Book'
            description='Daily maintenance logs and event tracking.'
            icon={<FiBookOpen />}
            stats={[{ value: allNotesForMonth.length, label: 'Total This Month' }]}
            actions={headerActions}
            isLoading={isLoading}
            isFetching={isFetching}
          />
        </div>

        <div className='grid grid-cols-1 xl:grid-cols-12 gap-6'>
          {/* Calendar Sidebar */}
          <div className='xl:col-span-4 space-y-6'>
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden relative'>
              <div className='p-4'>
                <DiaryCalendar
                  selectedDate={selectedDate}
                  onDateChange={handleDateChange}
                  onMonthChange={handleMonthChange}
                  highlightedDates={highlightedDates}
                />
              </div>
              <div className='absolute top-4 right-4 z-20'>
                <Button size='xs' variant='ghost' onClick={jumpToToday} title='Jump to Today'>
                  Today
                </Button>
              </div>
            </div>

            <div className='hidden xl:block bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800'>
              <h4 className='font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2'>
                <FiCalendar /> Usage Tips
              </h4>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                Use the calendar to filter entries by specific dates. Switch to &quot;Feed&quot;
                view to see all activities for the current month in chronological order.
              </p>
            </div>
          </div>

          {/* Main Content Area */}
          <div className='xl:col-span-8 space-y-6'>
            {/* REUSABLE FILTER BAR */}
            <GenericFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder='Search logs or tags...'
              filters={{}} // No dropdowns
              onFilterChange={() => {}}
              filterConfigs={[]} // No configs
              viewMode={genericViewMode} // mapped
              onViewModeChange={handleViewModeChange}
              extraActions={
                viewMode === 'feed' ? (
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={handlePrintFeed}
                    leftIcon={<FiPrinter className='w-4 h-4' />}
                    title="Print this month's feed"
                  >
                    Print
                  </Button>
                ) : null
              }
            />

            {/* List Header */}
            <div className={viewMode === 'feed' ? 'printable-content' : ''}>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2'>
                  {debouncedSearch ? (
                    <>Search Results ({filteredNotes.length})</>
                  ) : viewMode === 'day' ? (
                    <>{selectedDateString}</>
                  ) : (
                    <>
                      Activity Feed for{' '}
                      {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </>
                  )}
                </h2>
                {!debouncedSearch && viewMode === 'day' && (
                  <span className='text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full'>
                    {filteredNotes.length} entries
                  </span>
                )}
              </div>

              {/* Entries List */}
              {filteredNotes.length === 0 ? (
                <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden'>
                  <div className='text-center py-12 px-4'>
                    <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 mb-4'>
                      <FiBookOpen className='h-8 w-8 text-blue-400' />
                    </div>
                    <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
                      {debouncedSearch ? 'No matching notes found' : 'No entries found'}
                    </h3>
                    <p className='text-sm text-gray-500 max-w-sm mx-auto mb-6'>
                      {debouncedSearch
                        ? 'Try different keywords or tags.'
                        : 'No logs recorded for this selection. Create a new entry to get started.'}
                    </p>
                    {canEdit && !debouncedSearch && viewMode === 'day' && (
                      <button
                        onClick={openAddModal}
                        className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30'
                      >
                        Create Entry
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className='grid gap-4'>
                  {filteredNotes.map((note) => (
                    <DiaryEntryCard
                      key={note.id}
                      entry={note}
                      onEdit={openEditModal}
                      onDelete={(item) => deleteManager.deleteSingle(item)}
                      canEdit={canEdit}
                      canDelete={canDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isFormOpen && (
        <DiaryFormModal
          isOpen={isFormOpen}
          onClose={closeFormModal}
          editingNote={editingNote}
          onSubmit={handleSaveNote}
          isLoading={isMutating}
          selectedDate={selectedDate}
        />
      )}

      <ConfirmModal
        isOpen={deleteManager.isConfirmModalOpen}
        onConfirm={deleteManager.handleConfirm}
        onCancel={deleteManager.handleCancel}
        title='Confirm Deletion'
        message={deleteManager.confirmationMessage}
        loading={deleteManager.isPending}
        type='danger'
      />
    </div>
  );
}
