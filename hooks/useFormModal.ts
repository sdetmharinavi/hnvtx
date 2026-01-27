// hooks/useFormModal.ts
import { useEffect, useMemo } from 'react';
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedDefaultValues = useMemo(() => defaultValues, []);

  useEffect(() => {
    if (isOpen) {
      if (record) {
        const values = mapRecord ? mapRecord(record) : (record as unknown as T);
        reset(values);
      } else {
        reset(memoizedDefaultValues);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, record, reset, memoizedDefaultValues, ...resetDeps]);

  return { form, isEditMode };
}