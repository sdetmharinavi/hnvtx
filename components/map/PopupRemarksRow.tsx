// components/map/PopupRemarksRow.tsx
'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Edit2, Save, X } from 'lucide-react';
import { ButtonSpinner } from '@/components/common/ui';
import GenericRemarks from '@/components/common/GenericRemarks';
import { FiMessageSquare } from 'react-icons/fi';

interface PopupRemarksRowProps {
  remark?: string | null;
  isEditing: boolean;
  editText: string;
  isSaving: boolean;
  onEditClick: (e: React.MouseEvent) => void;
  onSaveClick: (e: React.MouseEvent) => void;
  onCancelClick: (e: React.MouseEvent) => void;
  onTextChange: (text: string) => void;
  canEdit?: boolean;
}

export const PopupRemarksRow: React.FC<PopupRemarksRowProps> = ({
  remark,
  isEditing,
  editText,
  isSaving,
  onEditClick,
  onSaveClick,
  onCancelClick,
  onTextChange,
  canEdit = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasRemark = remark && remark.trim() !== '';

  // Show the row if there's a remark OR if we can edit (to allow adding new remarks)
  if (!hasRemark && !canEdit) return null;

  return (
    <div className="border-b border-gray-200/50 dark:border-gray-700/30 last:border-0">
      {/* Compact Header */}
      <div
        className={`flex items-center gap-2 py-1.5 px-2.5 transition-colors ${
          canEdit ? 'hover:bg-amber-50/50 dark:hover:bg-amber-900/10 cursor-pointer' : 'opacity-60'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          if (canEdit) setIsExpanded(!isExpanded);
        }}
        role={canEdit ? 'button' : undefined}
        aria-expanded={isExpanded}
        tabIndex={canEdit ? 0 : undefined}
        onKeyDown={(e) => {
          if (canEdit && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        {canEdit && (
          <div className="shrink-0 text-gray-400 dark:text-gray-500">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        )}
        <GenericRemarks remark={remark || ''} />
        {!hasRemark && canEdit && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500 italic">
            <FiMessageSquare className="shrink-0 mt-0.5" />
          </span>
        )}
        {canEdit && (
          <span className="shrink-0 text-[10px] text-gray-400 dark:text-gray-500 font-medium">
            {isExpanded ? 'Close' : 'See Remarks'}
          </span>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && canEdit && (
        <div className="px-2.5 pb-2 bg-amber-50/30 dark:bg-amber-900/10">
          <div className="bg-white dark:bg-gray-900/40 rounded border border-amber-200/60 dark:border-amber-700/50 p-2.5">
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  className="w-full text-xs p-2 rounded border border-amber-300 dark:border-amber-700 focus:ring-1 focus:ring-amber-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                  rows={4}
                  value={editText}
                  onChange={(e) => onTextChange(e.target.value)}
                  placeholder="Enter remarks here..."
                  onKeyDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={onCancelClick}
                    className="px-2 py-1 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors flex items-center gap-1"
                    title="Cancel"
                  >
                    <X size={12} />
                    Cancel
                  </button>
                  <button
                    onClick={onSaveClick}
                    disabled={isSaving}
                    className="px-2 py-1 rounded text-xs bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 transition-colors flex items-center gap-1"
                    title="Save"
                  >
                    {isSaving ? <ButtonSpinner size="xs" /> : <Save size={12} />}
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed min-h-[1.2em]">
                  {remark || (
                    <span className="italic text-gray-400 dark:text-gray-500">
                      No remarks added yet. Click edit to add.
                    </span>
                  )}
                </p>
                <div className="flex justify-end pt-1 border-t border-amber-100 dark:border-amber-900/50">
                  <button
                    onClick={onEditClick}
                    className="px-2 py-1 rounded text-xs hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-400 transition-colors flex items-center gap-1"
                    title="Edit Remarks"
                  >
                    <Edit2 size={12} />
                    Edit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
