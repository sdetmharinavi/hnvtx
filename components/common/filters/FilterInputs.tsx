import { SearchableSelect, Option } from '@/components/common/ui/select/SearchableSelect';
import { Input } from '@/components/common/ui/Input';
import { Filters } from '@/hooks/database';
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select/Select';

// --- TYPE DEFINITIONS ---

interface FilterWrapperProps {
  label: string;
}

interface SelectFilterProps extends FilterWrapperProps {
  filterKey: string; // The key to modify in the filters object
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  options: Option[];
  placeholder?: string;
}

interface InputFilterProps extends FilterWrapperProps {
  filterKey: string;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  placeholder?: string;
}

// --- COMPONENTS ---

export const SelectFilter: React.FC<SelectFilterProps> = ({
  label,
  filterKey,
  filters,
  setFilters,
  options,
  placeholder,
}) => {
  // Safely extract the current value, ensuring it's a string for the component.
  const currentValue = filters[filterKey];
  const valueAsString =
    typeof currentValue === 'string' || typeof currentValue === 'number'
      ? String(currentValue)
      : '';

  const handleChange = (newValue: string | null) => {
    setFilters((prevFilters) => {
      const newFilters = { ...prevFilters };
      if (newValue === null || newValue === '') {
        // When cleared, remove the key entirely for a cleaner state.
        delete newFilters[filterKey];
      } else {
        newFilters[filterKey] = newValue;
      }
      return newFilters;
    });
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <SearchableSelect
        options={options}
        value={valueAsString}
        onChange={handleChange}
        placeholder={placeholder || `All ${label}s`}
        clearable
      />
      {/* <Select
        value={(valueAsString as string) ?? ''}
        onValueChange={(value) => handleChange(value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder ?? 'Select'} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select> */}
    </div>
  );
};

export const InputFilter: React.FC<InputFilterProps> = ({
  label,
  filterKey,
  filters,
  setFilters,
  placeholder,
}) => {
  // Safely extract the current value
  const currentValue = filters[filterKey];
  const valueAsString =
    typeof currentValue === 'string' || typeof currentValue === 'number'
      ? String(currentValue)
      : '';

  const handleChange = (newValue: string) => {
    setFilters((prevFilters) => {
      const newFilters = { ...prevFilters };
      if (newValue === '') {
        delete newFilters[filterKey];
      } else {
        newFilters[filterKey] = newValue;
      }
      return newFilters;
    });
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <Input
        type="text"
        value={valueAsString}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder || `Filter by ${label}...`}
      />
    </div>
  );
};
