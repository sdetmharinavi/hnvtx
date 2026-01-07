// hooks/data/useAuditLogsData.ts
import { useGenericDataQuery } from "./useGenericDataQuery";
import { DEFAULTS } from "@/constants/constants";

export const useAuditLogsData = useGenericDataQuery<"v_audit_logs">({
  tableName: "v_audit_logs",
  searchFields: ["action_type", "table_name", "performed_by_name", "performed_by_email"],
  defaultSortField: "created_at", // Note: Generic hook defaults 'asc', we might need to handle desc in UI or extend generic later, but generic uses performClientSort which respects params
  rpcLimit: DEFAULTS.PAGE_SIZE,
  filterFn: (log, filters) => {
    if (filters.table_name && log.table_name !== filters.table_name) return false;
    if (filters.action_type && log.action_type !== filters.action_type) return false;
    return true;
  },
});
