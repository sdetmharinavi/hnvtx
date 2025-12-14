// components/common/filters/MultiSelectFilter.tsx
"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import { Filters } from "@/hooks/database";
import { Option } from "@/components/common/ui/select/SearchableSelect";
import { Label } from "@/components/common/ui/label/Label";

interface MultiSelectFilterProps {
  label: string;
  filterKey: string;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  options: Option[];
}

export const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
  label,
  filterKey,
  filters,
  setFilters,
  options,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Use state for dropdown positioning to ensure it re-renders
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const selectedValues = (filters[filterKey] as string[]) || [];

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update position when opening or scrolling
  const updatePosition = () => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: `${rect.bottom + 4}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 9999,
      });
    }
  };

  useLayoutEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleToggleOption = (value: string) => {
    setFilters((prev) => {
      const current = (prev[filterKey] as string[]) || [];
      let newValues;

      if (current.includes(value)) {
        newValues = current.filter((v) => v !== value);
      } else {
        newValues = [...current, value];
      }

      const newFilters = { ...prev };
      if (newValues.length > 0) {
        newFilters[filterKey] = newValues;
      } else {
        delete newFilters[filterKey];
      }
      return newFilters;
    });
  };

  const handleSelectAll = () => {
    const allValues = options.map((o) => o.value);
    setFilters((prev) => ({ ...prev, [filterKey]: allValues }));
  };

  const handleClear = () => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[filterKey];
      return newFilters;
    });
  };

  const DropdownContent = (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="absolute mt-1 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 animate-in fade-in zoom-in-95 duration-100 origin-top"
    >
      <div className="p-2 border-b border-gray-100 dark:border-gray-700 flex justify-between">
        <button
          onClick={handleSelectAll}
          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
        >
          Select All
        </button>
        <button
          onClick={handleClear}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          Clear
        </button>
      </div>
      <div className="max-h-60 overflow-auto p-1 custom-scrollbar">
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          return (
            <div
              key={option.value}
              onClick={() => handleToggleOption(option.value)}
              className={`relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors ${
                isSelected
                  ? "bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100"
                  : "text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {isSelected && (
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <FiCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </span>
              )}
              <span className="block truncate font-medium">{option.label}</span>
            </div>
          );
        })}
        {options.length === 0 && (
          <div className="py-2 px-2 text-xs text-gray-500 text-center">No options available</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</Label>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 ${
          selectedValues.length > 0
            ? "border-blue-500 ring-1 ring-blue-500 dark:border-blue-400 dark:ring-blue-400"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
        }`}
      >
        <span
          className={`block truncate ${
            selectedValues.length === 0
              ? "text-gray-500 dark:text-gray-400"
              : "text-gray-900 dark:text-white"
          }`}
        >
          {selectedValues.length === 0
            ? `Select ${label}...`
            : selectedValues.length === options.length
            ? `All ${label} (${selectedValues.length})`
            : `${selectedValues.length} selected`}
        </span>
        <FiChevronDown
          className={`ml-2 h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* THE FIX: Use createPortal to render the dropdown outside the parent container */}
      {isOpen && typeof document !== 'undefined' && createPortal(DropdownContent, document.body)}
    </div>
  );
};