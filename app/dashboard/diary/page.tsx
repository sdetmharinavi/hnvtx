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
import { useDiaryData, DiaryEntryWithUser } from "@/hooks/data/useDiaryData";
import { UserRole } from "@/types/user-roles";

export default function DiaryPage() {
  // currentDate controls the "View Range" (which month we fetch data for)
  const [currentDate, setCurrentDate] = useState(new Date());
  // selectedDate controls which specific day is active in the list
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Diary_notesRowSchema | null>(null);

  const { user } = useAuthStore();
  const { role: currentUserRole, isSuperAdmin } = useUser();
  const supabase = createClient();

  // This hook automatically re-fetches when 'currentDate' changes (e.g., month switch)
  const {
    data: allNotesForMonth = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useDiaryData(currentDate);

  const canViewAll = isSuperAdmin || [UserRole.ADMIN, UserRole.VIEWER].includes(currentUserRole as UserRole);
  const canMutate = isSuperAdmin || currentUserRole === UserRole.ADMIN;

  const roleFilteredNotes = useMemo(() => {
    if (canViewAll) {
      return allNotesForMonth;
    }
    return allNotesForMonth.filter(note => note.user_id === user?.id);
  }, [allNotesForMonth, canViewAll, user?.id]);


  const { mutate: insertNote, isPending: isInserting } = useTableInsert(supabase, 'diary_notes', {
    onSuccess: () => { toast.success('Note created successfully!'); refetch(); setIsFormOpen(false); },
    onError: (err) => toast.error(`Failed to create note: ${err.message}`),
  });

  const { mutate: updateNote, isPending: isUpdating } = useTableUpdate(supabase, 'diary_notes', {
    onSuccess: () => { toast.success('Note updated successfully!'); refetch(); setIsFormOpen(false); },
    onError: (err) => toast.error(`Failed to update note: ${err.message}`),
  });

  const deleteManager = useDeleteManager({ 
    tableName: 'diary_notes', 
    onSuccess: () => { refetch(); } 
  });

  const isMutating = isInserting || isUpdating || deleteManager.isPending;

  const openAddModal = () => { setEditingNote(null); setIsFormOpen(true); };
  const openEditModal = (note: Diary_notesRowSchema) => { setEditingNote(note); setIsFormOpen(true); };
  const closeFormModal = () => { setIsFormOpen(false); setEditingNote(null); };

  const handleSaveNote = (data: Diary_notesInsertSchema) => {
    const payload = { ...data, user_id: user?.id };
    if (editingNote) {
      updateNote({ id: editingNote.id, data: payload });
    } else {
      insertNote(payload);
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
  
  const parseLocalDate = (dateString: string): Date => {
    const datePart = dateString.substring(0, 10);
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  const highlightedDates = useMemo(() => {
    return (roleFilteredNotes || []).map((note) => parseLocalDate(note.note_date!));
  }, [roleFilteredNotes]);

  const notesForSelectedDay = useMemo(() => {
    if (!roleFilteredNotes) return [];
    const selectedDateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    return roleFilteredNotes.filter((note: DiaryEntryWithUser) => {
      return note.note_date === selectedDateString;
    });
  }, [roleFilteredNotes, selectedDate]);

  // Handles clicking a specific day
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    // Also update currentDate if the user clicked a trailing day from prev/next month
    if (
      date.getMonth() !== currentDate.getMonth() ||
      date.getFullYear() !== currentDate.getFullYear()
    ) {
      setCurrentDate(date);
    }
  };

  // THE FIX: Handles navigating months via arrows (without changing selected day)
  const handleMonthChange = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  const headerActions = useStandardHeaderActions({
    data: roleFilteredNotes,
    onRefresh: async () => { await refetch(); toast.success("Notes refreshed!"); },
    onAddNew: canMutate ? openAddModal : undefined,
    isLoading,
    exportConfig: { tableName: "diary_notes", fileName: "my_diary_notes" },
  });

  headerActions.splice(1, 0, {
    label: isUploading ? "Uploading..." : "Upload Notes",
    onClick: handleUploadClick,
    variant: "outline",
    leftIcon: <FiUpload />,
    disabled: isUploading || isLoading || !canMutate,
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
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'>
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
            stats={[{ value: roleFilteredNotes.length, label: "Entries This Month" }]}
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
                  // THE FIX: Pass the month change handler
                  onMonthChange={handleMonthChange}
                  highlightedDates={highlightedDates}
                />
              </div>
            </div>
          </div>

          <div className='xl:col-span-8'>
            <div className='space-y-4 sm:space-y-6'>
              <div className='bg-blue-50 dark:bg-blue-900/20 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 sm:p-6 border border-blue-100 dark:border-blue-800/30 shadow-sm'>
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

              {isLoading && roleFilteredNotes.length === 0 ? (
                <div className='space-y-4'>
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className='h-40 sm:h-48 bg-gray-100 dark:bg-gray-800 bg-linear-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl animate-pulse shadow-sm'
                      style={{ animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
              ) : notesForSelectedDay.length === 0 ? (
                <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden'>
                  <div className='text-center py-12 sm:py-16 px-4'>
                    <div className='inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 mb-4 sm:mb-6'>
                      <FiBookOpen className='h-8 w-8 sm:h-10 sm:w-10 text-blue-600 dark:text-blue-400' />
                    </div>
                    <h3 className='text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                      No entry for this day
                    </h3>
                    <p className='text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto'>
                      Start documenting your day by creating a new diary entry.
                    </p>
                    {canMutate && (
                      <button
                        onClick={openAddModal}
                        className='inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105'>
                        <FiBookOpen className='mr-2 h-4 w-4 sm:h-5 sm:w-5' />
                        Create Entry
                      </button>
                    )}
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
                        canMutate={canMutate}
                      />
                    </div>
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