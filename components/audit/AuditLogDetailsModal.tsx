// components/audit/AuditLogDetailsModal.tsx
import React from 'react';
import { Modal } from '@/components/common/ui';
import { V_audit_logsRowSchema } from '@/schemas/zod-schemas';
import { formatDate } from '@/utils/formatters';

interface AuditLogDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: V_audit_logsRowSchema | null;
}

export const AuditLogDetailsModal: React.FC<AuditLogDetailsModalProps> = ({
  isOpen,
  onClose,
  log,
}) => {
  if (!log) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Audit Log Details" size="xl">
      <div className="p-6 space-y-6">
        {/* Header Summary */}
        <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border dark:border-gray-700">
          <div>
             <span className="text-xs text-gray-500 uppercase font-semibold">Action</span>
             <p className="font-medium">{log.action_type} on {log.table_name}</p>
          </div>
          <div>
             <span className="text-xs text-gray-500 uppercase font-semibold">Timestamp</span>
             <p className="font-medium">{formatDate(log.created_at || new Date(), { format: 'dd-mm-yyyy', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
          </div>
          <div>
             <span className="text-xs text-gray-500 uppercase font-semibold">User</span>
             <p className="font-medium">{log.performed_by_name} ({log.user_role})</p>
          </div>
          <div>
             <span className="text-xs text-gray-500 uppercase font-semibold">Record ID</span>
             <p className="font-mono text-sm">{log.record_id}</p>
          </div>
        </div>

        {/* JSON Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Old Data */}
           <div>
             <h4 className="text-sm font-bold text-red-600 mb-2">Previous Data</h4>
             <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md border dark:border-gray-700 h-96 overflow-auto text-xs font-mono custom-scrollbar">
                {log.old_data ? (
                    <pre>{JSON.stringify(log.old_data, null, 2)}</pre>
                ) : (
                    <span className="text-gray-400 italic">No previous data (Insert)</span>
                )}
             </div>
           </div>

           {/* New Data */}
           <div>
             <h4 className="text-sm font-bold text-green-600 mb-2">New Data</h4>
             <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md border dark:border-gray-700 h-96 overflow-auto text-xs font-mono custom-scrollbar">
                {log.new_data ? (
                    <pre>{JSON.stringify(log.new_data, null, 2)}</pre>
                ) : (
                    <span className="text-gray-400 italic">No new data (Delete)</span>
                )}
             </div>
           </div>
        </div>
      </div>
    </Modal>
  );
};