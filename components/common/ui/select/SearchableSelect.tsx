// path: components/common/ui/select/SearchableSelect.tsx
'use client';

import { Label } from '@/components/common/ui/label/Label';
import { useState, useRef, useEffect, useMemo, useLayoutEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronDown, FiX, FiSearch } from 'react-icons/fi';
import { ButtonSpinner } from '../LoadingSpinner';

export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: Option[];
  value?: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
  maxHeight?: number;
  noOptionsMessage?: string;
  loading?: boolean;
  required?: boolean;
  error?: boolean;
  sortOptions?: boolean;
  label?: string;
  serverSide?: boolean;
  onSearch?: (term: string) => void;
  isLoading?: boolean;
}

const RENDER_LIMIT = 100;

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options = [],
  value = null,
  onChange,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search options...',
  className = '',
  disabled = false,
  clearable = true,
  maxHeight = 250,
  noOptionsMessage = 'No options found',
  error = false,
  sortOptions = true,
  label = '',
  serverSide = false,
  onSearch,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const listboxId = useId();

  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const filteredOptions = useMemo(() => {
    if (serverSide) return options;
    const processedOptions = [...options];

    // Client-side natural sort
    if (sortOptions) {
      processedOptions.sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { sensitivity: 'base', numeric: true })
      );
    }

    if (!searchTerm.trim()) return processedOptions;

    return processedOptions.filter((option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm, sortOptions, serverSide]);

  const visibleOptions = useMemo(() => {
    return filteredOptions.slice(0, RENDER_LIMIT);
  }, [filteredOptions]);

  const hasMoreOptions = filteredOptions.length > RENDER_LIMIT;
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );
  const selectedLabel = selectedOption?.label || '';
  const hasValue = !!value;

  useEffect(() => {
    if (serverSide && onSearch) {
      const handler = setTimeout(() => {
        onSearch(searchTerm);
      }, 300);
      return () => clearTimeout(handler);
    }
  }, [searchTerm, serverSide, onSearch]);

  useLayoutEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const shouldFlip = spaceBelow < maxHeight && rect.top > maxHeight;

      setDropdownStyle({
        position: 'fixed',
        top: shouldFlip ? 'auto' : `${rect.bottom + 4}px`,
        bottom: shouldFlip ? `${viewportHeight - rect.top + 4}px` : 'auto',
        left: `${rect.left}px`,
        // Use minWidth instead of strict width to allow expansion for long text
        minWidth: `${rect.width}px`,
        maxWidth: '90vw', // Prevent going off-screen on small devices
        zIndex: 99999,
      });
    }
  }, [isOpen, maxHeight]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = (event: Event) => {
      if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
        return;
      }
      setIsOpen(false);
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    } else {
      if (!serverSide) setSearchTerm('');
      setFocusedIndex(-1);
    }
  }, [isOpen, serverSide]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (!isOpen) setIsOpen(true);
        else if (focusedIndex >= 0 && visibleOptions[focusedIndex]) {
          handleOptionSelect(visibleOptions[focusedIndex].value);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) setIsOpen(true);
        else setFocusedIndex((prev) => (prev < visibleOptions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) setFocusedIndex((prev) => (prev > 0 ? prev - 1 : visibleOptions.length - 1));
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  useEffect(() => {
    if (focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [focusedIndex]);

  const handleOptionSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const toggleDropdown = () => {
    if (!disabled) setIsOpen(!isOpen);
  };

  const baseClasses = `relative w-full rounded-md border px-3 py-2 transition-all duration-200 cursor-pointer
    ${
      error
        ? 'border-red-300 dark:border-red-600 focus-within:ring-red-500'
        : 'border-gray-300 dark:border-gray-600 focus-within:ring-blue-500'
    }
    ${
      disabled
        ? 'bg-gray-100 cursor-not-allowed dark:bg-gray-700 text-gray-500'
        : `${
            hasValue ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'
          } hover:border-gray-400 dark:hover:border-gray-500 text-gray-900 dark:text-white`
    }
    focus-within:ring-2 focus-within:outline-none`;

  const DropdownContent = (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="fixed bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="p-2 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400"
            autoComplete="off"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <ButtonSpinner size="sm" />
            </div>
          )}
        </div>
      </div>

      <div
        className="overflow-y-auto custom-scrollbar"
        style={{ maxHeight: `${maxHeight}px` }}
        role="listbox"
        id={listboxId}
      >
        {visibleOptions.length === 0 && !isLoading ? (
          <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center italic">
            {noOptionsMessage}
          </div>
        ) : (
          <>
            {visibleOptions.map((option, index) => (
              <div
                key={option.value}
                ref={(el) => {
                  optionRefs.current[index] = el;
                }}
                className={`
                    px-3 py-2 text-sm cursor-pointer transition-colors border-b border-transparent
                    ${
                      option.disabled
                        ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'text-gray-900 dark:text-white'
                    }
                    ${
                      index === focusedIndex
                        ? 'bg-blue-50 dark:bg-blue-900/40'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                    ${
                      option.value === value
                        ? 'bg-blue-100 dark:bg-blue-900/60 font-semibold text-blue-700 dark:text-blue-300'
                        : ''
                    }
                `}
                onClick={() => !option.disabled && handleOptionSelect(option.value)}
                role="option"
                aria-selected={option.value === value}
              >
                {option.label}
              </div>
            ))}
            {hasMoreOptions && (
              <div className="px-3 py-2 text-xs text-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 italic">
                Showing first {RENDER_LIMIT} options. Type to refine...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className={className}>
      {label && <Label className="mb-1.5 block">{label}</Label>}

      <div
        ref={triggerRef}
        className={`${baseClasses.trim()} ${
          isOpen ? 'ring-2 ring-blue-500 dark:ring-blue-600 border-blue-500' : ''
        }`}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
      >
        <div className="flex items-center justify-between">
          <span
            className={`block truncate ${!selectedLabel ? 'text-gray-500 dark:text-gray-400' : ''}`}
          >
            {selectedLabel || placeholder}
          </span>
          <div className="flex items-center gap-1.5 text-gray-400">
            {clearable && value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                tabIndex={-1}
                aria-label="Clear selection"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            )}
            <FiChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </div>

      {isOpen && typeof document !== 'undefined' && createPortal(DropdownContent, document.body)}
    </div>
  );
};
