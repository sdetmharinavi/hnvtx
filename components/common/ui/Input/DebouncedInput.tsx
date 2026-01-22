'use client';

import { useState, useEffect, useRef } from 'react';
import Input, { InputProps } from './Input';
import { useDebounce } from 'use-debounce';

interface DebouncedInputProps extends Omit<InputProps, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  debounce?: number;
}

export const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 600,
  onClear,
  ...props
}: DebouncedInputProps) => {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue] = useDebounce(value, debounce);

  const isMounted = useRef(false);

  // THE FIX: Sync internal state with parent ONLY if the change originated externally.
  // We determine this by checking if the incoming value matches the last debounced value we sent.
  // If they match, it's just the parent "echoing" our change back to us -> Ignore it to preserve current typing.
  // If they don't match, it's a real external change (e.g. "Clear Filters" button clicked) -> Update local state.
  useEffect(() => {
    if (initialValue !== value) {
      if (initialValue !== debouncedValue) {
        setValue(initialValue);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]); // We rely on closure state for 'value' and 'debouncedValue' to keep dep array clean, or include them carefully.
  // Actually, including them in deps might trigger too often. The logic relies on the specific moment initialValue changes.

  // Handle debounced updates to parent
  useEffect(() => {
    if (isMounted.current) {
      // Only propagate if the debounced value has 'caught up' to the current value.
      // AND it's different from what the parent already knows (optimization).
      if (value === debouncedValue && debouncedValue !== initialValue) {
        onChange(debouncedValue);
      }
    } else {
      isMounted.current = true;
    }
  }, [debouncedValue, value, initialValue, onChange]);

  return (
    <Input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      // Handle immediate clearing
      onClear={() => {
        setValue(''); // Clear local state immediately for UI
        onChange(''); // Notify parent immediately
        if (onClear) onClear();
      }}
    />
  );
};
