// app/dashboard/diary/page.tsx
"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { FiBookOpen, FiUpload, FiCalendar } from "react-icons/fi";
import { toast } from "sonner";

import { PageHeader, useStandardHeaderActions } from "@/components/common/page-header";
import { ConfirmModal, ErrorDisplay } from "@/components/common/ui";
import { DiaryEntryCard } from "@/components/diary/DiaryEntryCard";
import { DiaryFormModal } from "@/components/diary/DiaryFormModal";
import { DiaryCalendar } from "@/components/diary/DiaryCalendar";
import { Diary_notesRowSchema, Diary_notesInsertSchema } from "@/schemas/zod-schemas";
import { useAuthStore } from "@/stores/authStore";
import { useUser } from "@/providers/UserProvider";
import { useDiaryExcelUpload } from "@/hooks/database/excel-queries/useDiaryExcelUpload";
import { buildUploadConfig } from "@/constants/table-column-keys";
import { createClient } from "@/utils/supabase/client";
import { useDeleteManager } from "@/hooks/useDeleteManager";
import { useTableInsert, useTableUpdate } from "@/hooks/database";
import { useLocalFirstQuery } from "@/hooks/data/useLocalFirstQuery";
import { localDb } from "@/hooks/data/localDb";

const useDiaryEntries = (currentDate: Date) => {
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

  return useLocalFirstQuery<'diary_notes'>({
    queryKey: ['diary-data-for-month', startOfMonth, endOfMonth],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.diary_notes,
  });
};

export default function DiaryPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Diary_notesRowSchema | null>(null);

  const { user } = useAuthStore();
  const { role: currentUserRole } = useUser();
  const supabase = createClient();

  const { data: notesForMonth = [], isLoading, isFetching, error, refetch } = useDiaryEntries(currentDate);

  console.log(notesForMonth);

  const { mutate: insertNote, isPending: isInserting } = useTableInsert(supabase, 'diary_notes', {
    onSuccess: () => { toast.success('Note created successfully!'); refetch(); setIsFormOpen(false); },
    onError: (err) => toast.error(`Failed to create note: ${err.message}`),
  });

  const { mutate: updateNote, isPending: isUpdating } = useTableUpdate(supabase, 'diary_notes', {
    onSuccess: () => { toast.success('Note updated successfully!'); refetch(); setIsFormOpen(false); },
    onError: (err) => toast.error(`Failed to update note: ${err.message}`),
  });

  const deleteManager = useDeleteManager({ tableName: 'diary_notes', onSuccess: refetch });

  const isMutating = isInserting || isUpdating || deleteManager.isPending;

  const openAddModal = () => { setEditingNote(null); setIsFormOpen(true); };
  const openEditModal = (note: Diary_notesRowSchema) => { setEditingNote(note); setIsFormOpen(true); };
  const closeFormModal = () => { setIsFormOpen(false); setEditingNote(null); };

  const handleSaveNote = (data: Diary_notesInsertSchema) => {
    if (editingNote) {
      updateNote({ id: editingNote.id, data });
    } else {
      insertNote(data);
    }
  };
  
  const { mutate: uploadDiaryNotes, isPending: isUploading } = useDiaryExcelUpload();

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user?.id) {
      const uploadConfig = buildUploadConfig("diary_notes");
      uploadDiaryNotes({
        file,
        columns: uploadConfig.columnMapping,
        currentUserId: user.id,
        currentUserRole,
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const highlightedDates = useMemo(() => {
    return (notesForMonth || []).map((note) => {
      const d = new Date(note.note_date!);
      return new Date(d.valueOf() + d.getTimezoneOffset() * 60 * 1000);
    });
  }, [notesForMonth]);

  // --- THE DEFINITIVE FIX ---
  // Compare the year, month, and day parts of the dates numerically to avoid timezone issues.
  const notesForSelectedDay = useMemo(() => {
    if (!notesForMonth) return [];
    return notesForMonth.filter((note) => {
      // Create a date object from the note's date string, compensating for UTC interpretation.
      const noteDate = new Date(note.note_date!);
      const noteDateUTC = new Date(noteDate.valueOf() + noteDate.getTimezoneOffset() * 60 * 1000);
      
      return (
        noteDateUTC.getFullYear() === selectedDate.getFullYear() &&
        noteDateUTC.getMonth() === selectedDate.getMonth() &&
        noteDateUTC.getDate() === selectedDate.getDate()
      );
    });
  }, [notesForMonth, selectedDate]);
  // --- END FIX ---

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    if (
      date.getMonth() !== currentDate.getMonth() ||
      date.getFullYear() !== currentDate.getFullYear()
    ) {
      setCurrentDate(date);
    }
  };

  const headerActions = useStandardHeaderActions({
    data: notesForMonth,
    onRefresh: async () => { await refetch(); toast.success("Notes refreshed!"); },
    onAddNew: openAddModal,
    isLoading,
    exportConfig: { tableName: "diary_notes", fileName: "my_diary_notes" },
  });

  headerActions.splice(1, 0, {
    label: isUploading ? "Uploading..." : "Upload Notes",
    onClick: handleUploadClick,
    variant: "outline",
    leftIcon: <FiUpload />,
    disabled: isUploading || isLoading,
  });

  if (error)
    return (
      <ErrorDisplay
        error={error.message}
        actions={[{ label: "Retry", onClick: () => refetch(), variant: "primary" }]}
      />
    );

  const selectedDateString = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'>
      <div className='mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
        <input
          type='file'
          ref={fileInputRef}
          onChange={handleFileChange}
          className='hidden'
          accept='.xlsx, .xls, .csv'
        />

        <div className='mb-6 sm:mb-8'>
          <PageHeader
            title='My Diary'
            description='A place for your daily notes and logs.'
            icon={<FiBookOpen />}
            stats={[{ value: notesForMonth.length, label: "Entries This Month" }]}
            actions={headerActions}
            isLoading={isLoading}
            isFetching={isFetching}
          />
        </div>

        <div className='grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 lg:gap-8'>
          <div className='xl:col-span-4'>
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-xl'>
              <div className='p-4 sm:p-6'>
                <DiaryCalendar
                  selectedDate={selectedDate}
                  onDateChange={handleDateChange}
                  highlightedDates={highlightedDates}
                />
              </div>
            </div>
          </div>

          <div className='xl:col-span-8'>
            <div className='space-y-4 sm:space-y-6'>
              <div className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 sm:p-6 border border-blue-100 dark:border-blue-800/30 shadow-sm'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-blue-100 dark:bg-blue-800/50 rounded-lg'>
                    <FiCalendar className='h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400' />
                  </div>
                  <div>
                    <h2 className='text-lg sm:text-xl font-semibold text-gray-900 dark:text-white'>
                      {selectedDateString}
                    </h2>
                    <p className='text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5'>
                      {notesForSelectedDay.length === 0
                        ? "No entries yet"
                        : `${notesForSelectedDay.length} ${
                            notesForSelectedDay.length === 1 ? "entry" : "entries"
                          }`}
                    </p>
                  </div>
                </div>
              </div>

              {isLoading && notesForMonth.length === 0 ? (
                <div className='space-y-4'>
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className='h-40 sm:h-48 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl animate-pulse shadow-sm'
                      style={{ animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
              ) : notesForSelectedDay.length === 0 ? (
                <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden'>
                  <div className='text-center py-12 sm:py-16 px-4'>
                    <div className='inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 mb-4 sm:mb-6'>
                      <FiBookOpen className='h-8 w-8 sm:h-10 sm:w-10 text-blue-600 dark:text-blue-400' />
                    </div>
                    <h3 className='text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                      No entry for this day
                    </h3>
                    <p className='text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto'>
                      Start documenting your day by creating a new diary entry.
                    </p>
                    <button
                      onClick={openAddModal}
                      className='inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105'>
                      <FiBookOpen className='mr-2 h-4 w-4 sm:h-5 sm:w-5' />
                      Create Entry
                    </button>
                  </div>
                </div>
              ) : (
                <div className='space-y-4'>
                  {notesForSelectedDay.map((note, index) => (
                    <div
                      key={note.id}
                      className='transform transition-all duration-300 hover:scale-[1.02]'
                      style={{ animationDelay: `${index * 50}ms` }}>
                      <DiaryEntryCard
                        entry={note}
                        onEdit={openEditModal}
                        onDelete={(item) => deleteManager.deleteSingle(item)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <DiaryFormModal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        editingNote={editingNote}
        onSubmit={handleSaveNote}
        isLoading={isMutating}
        selectedDate={selectedDate}
      />

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