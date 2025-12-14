// components/table/TableColumnSelector.tsx
import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Column } from "@/hooks/database/excel-queries/excel-helpers";
import { TableOrViewName, Row } from "@/hooks/database";

interface TableColumnSelectorProps<T extends TableOrViewName> {
  columns: Column<Row<T>>[];
  visibleColumns: string[];
  setVisibleColumns: (columns: string[]) => void;
  showColumnSelector: boolean;
  setShowColumnSelector: (show: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export function TableColumnSelector<T extends TableOrViewName>({
  columns,
  visibleColumns,
  setVisibleColumns,
  showColumnSelector,
  setShowColumnSelector,
  triggerRef,
}: TableColumnSelectorProps<T>) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  // Calculate position
  useLayoutEffect(() => {
    if (showColumnSelector && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownWidth = 256; 
      
      let left = rect.right - dropdownWidth;
      if (left < 10) left = rect.left; 

      // Adjust if it goes off bottom of screen
      let top = rect.bottom + 4;
      const viewportHeight = window.innerHeight;
      const estimatedHeight = Math.min(300, 50 + columns.length * 36); 
      
      if (top + estimatedHeight > viewportHeight) {
          // Position above if not enough space below
          top = rect.top - estimatedHeight - 4;
      }

      setStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: `${dropdownWidth}px`,
        zIndex: 99999, // Ensure extremely high z-index
      });
    }
  }, [showColumnSelector, triggerRef, columns.length]);

  // Handle interactions
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setShowColumnSelector(false);
      }
    }

    function handleScroll(e: Event) {
      // THE FIX: Allow scrolling INSIDE the dropdown.
      if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
        return;
      }
      // If scrolling happens elsewhere, close the dropdown
      setShowColumnSelector(false);
    }

    if (showColumnSelector) {
      document.addEventListener('mousedown', handleClickOutside, false);
      document.addEventListener('scroll', handleScroll, true); 
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, false);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [showColumnSelector, setShowColumnSelector, triggerRef]);

  if (!showColumnSelector) return null;

  const content = (
    <div
      ref={dropdownRef}
      style={style}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl flex flex-col max-h-[300px] animate-in fade-in zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 shrink-0 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 rounded-t-lg">
        <h4 className="font-semibold text-xs text-gray-900 dark:text-white uppercase tracking-wider">Columns</h4>
        <span className="text-[10px] text-gray-500 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">
          {visibleColumns.length}/{columns.length}
        </span>
      </div>
      
      <div className="p-2 overflow-y-auto custom-scrollbar flex-1">
        {columns.map((column) => (
          <label
            key={column.key}
            className="flex items-center gap-3 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded cursor-pointer transition-colors group"
          >
            <input
              type="checkbox"
              checked={visibleColumns.includes(column.key)}
              onChange={(e) => {
                setVisibleColumns(
                  e.target.checked
                    ? [...visibleColumns, column.key]
                    : visibleColumns.filter((k) => k !== column.key)
                );
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 shrink-0 transition-all"
            />
            <span className={`text-sm truncate select-none ${visibleColumns.includes(column.key) ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
              {column.title}
            </span>
          </label>
        ))}
      </div>
      
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 shrink-0 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg flex gap-2">
        <button
            onClick={() => setVisibleColumns(columns.map(c => c.key))}
            className="flex-1 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
        >
            Select All
        </button>
        <button
            onClick={() => setVisibleColumns([])}
            className="flex-1 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        >
            Clear
        </button>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}