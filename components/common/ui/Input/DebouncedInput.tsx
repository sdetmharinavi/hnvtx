'use client';

import { useState, useEffect, useRef } from 'react';
import Input, { InputProps } from './Input';

interface DebouncedInputProps extends Omit<InputProps, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  debounce?: number;
}

export const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 450,
  onClear,
  ...props
}: DebouncedInputProps) => {
  // Local state for immediate UI feedback
  const [value, setValue] = useState(initialValue);
  
  // Ref to track the last value we successfully notified the parent about.
  // Initialize with initialValue so we don't trigger unnecessary syncs on mount.
  const lastNotificationRef = useRef(initialValue);
  
  // Ref to hold the timer ID so we can clear it on unmount or on new input
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Sync from Parent (External Updates)
  // Example: User clicks "Clear Filters" in parent, or URL param changes.
  useEffect(() => {
    // If the prop value differs from the last thing we sent, it implies an external change.
    // We update our local state to match.
    if (initialValue !== lastNotificationRef.current) {
      setValue(initialValue);
      // Update our ref so we accept this as the new baseline
      lastNotificationRef.current = initialValue;
    }
  }, [initialValue]);

  // 2. Handle Local Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue); // Update UI immediately

    // Clear any pending notification
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      // Only notify parent if the value is actually different from what they last knew
      if (newValue !== lastNotificationRef.current) {
        lastNotificationRef.current = newValue;
        onChange(newValue);
      }
    }, debounce);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <Input
      {...props}
      value={value}
      onChange={handleInputChange}
      // Handle immediate clearing logic
      onClear={() => {
        // 1. Kill any pending debounce that might overwrite this clear
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        
        // 2. Update local state
        setValue('');
        
        // 3. Sync ref immediately so effect #1 doesn't undo this
        lastNotificationRef.current = ''; 
        
        // 4. Notify parent immediately (bypass debounce for clear)
        onChange(''); 
        
        // 5. Call custom onClear prop if exists
        if (onClear) onClear();
      }}
    />
  );
};