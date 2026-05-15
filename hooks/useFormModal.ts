// hooks/useFormModal.ts
import { useEffect, useRef } from 'react';
import { useForm, FieldValues, UseFormReturn, DefaultValues, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodType } from 'zod';

interface UseFormModalProps<T extends FieldValues, R = unknown> {
  isOpen: boolean;
  schema: ZodType<T, FieldValues>;
  defaultValues: DefaultValues<T>;
  record?: R | null;
  mapRecord?: (record: R) => T;
  resetDeps?: unknown[];
}

export function useFormModal<T extends FieldValues, R = unknown>({
  isOpen,
  schema,
  defaultValues,
  record,
  mapRecord,
  resetDeps = [],
}: UseFormModalProps<T, R>): { form: UseFormReturn<T>; isEditMode: boolean } {
  const form = useForm<T>({
    resolver: zodResolver(schema) as unknown as Resolver<T, unknown>,
    defaultValues,
  });

  const isEditMode = !!record;
  const { reset } = form;

  // THE FIX: Use a mutable ref to always hold the latest default values.
  // This prevents the modal from getting stuck with stale initial values
  // (like an empty category) without triggering infinite re-renders.
  const defaultValuesRef = useRef(defaultValues);

  useEffect(() => {
    defaultValuesRef.current = defaultValues;
  }, [defaultValues]);

  useEffect(() => {
    if (isOpen) {
      if (record) {
        const values = mapRecord ? mapRecord(record) : (record as unknown as T);
        reset(values);
      } else {
        // Reset using the freshest default values available at the moment of opening
        reset(defaultValuesRef.current);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, record, reset, ...resetDeps]);

  return { form, isEditMode };
}
