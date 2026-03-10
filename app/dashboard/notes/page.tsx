// app/dashboard/notes/page.tsx
"use client";

import { useMemo, useState, useCallback } from "react";
import { useStandardHeaderActions } from "@/components/common/page-header";
import { ErrorDisplay } from "@/components/common/ui";
import {
  GenericEntityCard,
  EntityCardItem,
} from "@/components/common/ui/GenericEntityCard";
import { DashboardPageLayout } from "@/components/layouts/DashboardPageLayout";
import { useCrudManager } from "@/hooks/useCrudManager";
import { useNotesData } from "@/hooks/data/useNotesData";
import { createStandardActions } from "@/components/table/action-helpers";
import { FiBook, FiUser, FiCalendar } from "react-icons/fi";
import { NoteViewModal } from "@/components/notes/NoteViewModal";
import { V_technical_notesRowSchema } from "@/schemas/zod-schemas";
import { Column } from "@/hooks/database/excel-queries/excel-helpers";
import { DataGrid } from "@/components/common/DataGrid";
import { StatProps } from "@/components/common/page-header/StatCard";

export default function NotesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const {
    data: notes,
    totalCount,
    activeCount, // Published
    inactiveCount, // Drafts
    isLoading,
    isFetching,
    error,
    refetch,
    pagination,
    search,
    filters,
    viewModal,
  } = useCrudManager<"technical_notes", V_technical_notesRowSchema>({
    tableName: "technical_notes",
    localTableName: "v_technical_notes",
    dataQueryHook: useNotesData,
    displayNameField: "title",
    searchColumn: ["title", "content", "author_name"],
    syncTables: ["technical_notes", "v_technical_notes"],
  });

  const columns = useMemo<Column<V_technical_notesRowSchema>[]>(
    () => [
      {
        key: "title",
        title: "Title",
        dataIndex: "title",
        sortable: true,
        searchable: true,
      },
      {
        key: "author_name",
        title: "Author",
        dataIndex: "author_name",
        sortable: true,
      },
      {
        key: "is_published",
        title: "Status",
        dataIndex: "is_published",
        width: 100,
        render: (val) =>
          (val as boolean) ? (
            <span className="text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-xs font-bold">
              Published
            </span>
          ) : (
            <span className="text-gray-600 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs font-bold">
              Draft
            </span>
          ),
      },
      {
        key: "created_at",
        title: "Created",
        dataIndex: "created_at",
        width: 150,
        render: (val) => {
          if (!val) return "—";
          const dateValue = new Date(val as string | number | Date);
          return isNaN(dateValue.getTime())
            ? "—"
            : dateValue.toLocaleDateString();
        },
      },
    ],
    [],
  );

  const filterConfigs = useMemo(
    () => [
      {
        key: "is_published",
        label: "Status",
        type: "native-select" as const,
        options: [
          { value: "true", label: "Published" },
          { value: "false", label: "Draft" },
        ],
      },
    ],
    [],
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
    isLoading,
    isFetching,
    exportConfig: { tableName: "v_technical_notes" },
  });

  const headerStats = useMemo<StatProps[]>(() => {
    const currentStatus = filters.filters.is_published;

    return [
      {
        value: totalCount,
        label: "Total Notes",
        color: "default",
        onClick: () =>
          filters.setFilters((prev) => {
            const next = { ...prev };
            delete next.is_published;
            return next;
          }),
        isActive: !currentStatus,
      },
      {
        value: activeCount,
        label: "Published",
        color: "success",
        onClick: () =>
          filters.setFilters((prev) => ({ ...prev, is_published: "true" })),
        isActive: currentStatus === "true",
      },
      {
        value: inactiveCount,
        label: "Drafts",
        color: "warning",
        onClick: () =>
          filters.setFilters((prev) => ({ ...prev, is_published: "false" })),
        isActive: currentStatus === "false",
      },
    ];
  }, [
    totalCount,
    activeCount,
    inactiveCount,
    filters.filters.is_published,
    filters.setFilters,
  ]);

  const renderItem = useCallback(
    (note: V_technical_notesRowSchema) => (
      <GenericEntityCard
        key={note.id}
        entity={note}
        title={note.title || ""}
        subtitle={note.author_name || "Unknown Author"}
        status={note.is_published ? "Active" : "Inactive"}
        showStatusLabel={false}
        headerIcon={<FiBook className="w-6 h-6 text-indigo-500" />}
        dataItems={[
          { icon: FiUser, label: "Author", value: note.author_name },
          {
            icon: FiCalendar,
            label: "Date",
            value: new Date(note.created_at!).toLocaleDateString(),
          },
        ]}
        onView={viewModal.open}
        canEdit={false}
        canDelete={false}
        customFooter={
          note.tags && note.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-2">
              {note.tags.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300"
                >
                  #{tag}
                </span>
              ))}
              {note.tags.length > 3 && (
                <span className="text-[10px] text-gray-500">
                  +{note.tags.length - 3}
                </span>
              )}
            </div>
          ) : undefined
        }
      />
    ),
    [viewModal.open],
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
    return (
      <ErrorDisplay
        error={error.message}
        actions={[{ label: "Retry", onClick: refetch }]}
      />
    );

  return (
    <DashboardPageLayout
      header={{
        title: "Technical Notes Reader",
        description:
          "Read-only access to knowledge base, technical documentation, and team updates.",
        icon: <FiBook />,
        stats: headerStats,
        actions: headerActions,
        isLoading,
        isFetching,
      }}
      searchQuery={search.searchQuery}
      onSearchChange={search.setSearchQuery}
      searchPlaceholder="Search notes..."
      filters={filters.filters}
      onFilterChange={handleFilterChange}
      filterConfigs={filterConfigs}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      renderGrid={renderGrid}
      tableProps={{
        tableName: "v_technical_notes",
        data: notes,
        columns,
        loading: isLoading,
        isFetching: isFetching,
        actions: createStandardActions({
          onView: viewModal.open,
        }),
        selectable: false,
        pagination: {
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          showSizeChanger: true,
          onChange: (page, s) => {
            pagination.setCurrentPage(page);
            pagination.setPageLimit(s);
          },
        },
        customToolbar: <></>,
      }}
      isEmpty={notes.length === 0 && !isLoading}
      modals={
        <NoteViewModal
          isOpen={viewModal.isOpen}
          onClose={viewModal.close}
          note={viewModal.record}
        />
      }
    />
  );
}
