// app/dashboard/expenses/page.tsx
'use client';

import { useState, useRef, type ChangeEvent, useCallback } from 'react';
import { useUser } from '@/providers/UserProvider';
import { useCrudManager, UseCrudManagerReturn } from '@/hooks/useCrudManager';
import { useAdvancesData, useExpensesData } from '@/hooks/data/useExpensesData';
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { FiDollarSign, FiPlus, FiUpload, FiList, FiPieChart, FiRefreshCw } from 'react-icons/fi';
import { DataGrid } from '@/components/common/DataGrid';
import { GenericEntityCard } from '@/components/common/ui/GenericEntityCard';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { ProgressBar } from '@/components/common/ui/ProgressBar';
import { createClient } from '@/utils/supabase/client';
import { useTableInsert, useTableUpdate } from '@/hooks/database';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { PageSpinner } from '@/components/common/ui';
import { Tabs, TabsList, TabsTrigger } from '@/components/common/ui/tabs';
import { useExpenseExcelUpload } from '@/hooks/database/excel-queries/useExpenseExcelUpload';
import { UploadResultModal } from '@/components/common/ui/UploadResultModal';
import { createStandardActions } from '@/components/table/action-helpers';
import { DataTable } from '@/components/table';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { AdvancesInsertSchema, ExpensesInsertSchema, V_advances_completeRowSchema, V_expenses_completeRowSchema } from '@/schemas/zod-schemas';
import { Row } from '@/hooks/database';

const AdvanceFormModal = dynamic(
    () => import('@/components/expenses/AdvanceFormModal').then(mod => mod.AdvanceFormModal),
    { loading: () => <PageSpinner /> }
);
const ExpenseFormModal = dynamic(
    () => import('@/components/expenses/ExpenseFormModal').then(mod => mod.ExpenseFormModal),
    { loading: () => <PageSpinner /> }
);

export default function ExpensesPage() {
  const { isSuperAdmin } = useUser();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState('advances');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- Advances CRUD ---
  const advanceCrud = useCrudManager<'v_advances_complete', V_advances_completeRowSchema>({
    tableName: 'v_advances_complete',
    dataQueryHook: useAdvancesData,
    displayNameField: 'req_no',
    syncTables: ['advances', 'expenses', 'v_advances_complete']
  });

  // --- Expenses CRUD ---
  const expenseCrud = useCrudManager<'v_expenses_complete', V_expenses_completeRowSchema>({
    tableName: 'v_expenses_complete',
    dataQueryHook: useExpensesData,
    displayNameField: 'invoice_no',
    syncTables: ['expenses', 'v_expenses_complete']
  });

  // --- Mutations (Explicit Table Targets) ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { mutate: insertAdvance, isPending: creatingAdvance } = useTableInsert(supabase, 'advances' as any, {
      onSuccess: () => { toast.success("Advance Created"); advanceCrud.refetch(); advanceCrud.editModal.close(); }
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { mutate: updateAdvance, isPending: updatingAdvance } = useTableUpdate(supabase, 'advances' as any, {
      onSuccess: () => { toast.success("Advance Updated"); advanceCrud.refetch(); advanceCrud.editModal.close(); }
  });
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { mutate: insertExpense, isPending: creatingExpense } = useTableInsert(supabase, 'expenses' as any, {
      onSuccess: () => { toast.success("Expense Added"); expenseCrud.refetch(); advanceCrud.refetch(); expenseCrud.editModal.close(); }
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { mutate: updateExpense, isPending: updatingExpense } = useTableUpdate(supabase, 'expenses' as any, {
      onSuccess: () => { toast.success("Expense Updated"); expenseCrud.refetch(); advanceCrud.refetch(); expenseCrud.editModal.close(); }
  });

  const { mutate: uploadExpenses, isPending: isUploading } = useExpenseExcelUpload(supabase);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);

  const handleAdvanceSave = (data: AdvancesInsertSchema) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (advanceCrud.editModal.record?.id) updateAdvance({ id: advanceCrud.editModal.record.id, data: data as any });
      else insertAdvance(data);
  };
  
  const handleExpenseSave = (data: ExpensesInsertSchema) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
       if (expenseCrud.editModal.record?.id) updateExpense({ id: expenseCrud.editModal.record.id, data: data as any });
      else insertExpense(data);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          uploadExpenses({ file }, {
              onSuccess: (res) => { 
                setUploadResult(res); 
                setIsResultOpen(true); 
                expenseCrud.refetch();
                advanceCrud.refetch();
              }
          });
      }
      e.target.value = '';
  };

  const handleRefresh = useCallback(() => {
    if (activeTab === 'advances') {
        advanceCrud.refetch();
    } else {
        expenseCrud.refetch();
    }
    toast.success("Refreshed!");
  }, [activeTab, advanceCrud, expenseCrud]);

  const renderAdvanceItem = useCallback((item: V_advances_completeRowSchema) => {
    const total = item.total_amount ?? 0;
    const spent = item.spent_amount ?? 0;
    const remaining = item.remaining_balance ?? 0;
    const percentage = total > 0 ? Math.min(100, Math.round((spent / total) * 100)) : 0;
    
    return (
        <GenericEntityCard 
            key={item.id}
            entity={item}
            title={item.req_no || 'Unknown'}
            subtitle={item.employee_name || 'Unassigned'}
            status={item.status}
            headerIcon={<FiDollarSign className="w-6 h-6 text-green-600" />}
            dataItems={[
                { label: 'Date', value: item.advance_date ? formatDate(item.advance_date) : 'N/A', icon: FiList },
                { label: 'Amount', value: formatCurrency(total), icon: FiPieChart },
                { label: 'Spent', value: formatCurrency(spent), icon: FiPieChart },
            ]}
            customFooter={
                <div className="w-full space-y-1">
                    <div className="flex justify-between text-xs">
                        <span>Utilization</span>
                        <span>{percentage}%</span>
                    </div>
                    <ProgressBar value={spent} max={total || 100} size="sm" variant={percentage > 90 ? 'danger' : percentage > 70 ? 'warning' : 'success'} />
                    <div className="text-right text-xs font-bold text-gray-600 dark:text-gray-400">
                        Bal: {formatCurrency(remaining)}
                    </div>
                </div>
            }
            onEdit={advanceCrud.editModal.openEdit}
            onDelete={advanceCrud.actions.handleDelete}
            canEdit={true}
            canDelete={!!isSuperAdmin}
        />
    );
  }, [advanceCrud.editModal.openEdit, advanceCrud.actions.handleDelete, isSuperAdmin]);

  const expenseColumns: Column<Row<'v_expenses_complete'>>[] = [
    { key: 'expense_date', title: 'Date', dataIndex: 'expense_date', render: (v) => formatDate(v as string), sortable: true },
    { key: 'category', title: 'Category', dataIndex: 'category', sortable: true },
    { key: 'vendor', title: 'Vendor', dataIndex: 'vendor' },
    { key: 'invoice_no', title: 'Invoice', dataIndex: 'invoice_no' },
    { key: 'amount', title: 'Amount', dataIndex: 'amount', render: (v) => formatCurrency(Number(v)) },
    { key: 'advance_req_no', title: 'Req No', dataIndex: 'advance_req_no' },
  ];

  const isLoading = activeTab === 'advances' ? advanceCrud.isLoading : expenseCrud.isLoading;
  const isFetching = activeTab === 'advances' ? advanceCrud.isFetching : expenseCrud.isFetching;

  return (
    <div className="p-4 md:p-6 space-y-6">
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx" />
        <UploadResultModal isOpen={isResultOpen} onClose={() => setIsResultOpen(false)} result={uploadResult} />
        
        {/* TAB CONTROLS */}
        <div className="bg-white dark:bg-gray-800 p-1 rounded-lg border dark:border-gray-700 shadow-sm w-fit">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="advances">Advances</TabsTrigger>
                    <TabsTrigger value="expenses">Expense Log</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>

        {/* CONDITIONALLY RENDER LAYOUT BASED ON TAB */}
        {activeTab === 'advances' ? (
             <DashboardPageLayout<'v_advances_complete'>
                header={{
                    title: "Advance Requests",
                    description: "Manage temporary cash advances given to employees.",
                    icon: <FiDollarSign />,
                    actions: [
                        {
                            label: "Refresh",
                            onClick: handleRefresh,
                            variant: 'outline',
                            leftIcon: <FiRefreshCw className={isFetching ? "animate-spin" : ""} />,
                            disabled: isLoading || isFetching
                        },
                        {
                            label: "New Advance",
                            onClick: advanceCrud.editModal.openAdd,
                            variant: 'primary',
                            leftIcon: <FiPlus />
                        }
                    ]
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                crud={advanceCrud as unknown as UseCrudManagerReturn<any>} 
                renderGrid={() => (
                     <DataGrid 
                         data={advanceCrud.data} 
                         renderItem={renderAdvanceItem} 
                         isLoading={advanceCrud.isLoading}
                     />
                )}
                // We use renderGrid, so tableProps logic inside layout is skipped unless we switch viewMode
                tableProps={{
                    tableName: 'v_advances_complete',
                    data: advanceCrud.data,
                    columns: [], // Add columns if you want table view for advances
                    loading: advanceCrud.isLoading
                }}
                modals={
                    <>
                         {advanceCrud.editModal.isOpen && (
                            <AdvanceFormModal 
                                isOpen={advanceCrud.editModal.isOpen}
                                onClose={advanceCrud.editModal.close}
                                record={advanceCrud.editModal.record}
                                onSubmit={handleAdvanceSave}
                                isLoading={creatingAdvance || updatingAdvance}
                            />
                        )}
                    </>
                }
             />
        ) : (
            <DashboardPageLayout<'v_expenses_complete'>
                header={{
                    title: "Expense Log",
                    description: "Detailed log of all operational expenses and vendor payments.",
                    icon: <FiList />,
                    actions: [
                        {
                            label: "Refresh",
                            onClick: handleRefresh,
                            variant: 'outline',
                            leftIcon: <FiRefreshCw className={isFetching ? "animate-spin" : ""} />,
                            disabled: isLoading || isFetching
                        },
                        {
                            label: "Upload Excel",
                            onClick: () => fileInputRef.current?.click(),
                            variant: 'outline',
                            leftIcon: <FiUpload />,
                            disabled: isUploading
                        },
                        {
                            label: "New Expense",
                            onClick: expenseCrud.editModal.openAdd,
                            variant: 'primary',
                            leftIcon: <FiPlus />
                        }
                    ]
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                crud={expenseCrud as unknown as UseCrudManagerReturn<any>}
                viewMode="table" // Force table view for expenses
                renderTable={() => (
                    <DataTable 
                        data={expenseCrud.data} 
                        columns={expenseColumns}
                        tableName='v_expenses_complete'
                        loading={expenseCrud.isLoading}
                        pagination={{
                            current: expenseCrud.pagination.currentPage,
                            pageSize: expenseCrud.pagination.pageLimit,
                            total: expenseCrud.totalCount,
                            onChange: (p, s) => {
                                expenseCrud.pagination.setCurrentPage(p);
                                expenseCrud.pagination.setPageLimit(s);
                            }
                        }}
                        actions={createStandardActions({
                            onEdit: expenseCrud.editModal.openEdit,
                            onDelete: expenseCrud.actions.handleDelete
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
                                onSubmit={handleExpenseSave}
                                isLoading={creatingExpense || updatingExpense}
                            />
                        )}
                    </>
                }
            />
        )}
    </div>
  );
}