import { createGenericDataQuery } from './useGenericDataQuery';
import { DEFAULTS } from '@/constants/constants';

export const useAuditLogsData = createGenericDataQuery<'v_audit_logs'>({
  tableName: 'v_audit_logs',
  searchFields: ['action_type', 'table_name', 'performed_by_name', 'performed_by_email'],
  defaultSortField: 'created_at',
  orderBy: 'desc',
  rpcLimit: DEFAULTS.PAGE_SIZE,
  filterFn: (log, filters) => {
    if (filters.table_name && log.table_name !== filters.table_name) return false;
    if (filters.action_type && log.action_type !== filters.action_type) return false;
    return true;
  },
});
