// components/dashboard/SyncStatusModal.tsx
"use client";

import { Modal, Button } from "@/components/common/ui";
import { useMutationQueue } from "@/hooks/data/useMutationQueue";
import { formatDate } from "@/utils/formatters";
import { AlertTriangle, CheckCircle, Clock, Trash2, RefreshCw, XCircle } from "lucide-react";
import { useState } from "react";

interface SyncStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncStatusModal = ({ isOpen, onClose }: SyncStatusModalProps) => {
  const { tasks, retryTask, removeTask } = useMutationQueue();
  const [viewingPayload, setViewingPayload] = useState<number | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'processing': return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Offline Sync Queue" size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p>All clear! No pending changes.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div 
              key={task.id} 
              className={`p-4 rounded-lg border ${
                task.status === 'failed' 
                  ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' 
                  : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getStatusIcon(task.status)}</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      {task.type.toUpperCase()} {task.tableName}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Created: {formatDate(task.timestamp, { format: 'medium' })}
                    </p>
                    
                    {task.error && (
                      <div className="mt-2 text-sm text-red-600 dark:text-red-400 bg-white/50 dark:bg-black/20 p-2 rounded flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{task.error}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {task.status === 'failed' && (
                    <Button 
                      size="xs" 
                      variant="primary" 
                      onClick={() => retryTask(task.id!)}
                      leftIcon={<RefreshCw size={12} />}
                    >
                      Retry
                    </Button>
                  )}
                  <Button 
                    size="xs" 
                    variant="danger" 
                    onClick={() => removeTask(task.id!)}
                    leftIcon={<Trash2 size={12} />}
                  >
                    Discard
                  </Button>
                </div>
              </div>

              {/* Payload Viewer Toggle */}
              <div className="mt-3 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                <button 
                  onClick={() => setViewingPayload(viewingPayload === task.id ? null : task.id!)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {viewingPayload === task.id ? "Hide Data" : "View Data Payload"}
                </button>
                
                {viewingPayload === task.id && (
                  <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-[10px] font-mono overflow-x-auto text-gray-700 dark:text-gray-300">
                    {JSON.stringify(task.payload, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
};