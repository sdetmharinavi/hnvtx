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
  debounce = 300,
  onClear,
  ...props
}: DebouncedInputProps) => {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue] = useDebounce(value, debounce);

  const isMounted = useRef(false);

  // Sync internal state if parent value changes externally
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Handle debounced updates to parent
  useEffect(() => {
    if (isMounted.current) {
      // THE FIX: Only propagate if the debounced value has 'caught up' to the current value.
      // This prevents stale debounced values (e.g. "text") from overwriting
      // the parent state immediately after a clear action (value is "")
      // but before the debounce timer has expired.
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
