import { createGenericDataQuery } from './useGenericDataQuery';
import { DEFAULTS } from '@/constants/constants';

export const useExpensesData = createGenericDataQuery<'v_expenses_complete'>({
  tableName: 'v_expenses_complete', // This string will need to be cast if typescript complains about PublicTableName not updated yet
  searchFields: ['category', 'vendor', 'invoice_no', 'advance_req_no', 'terminal_location'],
  defaultSortField: 'expense_date',
  orderBy: 'desc',
  rpcLimit: DEFAULTS.PAGE_SIZE,
  filterFn: (item, filters) => {
    if (filters.advance_id && item.advance_id !== filters.advance_id) return false;
    return true;
  },
});

export const useAdvancesData = createGenericDataQuery<'v_advances_complete'>({
  tableName: 'v_advances_complete',
  searchFields: ['req_no', 'employee_name', 'status'],
  defaultSortField: 'advance_date',
  orderBy: 'desc',
  rpcLimit: DEFAULTS.PAGE_SIZE,
  filterFn: (item, filters) => {
    if (filters.status && item.status !== filters.status) return false;
    return true;
  },
});