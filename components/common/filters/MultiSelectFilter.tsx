'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronDown, FiCheck, FiLoader, FiSearch } from 'react-icons/fi';
import { Filters } from '@/hooks/database';
import { Option } from '@/components/common/ui/select/SearchableSelect';
import { Label } from '@/components/common/ui/label/Label';
import useIsomorphicLayoutEffect from '@/hooks/useIsomorphicLayoutEffect';

const normalizeToStringArray = (value: Filters[string]): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return value ? [String(value)] : [];
  }
  return [];
};

interface MultiSelectFilterProps {
  label?: string;
  showLabel?: boolean;
  filterKey: string;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  options: Option[];
  placeholder?: string;
  isLoading?: boolean;
}

export const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
  label,
  showLabel = true,
  filterKey,
  filters,
  setFilters,
  options,
  placeholder,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // NEW: Local search state

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const rawValue = filters[filterKey];
  const selectedValues = normalizeToStringArray(rawValue);

  // NEW: Filter options based on local search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const lowerQuery = searchTerm.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(lowerQuery));
  }, [options, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isOpen) return;
      const target = event.target as Node;
      const isInsideTrigger = triggerRef.current && triggerRef.current.contains(target);
      const isInsideDropdown = dropdownRef.current && dropdownRef.current.contains(target);
      if (!isInsideTrigger && !isInsideDropdown) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Reset search term and focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

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

  useIsomorphicLayoutEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  const handleToggleOption = (e: React.MouseEvent, value: string) => {
    e.preventDefault();
    e.stopPropagation();
    setFilters((prev) => {
      const raw = prev[filterKey];
      const current = normalizeToStringArray(raw);
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

    // Auto-focus search input after selection to allow continuous typing
    searchInputRef.current?.focus();
  };

  const handleSelectAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Select only from the currently filtered view, or all if no search
    const valuesToAdd = filteredOptions.map((o) => o.value);
    setFilters((prev) => {
      const current = new Set(normalizeToStringArray(prev[filterKey]));
      valuesToAdd.forEach((val) => current.add(val));
      return { ...prev, [filterKey]: Array.from(current) };
    });
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
      className='fixed mt-1 rounded-md border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 animate-in fade-in zoom-in-95 duration-100 origin-top flex flex-col'
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}>
      {/* Search Header */}
      <div className='p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-t-md'>
        <div className='relative mb-2'>
          <FiSearch className='absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5' />
          <input
            ref={searchInputRef}
            type='text'
            placeholder='Search options...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className='w-full pl-8 pr-2 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow'
          />
        </div>
        <div className='flex justify-between items-center px-1'>
          <button
            onClick={handleSelectAll}
            className='text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium transition-colors'>
            Select All {searchTerm ? 'Filtered' : ''}
          </button>
          <button
            onClick={handleClear}
            className='text-[11px] text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors'
            disabled={isLoading || selectedValues.length === 0}>
            Clear Selected
          </button>
        </div>
      </div>

      {/* Options List */}
      <div className='max-h-60 overflow-auto p-1 custom-scrollbar'>
        {isLoading ? (
          <div className='flex items-center justify-center gap-2 p-4 text-xs text-gray-500'>
            <FiLoader className='animate-spin' />
            Loading...
          </div>
        ) : filteredOptions.length === 0 ? (
          <div className='py-4 px-2 text-xs text-gray-500 text-center italic'>
            {searchTerm ? 'No matches found' : 'No options available'}
          </div>
        ) : (
          filteredOptions.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            return (
              <div
                key={option.value}
                title={option.label}
                onClick={(e) => handleToggleOption(e, option.value)}
                className={`relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-xs text-wrap outline-none transition-colors ${
                  isSelected
                    ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100'
                    : 'text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700'
                }`}>
                {isSelected && (
                  <span className='absolute left-2 flex h-3.5 w-3.5 items-center justify-center'>
                    <FiCheck className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                  </span>
                )}
                <span
                  className={`block truncate ${isSelected ? 'font-semibold pl-5' : 'font-medium'}`}>
                  {option.label}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  let buttonText = placeholder || label || 'Options';
  if (selectedValues.length > 0) {
    if (selectedValues.length === options.length && options.length > 0) {
      buttonText = label ? `All ${label}` : 'All Selected';
    } else {
      buttonText = label
        ? `${label} (${selectedValues.length})`
        : `${selectedValues.length} Selected`;
    }
  }

  return (
    <div className='space-y-2 relative' ref={containerRef}>
      {label && showLabel && (
        <Label className='text-sm font-medium text-gray-700 dark:text-gray-300'>{label}</Label>
      )}
      <button
        ref={triggerRef}
        type='button'
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 ${
          selectedValues.length > 0
            ? 'border-blue-500 ring-1 ring-blue-500 dark:border-blue-400 dark:ring-blue-400'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}>
        <span
          className={`block truncate ${
            selectedValues.length === 0
              ? 'text-gray-500 dark:text-gray-400'
              : 'text-gray-900 dark:text-white font-medium'
          }`}>
          {buttonText}
        </span>
        <FiChevronDown
          className={`ml-2 h-4 w-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-500' : 'text-gray-400'
          }`}
        />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(DropdownContent, document.body)}
    </div>
  );
};
