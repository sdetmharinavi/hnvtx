// components/audit/AuditLogDetailsModal.tsx
"use client";

import React, { useMemo, useState } from 'react';
import { Modal, Button } from '@/components/common/ui';
import { V_audit_logsRowSchema } from '@/schemas/zod-schemas';
import { formatDate } from '@/utils/formatters';
import { ArrowRight, Code } from 'lucide-react';

interface AuditLogDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: V_audit_logsRowSchema | null;
}

// Helper to format values for display
const formatValue = (val: unknown): string => {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

// Helper to determine change type
type ChangeType = 'added' | 'removed' | 'modified' | 'unchanged';

interface DiffItem {
  key: string;
  oldVal: unknown;
  newVal: unknown;
  type: ChangeType;
}

export const AuditLogDetailsModal: React.FC<AuditLogDetailsModalProps> = ({
  isOpen,
  onClose,
  log,
}) => {
  const [showRawJson, setShowRawJson] = useState(false);

  // Calculate differences
  const changes = useMemo((): DiffItem[] => {
    if (!log) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const oldData = (log.old_data as Record<string, any>) || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newData = (log.new_data as Record<string, any>) || {};

    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    const diffs: DiffItem[] = [];

    allKeys.forEach((key) => {
      const oldVal = oldData[key];
      const newVal = newData[key];
      
      // Ignore internal fields that might clutter the view
      if (key === 'updated_at' || key === 'created_at' || key.startsWith('_')) {
          // Optional: uncomment to hide timestamps from diff
          // return; 
      }

      const strOld = JSON.stringify(oldVal);
      const strNew = JSON.stringify(newVal);

      let type: ChangeType = 'unchanged';

      if (oldVal === undefined && newVal !== undefined) type = 'added';
      else if (oldVal !== undefined && newVal === undefined) type = 'removed';
      else if (strOld !== strNew) type = 'modified';

      // Only add to list if it's actually interesting (changed) or we want to show everything
      if (type !== 'unchanged') {
        diffs.push({ key, oldVal, newVal, type });
      }
    });

    return diffs;
  }, [log]);

  if (!log) return null;

  // Robust User Display Name
  const userName = log.performed_by_name || log.performed_by_email || 'System / Unknown';
  const userRole = log.user_role ? `(${log.user_role})` : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Audit Log Details" size="xl">
      <div className="p-6 space-y-6">
        
        {/* Header Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border dark:border-gray-700">
          <div>
             <span className="text-xs text-gray-500 uppercase font-semibold block mb-1">Action</span>
             <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase 
                  ${log.action_type === 'INSERT' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                    log.action_type === 'DELETE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                  {log.action_type}
                </span>
                <span className="font-medium text-gray-700 dark:text-gray-300">on {log.table_name}</span>
             </div>
          </div>
          <div>
             <span className="text-xs text-gray-500 uppercase font-semibold block mb-1">Timestamp</span>
             <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">
               {formatDate(log.created_at || new Date(), { format: 'dd-mm-yyyy', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
             </p>
          </div>
          <div>
             <span className="text-xs text-gray-500 uppercase font-semibold block mb-1">User</span>
             <p className="font-medium text-gray-700 dark:text-gray-300 text-sm flex items-center gap-1">
                {userName} <span className="text-gray-400 font-normal text-xs">{userRole}</span>
             </p>
          </div>
          <div>
             <span className="text-xs text-gray-500 uppercase font-semibold block mb-1">Record ID</span>
             <p className="font-mono text-xs text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded inline-block">
               {log.record_id}
             </p>
          </div>
        </div>

        {/* Toggle View */}
        <div className="flex justify-end">
            <Button 
                size="xs" 
                variant="outline" 
                onClick={() => setShowRawJson(!showRawJson)}
                leftIcon={<Code className="w-3 h-3" />}
            >
                {showRawJson ? 'View Diff' : 'View Raw JSON'}
            </Button>
        </div>

        {/* Content Area */}
        {showRawJson ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
               <h4 className="text-sm font-bold text-red-600 mb-2">Old Data (Raw)</h4>
               <div className="bg-gray-100 dark:bg-gray-950 p-3 rounded-md border dark:border-gray-700 h-96 overflow-auto text-xs font-mono custom-scrollbar">
                  {log.old_data ? (
                      <pre>{JSON.stringify(log.old_data, null, 2)}</pre>
                  ) : (
                      <span className="text-gray-400 italic">No previous data (Insert)</span>
                  )}
               </div>
             </div>
  
             <div>
               <h4 className="text-sm font-bold text-green-600 mb-2">New Data (Raw)</h4>
               <div className="bg-gray-100 dark:bg-gray-950 p-3 rounded-md border dark:border-gray-700 h-96 overflow-auto text-xs font-mono custom-scrollbar">
                  {log.new_data ? (
                      <pre>{JSON.stringify(log.new_data, null, 2)}</pre>
                  ) : (
                      <span className="text-gray-400 italic">No new data (Delete)</span>
                  )}
               </div>
             </div>
          </div>
        ) : (
          <div className="border rounded-lg border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b dark:border-gray-700 font-semibold text-sm text-gray-700 dark:text-gray-300 flex justify-between items-center">
                <span>Changes Detected</span>
                <span className="text-xs font-normal text-gray-500 bg-white dark:bg-gray-700 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                    {changes.length} field(s)
                </span>
            </div>
            
            {changes.length === 0 ? (
                <div className="p-8 text-center text-gray-500 italic">
                    No visible changes detected in this log entry.
                </div>
            ) : (
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-2 w-1/4">Field</th>
                                <th className="px-4 py-2 w-1/3">Previous Value</th>
                                <th className="px-4 py-2 w-10"></th>
                                <th className="px-4 py-2 w-1/3">New Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {changes.map((diff) => (
                                <tr key={diff.key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 wrap-break-word align-top">
                                        {diff.key}
                                    </td>
                                    <td className={`px-4 py-3 wrap-break-word align-top font-mono text-xs ${diff.type === 'modified' || diff.type === 'removed' ? 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300' : 'text-gray-500'}`}>
                                        {diff.type === 'added' ? (
                                            <span className="text-gray-300 select-none">—</span>
                                        ) : (
                                            formatValue(diff.oldVal)
                                        )}
                                    </td>
                                    <td className="px-2 py-3 text-center align-top text-gray-400">
                                        <ArrowRight className="w-4 h-4 mx-auto mt-0.5" />
                                    </td>
                                    <td className={`px-4 py-3 wrap-break-word align-top font-mono text-xs ${diff.type === 'modified' || diff.type === 'added' ? 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-300' : 'text-gray-500'}`}>
                                        {diff.type === 'removed' ? (
                                             <span className="text-gray-300 select-none">—</span>
                                        ) : (
                                            formatValue(diff.newVal)
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
          </div>
        )}
        
        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t dark:border-gray-700">
             <Button variant="outline" onClick={onClose}>Close</Button>
        </div>

      </div>
    </Modal>
  );
};