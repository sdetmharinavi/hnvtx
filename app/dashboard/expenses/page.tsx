// app/dashboard/expenses/page.tsx
'use client';

import { useState, useRef, type ChangeEvent, useCallback, useMemo } from 'react';
import { useUser } from '@/providers/UserProvider';
import { useCrudManager, UseCrudManagerReturn } from '@/hooks/useCrudManager';
import { useAdvancesData, useExpensesData } from '@/hooks/data/useExpensesData';
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import {
  FiPlus,
  FiUpload,
  FiList,
  FiPieChart,
  FiRefreshCw,
  FiDownload,
  FiFilter,
  FiX,
} from 'react-icons/fi';
import { DataGrid } from '@/components/common/DataGrid';
import { GenericEntityCard } from '@/components/common/ui/GenericEntityCard';
import { calculatePercentage, formatCurrency, formatDate } from '@/utils/formatters';
import { ProgressBar } from '@/components/common/ui/ProgressBar';
import { createClient } from '@/utils/supabase/client';
import dynamic from 'next/dynamic';
import { PageSpinner, StatusBadge, Button } from '@/components/common/ui';
import { Tabs, TabsList, TabsTrigger } from '@/components/common/ui/tabs';
import { useExpenseExcelUpload } from '@/hooks/database/excel-queries/useExpenseExcelUpload';
import { UploadResultModal } from '@/components/common/ui/UploadResultModal';
import { createStandardActions } from '@/components/table/action-helpers';
import { DataTable } from '@/components/table';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { V_advances_completeRowSchema, V_expenses_completeRowSchema } from '@/schemas/zod-schemas';
import { Row } from '@/hooks/database';
import { useDataSync } from '@/hooks/data/useDataSync';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { useTableExcelDownload } from '@/hooks/database/excel-queries';
import { buildColumnConfig } from '@/constants/table-column-keys';
import { FaRupeeSign } from 'react-icons/fa';
import { UserRole } from '@/types/user-roles';
import { StatProps } from '@/components/common/page-header/StatCard';

const AdvanceFormModal = dynamic(
  () => import('@/components/expenses/AdvanceFormModal').then((mod) => mod.AdvanceFormModal),
  { loading: () => <PageSpinner /> },
);
const ExpenseFormModal = dynamic(
  () => import('@/components/expenses/ExpenseFormModal').then((mod) => mod.ExpenseFormModal),
  { loading: () => <PageSpinner /> },
);

export default function ExpensesPage() {
  const { isSuperAdmin, role } = useUser();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState('advances');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canDelete = !!isSuperAdmin || role === UserRole.ADMINPRO;

  const { sync, isSyncing } = useDataSync();

  // --- EXPORT HOOKS ---
  const { mutate: exportAdvances, isPending: isExportingAdvances } = useTableExcelDownload(
    supabase,
    'v_advances_complete',
  );

  const { mutate: exportExpenses, isPending: isExportingExpenses } = useTableExcelDownload(
    supabase,
    'v_expenses_complete',
  );

  const advanceCrud = useCrudManager<'advances', V_advances_completeRowSchema>({
    tableName: 'advances',
    localTableName: 'v_advances_complete',
    dataQueryHook: useAdvancesData,
    displayNameField: 'req_no',
    syncTables: ['advances', 'expenses', 'v_advances_complete'],
  });

  const expenseCrud = useCrudManager<'expenses', V_expenses_completeRowSchema>({
    tableName: 'expenses',
    localTableName: 'v_expenses_complete',
    dataQueryHook: useExpensesData,
    displayNameField: 'invoice_no',
    syncTables: ['expenses', 'v_expenses_complete', 'advances', 'v_advances_complete'],
  });

  const { mutate: uploadExpenses, isPending: isUploading } = useExpenseExcelUpload(supabase);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadExpenses(
        { file },
        {
          onSuccess: (res) => {
            setUploadResult(res);
            setIsResultOpen(true);
            sync(['expenses', 'v_expenses_complete', 'advances', 'v_advances_complete']);
          },
        },
      );
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRefresh = useCallback(async () => {
    try {
      if (activeTab === 'advances') {
        await sync(['advances', 'v_advances_complete', 'expenses']);
        advanceCrud.refetch();
      } else {
        await sync(['expenses', 'v_expenses_complete', 'advances']);
        expenseCrud.refetch();
      }
    } catch (error) {
      console.error('Refresh failed', error);
    }
  }, [activeTab, sync, advanceCrud, expenseCrud]);

  // --- DYNAMIC HEADER STATS (FILTERABLE) ---
  const advanceStats: StatProps[] = useMemo(() => {
    const activeCount = advanceCrud.data.filter((a) => a.status === 'active').length;
    const pendingCount = advanceCrud.data.filter((a) => a.status === 'pending').length;
    const settledCount = advanceCrud.data.filter((a) => a.status === 'settled').length;
    const currentStatus = advanceCrud.filters.filters.status;

    return [
      {
        value: advanceCrud.totalCount,
        label: 'All Advances',
        onClick: () =>
          advanceCrud.filters.setFilters((prev) => {
            const next = { ...prev };
            delete next.status;
            return next;
          }),
        isActive: !currentStatus,
      },
      {
        value: activeCount,
        label: 'Active',
        color: 'success',
        onClick: () => advanceCrud.filters.setFilters((prev) => ({ ...prev, status: 'active' })),
        isActive: currentStatus === 'active',
      },
      {
        value: pendingCount,
        label: 'Pending',
        color: 'warning',
        onClick: () => advanceCrud.filters.setFilters((prev) => ({ ...prev, status: 'pending' })),
        isActive: currentStatus === 'pending',
      },
      {
        value: settledCount,
        label: 'Settled',
        color: 'default',
        onClick: () => advanceCrud.filters.setFilters((prev) => ({ ...prev, status: 'settled' })),
        isActive: currentStatus === 'settled',
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advanceCrud.data, advanceCrud.totalCount, advanceCrud.filters.filters]);

  // --- EXPORT HANDLERS ---
  const handleExportAdvances = useCallback(() => {
    const columns = buildColumnConfig('v_advances_complete');
    exportAdvances({
      fileName: `Advances_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'Advances',
      filters: advanceCrud.filters.filters,
      columns,
      wrapText: true,
      autoFitColumns: true,
    });
  }, [exportAdvances, advanceCrud.filters.filters]);

  const handleExportExpenses = useCallback(() => {
    const columns: Column<Row<'v_expenses_complete'>>[] = [
      { key: 'expense_date', title: 'Date', dataIndex: 'expense_date', excelFormat: 'date' },
      { key: 'used_by', title: 'Used By', dataIndex: 'used_by' },
      { key: 'category', title: 'Category', dataIndex: 'category' },
      { key: 'vendor', title: 'Vendor', dataIndex: 'vendor' },
      { key: 'invoice_no', title: 'Invoice No', dataIndex: 'invoice_no' },
      { key: 'amount', title: 'Amount', dataIndex: 'amount', excelFormat: 'number' },
      { key: 'terminal_location', title: 'Location', dataIndex: 'terminal_location' },
      { key: 'description', title: 'Description', dataIndex: 'description', width: 300 },
      { key: 'advance_req_no', title: 'Req No', dataIndex: 'advance_req_no' },
    ];

    exportExpenses({
      fileName: `Expenses_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'Expenses',
      filters: expenseCrud.filters.filters,
      columns,
      wrapText: true,
      autoFitColumns: true,
    });
  }, [exportExpenses, expenseCrud.filters.filters]);

  const advanceColumns: Column<Row<'v_advances_complete'>>[] = useMemo(
    () => [
      {
        key: 'req_no',
        title: 'Request No',
        dataIndex: 'req_no',
        sortable: true,
        width: 140,
        render: (v) => <span className='font-mono font-medium text-sm'>{v as string}</span>,
      },
      {
        key: 'employee_name',
        title: 'Employee',
        dataIndex: 'employee_name',
        sortable: true,
        width: 180,
        render: (v, rec) => (
          <div className='flex flex-col'>
            <span className='font-medium text-gray-900 dark:text-gray-100 text-sm'>
              {v as string}
            </span>
            <span className='text-xs text-gray-500'>{rec.employee_pers_no}</span>
          </div>
        ),
      },
      {
        key: 'advance_date',
        title: 'Date Issued',
        dataIndex: 'advance_date',
        sortable: true,
        width: 120,
        render: (v) => (
          <span className='text-sm'>{formatDate(v as string, { format: 'dd-mm-yyyy' })}</span>
        ),
      },
      {
        key: 'total_amount',
        title: 'Amount',
        dataIndex: 'total_amount',
        sortable: true,
        width: 120,
        render: (v) => <span className='font-bold text-sm'>{formatCurrency(Number(v))}</span>,
      },
      {
        key: 'spent_amount',
        title: 'Spent',
        dataIndex: 'spent_amount',
        width: 120,
        render: (v) => (
          <span className='text-gray-600 dark:text-gray-400 text-sm'>
            {formatCurrency(Number(v))}
          </span>
        ),
      },
      {
        key: 'remaining_balance',
        title: 'Balance',
        dataIndex: 'remaining_balance',
        width: 120,
        render: (v) => {
          const val = Number(v);
          return (
            <span
              className={`text-sm ${val < 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}`}
            >
              {formatCurrency(val)}
            </span>
          );
        },
      },
      {
        key: 'status',
        title: 'Status',
        dataIndex: 'status',
        width: 100,
        render: (v) => <StatusBadge status={v as string} />,
      },
      {
        key: 'description',
        title: 'Purpose',
        dataIndex: 'description',
        width: 200,
        render: (v) => <TruncateTooltip text={v as string} />,
      },
    ],
    [],
  );

  const renderAdvanceItem = useCallback(
    (item: V_advances_completeRowSchema) => {
      const total = item.total_amount ?? 0;
      const spent = item.spent_amount ?? 0;
      const remaining = item.remaining_balance ?? 0;
      const percentage = calculatePercentage(spent, total);

      return (
        <GenericEntityCard
          key={item.id}
          entity={item}
          title={item.req_no || 'Unknown'}
          subtitle={`Taken By: ${item.employee_name}` || 'Unassigned'}
          status={item.status}
          showStatusLabel={false}
          headerIcon={<FaRupeeSign className='w-5 h-5 sm:w-6 sm:h-6 text-green-600' />}
          dataItems={[
            {
              label: 'Starting Date',
              value: item.advance_date ? formatDate(item.advance_date) : 'N/A',
              icon: FiList,
            },
            { label: 'Amount', value: formatCurrency(total), icon: FiPieChart },
            { label: 'Spent', value: formatCurrency(spent), icon: FiPieChart },
          ]}
          customFooter={
            <div className='w-full space-y-1'>
              <div className='flex justify-between text-xs'>
                <span>Utilization</span>
                <span>{percentage.value}%</span>
              </div>
              <ProgressBar
                value={spent}
                max={total || 100}
                size='sm'
                variant={
                  percentage.displayValue > 90
                    ? 'danger'
                    : percentage.displayValue > 70
                      ? 'warning'
                      : 'success'
                }
              />
              <div className='text-right text-xs font-bold text-gray-600 dark:text-gray-400'>
                Bal: {formatCurrency(remaining)}
              </div>
            </div>
          }
          onEdit={advanceCrud.editModal.openEdit}
          onDelete={advanceCrud.actions.handleDelete}
          canEdit={true}
          canDelete={canDelete}
          onView={(record) => {
            if (record.id) {
              expenseCrud.filters.setFilters({ advance_id: record.id });
              setActiveTab('expenses');
            }
          }}
        />
      );
    },
    [
      advanceCrud.editModal.openEdit,
      advanceCrud.actions.handleDelete,
      canDelete,
      expenseCrud.filters,
    ],
  );

  const expenseColumns: Column<Row<'v_expenses_complete'>>[] = useMemo(
    () => [
      {
        key: 'expense_date',
        title: 'Date',
        dataIndex: 'expense_date',
        render: (v) => <span className='text-sm'>{formatDate(v as string)}</span>,
        sortable: true,
        width: 120,
      },
      {
        key: 'used_by',
        title: 'Used By',
        dataIndex: 'used_by',
        width: 150,
        render: (v) => <span className='text-sm'>{v as string}</span>,
      },
      {
        key: 'category',
        title: 'Category',
        dataIndex: 'category',
        sortable: true,
        width: 120,
        render: (v) => <span className='text-sm'>{v as string}</span>,
      },
      {
        key: 'vendor',
        title: 'Vendor',
        dataIndex: 'vendor',
        width: 150,
        render: (v) => <span className='text-sm'>{v as string}</span>,
      },
      {
        key: 'invoice_no',
        title: 'Invoice',
        dataIndex: 'invoice_no',
        width: 150,
        render: (v) => <span className='text-sm font-mono'>{v as string}</span>,
      },
      {
        key: 'amount',
        title: 'Amount',
        dataIndex: 'amount',
        render: (v) => <span className='text-sm font-semibold'>{formatCurrency(Number(v))}</span>,
        width: 120,
      },
      {
        key: 'advance_req_no',
        title: 'Req No',
        dataIndex: 'advance_req_no',
        width: 150,
        render: (v) => <span className='text-sm font-mono'>{v as string}</span>,
      },
      {
        key: 'description',
        title: 'Description',
        dataIndex: 'description',
        width: 300,
        render: (v) => <TruncateTooltip text={v as string} />,
      },
    ],
    [],
  );

  const activeAdvanceId = expenseCrud.filters.filters.advance_id
    ? String(expenseCrud.filters.filters.advance_id)
    : null;

  const activeAdvanceDetails = useMemo(() => {
    if (!activeAdvanceId) return null;
    return advanceCrud.data.find((a) => a.id === activeAdvanceId);
  }, [activeAdvanceId, advanceCrud.data]);

  const isLoading = activeTab === 'advances' ? advanceCrud.isLoading : expenseCrud.isLoading;

  return (
    <div className='p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6'>
      <input
        type='file'
        ref={fileInputRef}
        onChange={handleFileUpload}
        className='hidden'
        accept='.xlsx'
      />
      <UploadResultModal
        isOpen={isResultOpen}
        onClose={() => setIsResultOpen(false)}
        result={uploadResult}
      />

      <div className='bg-white dark:bg-gray-800 p-1 rounded-lg border dark:border-gray-700 shadow-sm w-full sm:w-fit'>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='w-full sm:w-auto'>
            <TabsTrigger value='advances' className='flex-1 sm:flex-initial'>
              Advances
            </TabsTrigger>
            <TabsTrigger value='expenses' className='flex-1 sm:flex-initial'>
              Expense Log
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === 'advances' ? (
        <DashboardPageLayout<'v_advances_complete'>
          header={{
            title: 'Advance Requests',
            description: 'Manage temporary cash advances given to employees.',
            icon: <FaRupeeSign />,
            stats: advanceStats,
            actions: [
              {
                label: 'Refresh',
                onClick: handleRefresh,
                variant: 'outline',
                leftIcon: <FiRefreshCw className={isSyncing ? 'animate-spin' : ''} />,
                disabled: isLoading || isSyncing,
                hideTextOnMobile: true,
              },
              {
                label: 'Export',
                onClick: handleExportAdvances,
                variant: 'outline',
                leftIcon: <FiDownload />,
                disabled: isExportingAdvances || isLoading,
                hideTextOnMobile: true,
              },
              {
                label: 'New Advance',
                onClick: advanceCrud.editModal.openAdd,
                variant: 'primary',
                leftIcon: <FiPlus />,
                hideTextOnMobile: true,
              },
            ],
          }}
          crud={advanceCrud as UseCrudManagerReturn<V_advances_completeRowSchema>}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          renderGrid={() => (
            <DataGrid
              data={advanceCrud.data}
              renderItem={renderAdvanceItem}
              isLoading={advanceCrud.isLoading}
            />
          )}
          tableProps={{
            tableName: 'v_advances_complete',
            data: advanceCrud.data,
            columns: advanceColumns,
            loading: advanceCrud.isLoading,
            searchable: false, // Hide duplicate search/filter inside table
            filterable: false,
            actions: createStandardActions({
              onEdit: advanceCrud.editModal.openEdit,
              onDelete: advanceCrud.actions.handleDelete,
            }),
          }}
          modals={
            <>
              {advanceCrud.editModal.isOpen && (
                <AdvanceFormModal
                  isOpen={advanceCrud.editModal.isOpen}
                  onClose={advanceCrud.editModal.close}
                  record={advanceCrud.editModal.record}
                  onSubmit={advanceCrud.actions.handleSave}
                  isLoading={advanceCrud.isMutating}
                />
              )}
            </>
          }
        />
      ) : (
        <DashboardPageLayout<'v_expenses_complete'>
          header={{
            title: 'Expense Log',
            description: 'Detailed log of all operational expenses and vendor payments.',
            icon: <FiList />,
            stats: [
              {
                value: expenseCrud.totalCount,
                label: 'Filtered Expenses',
              },
              {
                value:
                  activeAdvanceDetails?.req_no ||
                  (activeAdvanceId ? 'Selected ID' : 'All Advances'),
                label: 'Filter Context',
              },
            ],
            actions: [
              {
                label: 'Refresh',
                onClick: handleRefresh,
                variant: 'outline',
                leftIcon: <FiRefreshCw className={isSyncing ? 'animate-spin' : ''} />,
                disabled: isLoading || isSyncing,
                hideTextOnMobile: true,
              },
              {
                label: 'Export',
                onClick: handleExportExpenses,
                variant: 'outline',
                leftIcon: <FiDownload />,
                disabled: isExportingExpenses || isLoading,
                hideTextOnMobile: true,
              },
              {
                label: 'Upload Excel',
                onClick: () => fileInputRef.current?.click(),
                variant: 'outline',
                leftIcon: <FiUpload />,
                disabled: isUploading,
                hideTextOnMobile: true,
              },
              {
                label: 'New Expense',
                onClick: expenseCrud.editModal.openAdd,
                variant: 'primary',
                leftIcon: <FiPlus />,
                hideTextOnMobile: true,
              },
            ],
          }}
          crud={expenseCrud as UseCrudManagerReturn<V_expenses_completeRowSchema>}
          viewMode='table'
          renderBulkActions={() =>
            activeAdvanceId ? (
              <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4 flex items-center justify-between'>
                <div className='flex items-center gap-2 text-blue-800 dark:text-blue-200'>
                  <FiFilter />
                  <span className='text-sm font-medium'>
                    Viewing expenses for Advance:{' '}
                    <strong>{activeAdvanceDetails?.req_no || activeAdvanceId}</strong>
                  </span>
                </div>
                <Button
                  size='sm'
                  variant='ghost'
                  className='text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/40'
                  onClick={() => {
                    expenseCrud.filters.setFilters((prev) => {
                      const next = { ...prev };
                      delete next.advance_id;
                      return next;
                    });
                  }}
                >
                  <FiX className='mr-1' /> Clear Filter
                </Button>
              </div>
            ) : null
          }
          renderTable={() => (
            <DataTable
              data={expenseCrud.data}
              columns={expenseColumns}
              tableName='v_expenses_complete'
              loading={expenseCrud.isLoading}
              searchable={false} // Hide duplicate search/filter inside table
              filterable={false}
              pagination={{
                current: expenseCrud.pagination.currentPage,
                pageSize: expenseCrud.pagination.pageLimit,
                total: expenseCrud.totalCount,
                onChange: (p, s) => {
                  expenseCrud.pagination.setCurrentPage(p);
                  expenseCrud.pagination.setPageLimit(s);
                },
              }}
              actions={createStandardActions({
                onEdit: expenseCrud.editModal.openEdit,
                onDelete: canDelete ? expenseCrud.actions.handleDelete : undefined,
              })}
            />
          )}
          modals={
            <>
              {expenseCrud.editModal.isOpen && (
                <ExpenseFormModal
                  isOpen={expenseCrud.editModal.isOpen}
                  onClose={expenseCrud.editModal.close}
                  record={expenseCrud.editModal.record}
                  onSubmit={expenseCrud.actions.handleSave}
                  isLoading={expenseCrud.isMutating}
                />
              )}
            </>
          }
        />
      )}
    </div>
  );
}
