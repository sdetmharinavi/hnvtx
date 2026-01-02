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

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isMounted.current) {
      if (debouncedValue !== initialValue) {
        onChange(debouncedValue);
      }
    } else {
      isMounted.current = true;
    }
  }, [debouncedValue, onChange, initialValue]);

  return (
    <Input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      // THE FIX: Chain parent onClear if provided
      onClear={() => {
        setValue('');
        onChange('');
        if (onClear) onClear();
      }}
    />
  );
};
