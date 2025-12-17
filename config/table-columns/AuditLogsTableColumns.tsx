// config/table-columns/AuditLogsTableColumns.tsx
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import { V_audit_logsRowSchema } from '@/schemas/zod-schemas';
import { formatDate } from '@/utils/formatters';
import Image from 'next/image';

const ActionBadge = ({ action }: { action: string }) => {
  const colors: Record<string, string> = {
    INSERT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    LOGIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  };
  const className = colors[action] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  
  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${className}`}>
      {action}
    </span>
  );
};

export const AuditLogsTableColumns = (data: V_audit_logsRowSchema[]) => {
  return useDynamicColumnConfig('v_audit_logs', {
    data: data,
    omit: ['id', 'user_id', 'record_id', 'old_data', 'new_data', 'details', 'performed_by_avatar'],
    overrides: {
      action_type: {
        title: 'Action',
        width: 100,
        render: (val) => <ActionBadge action={val as string} />,
      },
      table_name: {
        title: 'Entity',
        width: 150,
        render: (val) => <span className="font-mono text-sm">{val as string}</span>,
      },
      performed_by_name: {
        title: 'User',
        width: 200,
        render: (_, record) => (
          <div className="flex items-center gap-2">
             {record.performed_by_avatar ? (
                <Image 
                  src={record.performed_by_avatar} 
                  alt="avatar" 
                  width={24} height={24} 
                  className="rounded-full" 
                />
             ) : (
                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs">
                  {record.performed_by_name?.charAt(0) || '?'}
                </div>
             )}
             <div className="flex flex-col">
               <span className="text-sm font-medium">{record.performed_by_name || 'Unknown'}</span>
               <span className="text-xs text-gray-500">{record.performed_by_email}</span>
             </div>
          </div>
        )
      },
      created_at: {
        title: 'Timestamp',
        width: 180,
        render: (val) => formatDate(val as string, { format: 'dd-mm-yyyy', hour: '2-digit', minute: '2-digit' }),
      },
    },
  });
};