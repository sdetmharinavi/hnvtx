"use client";

import { Label } from "@/components/common/ui/label/Label";
import { useState, useRef, useEffect, useMemo, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { FiChevronDown, FiX, FiSearch } from "react-icons/fi";

// The Option interface remains the same
interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

export type { Option };

// The props interface remains the same
interface SearchableSelectProps {
  options: Option[];
  value?: string;
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
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options = [],
  value = "",
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search options...",
  className = "",
  disabled = false,
  clearable = true,
  maxHeight = 200,
  noOptionsMessage = "No options found",
  loading = false,
  required = false,
  error = false,
  sortOptions = true,
  label = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  // NEW: State for the dropdown's calculated position
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  // Refs for the trigger, the dropdown itself, and the list items
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Memoized filtering and sorting logic (no changes needed here)
  const filteredOptions = useMemo(() => {
    const processedOptions = [...options];
    if (sortOptions) {
      processedOptions.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base', numeric: true }));
    }
    if (!searchTerm.trim()) return processedOptions;
    return processedOptions.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm, sortOptions]);

  const selectedOption = options.find(option => option.value === value);
  const selectedLabel = selectedOption?.label || "";
  const hasValue = selectedLabel.length > 0;

  // NEW: Effect to calculate dropdown position using useLayoutEffect for precision
  useLayoutEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        // Position fixed relative to the viewport
        position: 'fixed', 
        top: `${rect.bottom + 4}px`, // 4px gap below the trigger
        left: `${rect.left}px`,
        width: `${rect.width}px`, // Match the trigger's width
      });
    }
  }, [isOpen]);

  // Updated Effect to handle clicks outside both the trigger and the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
        setFocusedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Effect to focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small timeout to allow the portal to render and be focusable
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [isOpen]);
  
  // Keyboard navigation logic (no changes needed here)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    switch (e.key) {
      case "Enter":
        e.preventDefault();
        if (!isOpen) setIsOpen(true);
        else if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
          handleOptionSelect(filteredOptions[focusedIndex].value);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSearchTerm("");
        setFocusedIndex(-1);
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) setIsOpen(true);
        else setFocusedIndex(prev => prev < filteredOptions.length - 1 ? prev + 1 : 0);
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isOpen) setFocusedIndex(prev => prev > 0 ? prev - 1 : filteredOptions.length - 1);
        break;
      case "Tab":
        setIsOpen(false);
        setSearchTerm("");
        setFocusedIndex(-1);
        break;
    }
  };

  // Scroll focused option into view (no changes needed here)
  useEffect(() => {
    if (focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [focusedIndex]);

  // Handlers (no changes needed here)
  const handleOptionSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
    setFocusedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm("");
        setFocusedIndex(-1);
      }
    }
  };
  
  const baseClasses = `relative w-full rounded-md border px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:outline-none transition-colors cursor-pointer ${error ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"} ${disabled ? "bg-gray-100 cursor-not-allowed dark:bg-gray-600" : `${hasValue ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-900"} hover:border-gray-400 dark:hover:border-gray-500`} dark:text-white dark:focus-within:ring-blue-600`;

  // Extracted Dropdown JSX to be used in the portal
  const DropdownContent = (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="z-[999] bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg"
    >
      <div className="p-2 border-b border-gray-200 dark:border-gray-600">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setFocusedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>
      <div
        className="overflow-y-auto"
        style={{ maxHeight: `${maxHeight}px` }}
        role="listbox"
      >
        {loading ? (
          <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">Loading...</div>
        ) : filteredOptions.length === 0 ? (
          <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">{noOptionsMessage}</div>
        ) : (
          filteredOptions.map((option, index) => (
            <div
              key={option.value}
              ref={(el) => { optionRefs.current[index] = el; }}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${option.disabled ? "text-gray-400 dark:text-gray-500 cursor-not-allowed" : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"} ${index === focusedIndex ? "bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200" : ""} ${option.value === value ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium" : ""}`}
              onClick={() => !option.disabled && handleOptionSelect(option.value)}
              role="option"
              aria-selected={option.value === value}
            >
              {option.label}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div ref={triggerRef} className={`relative ${className}`}>
      {/* The trigger element remains in its original position */}
      <Label>{label}</Label>
      <div
        className={`${baseClasses.trim()} ${isOpen ? "ring-2 ring-blue-500 dark:ring-blue-600" : ""}`}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-controls="options-list"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-required={required}
      >
        <div className="flex items-center justify-between">
          <span className={`block truncate ${!selectedLabel ? "text-gray-500 dark:text-gray-400" : ""}`}>
            {selectedLabel || placeholder}
          </span>
          <div className="flex items-center gap-1">
            {clearable && value && !disabled && (
              <button type="button" onClick={handleClear} className="flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>
                <FiX className="w-3 h-3" />
              </button>
            )}
            <FiChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </div>
        </div>
      </div>

      {/* RENDER THE DROPDOWN IN A PORTAL */}
      {isOpen && typeof document !== 'undefined' && createPortal(DropdownContent, document.body)}
    </div>
  );
};