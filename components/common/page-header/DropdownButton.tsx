'use client';
import { Button } from '@/components/common/ui';
import { FiChevronDown } from 'react-icons/fi';
import { cn } from '@/lib/utils';

import { ButtonProps } from '@/components/common/ui/Button/Button';
import { useState } from 'react';

export interface ActionButton extends Omit<ButtonProps, 'is_dropdown'> {
  label: string;
  hideOnMobile?: boolean;
  hideTextOnMobile?: boolean;
  priority?: 'high' | 'medium' | 'low'; // For mobile button ordering
  'data-dropdown'?: boolean; // Using data attribute instead of custom prop
  dropdownoptions?: Array<{
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }>;
}

export const DropdownButton: React.FC<ActionButton> = ({
  label,
  dropdownoptions = [],
  disabled,
  variant = 'outline',
  leftIcon,
  className,
  // // Destructure these to prevent them from being passed to the DOM/Button
  // hideOnMobile,
  // hideTextOnMobile,
  // priority,
  // 'data-dropdown': dataDropdown,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative" style={{ zIndex: 50 }}>
      <Button
        {...props}
        variant={variant}
        disabled={disabled}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        className={cn('flex items-center gap-2', className)}
        leftIcon={leftIcon}
        rightIcon={
          <FiChevronDown
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        }
      >
        {label}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40"
            onClick={() => {
              setIsOpen(false);
            }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 40,
            }}
          />
          {/* Dropdown Menu */}
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-md border-2 border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {dropdownoptions.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  option.onClick();
                  setIsOpen(false);
                }}
                disabled={option.disabled}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};