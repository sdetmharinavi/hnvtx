// path: app/dashboard/notes/page.tsx
'use client';

import { useMemo, useState, useCallback } from 'react';
import { useStandardHeaderActions } from '@/components/common/page-header';
import { ConfirmModal, ErrorDisplay } from '@/components/common/ui';
import { GenericEntityCard } from '@/components/common/ui/GenericEntityCard';
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { useCrudManager } from '@/hooks/useCrudManager';
import { TableInsert } from '@/hooks/database';
import { useNotesData } from '@/hooks/data/useNotesData';
import { createStandardActions } from '@/components/table/action-helpers';
import { useUser } from '@/providers/UserProvider';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/user-roles';
import { FiBook, FiUser, FiCalendar } from 'react-icons/fi';
import { NoteModal } from '@/components/notes/NoteModal';
import { NoteViewModal } from '@/components/notes/NoteViewModal';
import { V_technical_notesRowSchema } from '@/schemas/zod-schemas';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { DataGrid } from '@/components/common/DataGrid';

export default function NotesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const { user } = useAuth();
  const { isSuperAdmin, role } = useUser();

  const canCreate = !!user;
  const canManageAll = isSuperAdmin || role === UserRole.ADMIN || role === UserRole.ADMINPRO;

  const {
    data: notes,
    totalCount,
    // THE FIX: Restore activeCount and inactiveCount as they are now correct
    activeCount,
    inactiveCount,
    isLoading,
    isMutating: isCrudMutating,
    isFetching,
    error,
    refetch,
    pagination,
    search,
    filters,
    editModal,
    viewModal,
    deleteModal,
    actions: crudActions,
  } = useCrudManager<'technical_notes', V_technical_notesRowSchema>({
    tableName: 'technical_notes',
    localTableName: 'v_technical_notes',
    dataQueryHook: useNotesData,
    displayNameField: 'title',
    searchColumn: ['title', 'content', 'author_name'],
    syncTables: ['technical_notes', 'v_technical_notes'],
    processDataForSave: (data): TableInsert<'technical_notes'> => {
      return {
        ...data,
        author_id: (data.author_id as string | null | undefined) ?? user?.id ?? null,
      } as TableInsert<'technical_notes'>;
    },
  });

  const columns = useMemo<Column<V_technical_notesRowSchema>[]>(
    () => [
      { key: 'title', title: 'Title', dataIndex: 'title', sortable: true, searchable: true },
      { key: 'author_name', title: 'Author', dataIndex: 'author_name', sortable: true },
      {
        key: 'is_published',
        title: 'Status',
        dataIndex: 'is_published',
        width: 100,
        render: (val) =>
          (val as boolean) ? (
            <span className='text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-xs font-bold'>
              Published
            </span>
          ) : (
            <span className='text-gray-600 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs font-bold'>
              Draft
            </span>
          ),
      },
      {
        key: 'created_at',
        title: 'Created',
        dataIndex: 'created_at',
        width: 150,
        render: (val) => {
          if (!val) return '—';
          const dateValue = new Date(val as string | number | Date);
          return isNaN(dateValue.getTime()) ? '—' : dateValue.toLocaleDateString();
        },
      },
    ],
    [],
  );

  const filterConfigs = useMemo(
    () => [
      {
        key: 'is_published',
        label: 'Status',
        type: 'native-select' as const,
        options: [
          { value: 'true', label: 'Published' },
          { value: 'false', label: 'Draft' },
        ],
      },
    ],
    [],
  );

  const canEditNote = useCallback(
    (note: V_technical_notesRowSchema) => {
      if (canManageAll) return true;
      return note.author_id === user?.id;
    },
    [canManageAll, user?.id],
  );

  const handleFilterChange = useCallback(
    (key: string, value: string | null) => {
      filters.setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [filters],
  );

  const headerActions = useStandardHeaderActions({
    data: notes,
    onRefresh: refetch,
    onAddNew: canCreate ? editModal.openAdd : undefined,
    isLoading,
    isFetching,
    exportConfig: { tableName: 'v_technical_notes' },
  });

  const renderItem = useCallback(
    (note: V_technical_notesRowSchema) => (
      <GenericEntityCard
        key={note.id}
        entity={note}
        title={note.title || ''}
        subtitle={note.author_name || 'Unknown Author'}
        status={note.is_published ? 'Active' : 'Inactive'}
        showStatusLabel={false}
        headerIcon={<FiBook className='w-6 h-6 text-indigo-500' />}
        dataItems={[
          { icon: FiUser, label: 'Author', value: note.author_name },
          {
            icon: FiCalendar,
            label: 'Date',
            value: new Date(note.created_at!).toLocaleDateString(),
          },
        ]}
        onView={viewModal.open}
        onEdit={canEditNote(note) ? editModal.openEdit : undefined}
        onDelete={canEditNote(note) ? crudActions.handleDelete : undefined}
        canEdit={canEditNote(note)}
        canDelete={canEditNote(note)}
        customFooter={
          note.tags && note.tags.length > 0 ? (
            <div className='flex flex-wrap gap-1 mt-2'>
              {note.tags.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className='text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300'
                >
                  #{tag}
                </span>
              ))}
              {note.tags.length > 3 && (
                <span className='text-[10px] text-gray-500'>+{note.tags.length - 3}</span>
              )}
            </div>
          ) : undefined
        }
      />
    ),
    [viewModal.open, editModal.openEdit, crudActions.handleDelete, canEditNote],
  );

  const renderGrid = useCallback(
    () => (
      <DataGrid
        data={notes}
        renderItem={renderItem}
        isLoading={isLoading}
        isEmpty={notes.length === 0 && !isLoading}
        pagination={{
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          onChange: (page, pageSize) => {
            pagination.setCurrentPage(page);
            pagination.setPageLimit(pageSize);
          },
        }}
      />
    ),
    [notes, renderItem, isLoading, totalCount, pagination],
  );

  if (error)
    return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch }]} />;

  return (
    <DashboardPageLayout
      header={{
        title: 'Technical Notes',
        description: 'Knowledge base, technical documentation, and team updates.',
        icon: <FiBook />,
        // THE FIX: Use the corrected counts from the hook
        stats: [
          { value: totalCount, label: 'Total Notes' },
          { value: activeCount, label: 'Published', color: 'success' },
          { value: inactiveCount, label: 'Drafts', color: 'warning' },
        ],
        actions: headerActions,
        isLoading,
        isFetching,
      }}
      searchQuery={search.searchQuery}
      onSearchChange={search.setSearchQuery}
      searchPlaceholder='Search notes...'
      filters={filters.filters}
      onFilterChange={handleFilterChange}
      filterConfigs={filterConfigs}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      renderGrid={renderGrid}
      tableProps={{
        tableName: 'v_technical_notes',
        data: notes,
        columns,
        loading: isLoading,
        isFetching: isFetching || isCrudMutating,
        actions: createStandardActions({
          onEdit: (rec) =>
            canEditNote(rec as V_technical_notesRowSchema)
              ? editModal.openEdit(rec as V_technical_notesRowSchema)
              : undefined,
          onView: viewModal.open,
          onDelete: (rec) =>
            canEditNote(rec as V_technical_notesRowSchema)
              ? crudActions.handleDelete(rec)
              : undefined,
        }),
        pagination: {
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          onChange: (p, s) => {
            pagination.setCurrentPage(p);
            pagination.setPageLimit(s);
          },
        },
        customToolbar: <></>,
      }}
      isEmpty={notes.length === 0 && !isLoading}
      modals={
        <>
          {editModal.isOpen && (
            <NoteModal
              isOpen={editModal.isOpen}
              onClose={editModal.close}
              onSubmit={crudActions.handleSave}
              isLoading={isCrudMutating}
              editingNote={editModal.record}
            />
          )}
          <NoteViewModal
            isOpen={viewModal.isOpen}
            onClose={viewModal.close}
            note={viewModal.record}
          />
          <ConfirmModal
            isOpen={deleteModal.isOpen}
            onConfirm={deleteModal.onConfirm}
            onCancel={deleteModal.onCancel}
            title='Delete Note'
            message={deleteModal.message}
            type='danger'
            loading={deleteModal.loading}
          />
        </>
      }
    />
  );
}
