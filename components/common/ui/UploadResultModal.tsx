// components/common/ui/UploadResultModal.tsx
'use client';

import { Modal, Button } from '@/components/common/ui';
import { EnhancedUploadResult } from '@/hooks/database';
import { CheckCircle, AlertTriangle, FileText, AlertCircle } from 'lucide-react';

interface UploadResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: EnhancedUploadResult | null;
  title?: string;
}

export function UploadResultModal({
  isOpen,
  onClose,
  result,
  title = 'Upload Results',
}: UploadResultModalProps) {
  if (!result) return null;

  const hasErrors = result.errorCount > 0;
  const hasSuccess = result.successCount > 0;
  const hasSkipped = result.skippedRows > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 text-center">
            <div className="flex justify-center mb-2">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {result.successCount}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 font-medium uppercase">
              Successful
            </div>
          </div>

          <div
            className={`p-4 rounded-lg border text-center ${
              hasErrors
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex justify-center mb-2">
              <AlertTriangle
                className={`w-6 h-6 ${
                  hasErrors ? 'text-red-600 dark:text-red-400' : 'text-gray-400'
                }`}
              />
            </div>
            <div
              className={`text-2xl font-bold ${
                hasErrors ? 'text-red-700 dark:text-red-300' : 'text-gray-500'
              }`}
            >
              {result.errorCount}
            </div>
            <div
              className={`text-xs font-medium uppercase ${
                hasErrors ? 'text-red-600 dark:text-red-400' : 'text-gray-500'
              }`}
            >
              Failed
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="flex justify-center mb-2">
              <FileText className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
              {result.totalRows}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">
              Total Processed
            </div>
          </div>
        </div>

        {hasSkipped && (
          <div className="text-center text-xs text-gray-500 italic">
            {result.skippedRows} empty rows were skipped.
          </div>
        )}

        {/* Details Section */}
        {hasErrors && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Error Details
            </h4>

            <div className="max-h-[300px] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2 w-16 text-center">Row</th>
                    <th className="px-4 py-2">Data / Column</th>
                    <th className="px-4 py-2">Error Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {result.errors.map((err, idx) => (
                    <tr key={idx} className="hover:bg-red-50/50 dark:hover:bg-red-900/10">
                      <td className="px-4 py-2 text-center font-mono text-gray-500">
                        {err.rowIndex > 0 ? err.rowIndex : '-'}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-gray-700 dark:text-gray-300">
                        {typeof err.data === 'object'
                          ? JSON.stringify(err.data).slice(0, 50) + '...'
                          : String(err.data)}
                      </td>
                      <td className="px-4 py-2 text-red-600 dark:text-red-400">{err.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
          {hasSuccess && (
            <Button onClick={onClose} variant="primary">
              Done
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
