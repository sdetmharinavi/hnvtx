// components/lookup/LookupModal.tsx
'use client';

import { Input } from '@/components/common/ui/Input';
import {
  lookup_typesInsertSchema,
  Lookup_typesInsertSchema,
  Lookup_typesRowSchema,
} from '@/schemas/zod-schemas';
import { snakeToTitleCase } from '@/utils/formatters';
import { useCallback, useEffect, useState } from 'react';
import z from 'zod';
import { generateCodeFromName } from '@/config/helper-functions';
import { BaseFormModal } from '@/components/common/form/BaseFormModal';
import { useFormModal } from '@/hooks/useFormModal';

interface LookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Lookup_typesInsertSchema) => void;
  isLoading: boolean;
  editingLookup?: Lookup_typesRowSchema | null;
  category?: string;
  categories?: Lookup_typesRowSchema[];
}

const getUniqueCategories = (data?: Lookup_typesRowSchema[]) => {
  if (!data) return [];
  const categoriesSet = new Set<string>();
  data.forEach((item) => {
    if (item.category) {
      categoriesSet.add(item.category);
    }
  });
  return Array.from(categoriesSet).sort();
};

// Define Schema locally or reuse from zod-schemas
const lookupTypeFormSchema = lookup_typesInsertSchema.pick({
  category: true,
  code: true,
  description: true,
  name: true,
  sort_order: true,
  is_system_default: true,
  status: true,
  is_ring_based: true,
});
type LookupTypeFormData = z.infer<typeof lookupTypeFormSchema>;

export function LookupModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editingLookup,
  category,
  categories,
}: LookupModalProps) {
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);
  const uniqueCategories = getUniqueCategories(categories);

  const { form, isEditMode } = useFormModal<LookupTypeFormData, Lookup_typesRowSchema>({
    isOpen,
    schema: lookupTypeFormSchema,
    record: editingLookup,
    defaultValues: {
      category: category || '', // Fallback to current category prop
      code: '',
      description: '',
      name: '',
      sort_order: 0,
      is_system_default: false,
      status: true,
      is_ring_based: false,
    },
    mapRecord: (record) => ({
      category: record.category || category || '',
      code: record.code || '',
      description: record.description || '',
      name: record.name || '',
      sort_order: record.sort_order || 0,
      is_system_default: record.is_system_default || false,
      status: record.status !== false,
      is_ring_based: record.is_ring_based || false,
    }),
    resetDeps: [category], // Important: Re-reset if category prop changes
  });

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const watchedName = watch('name');
  const watchedCategory = watch('category');
  const watchedCode = watch('code');

  // Handle manual code edit flag
  useEffect(() => {
    if (isOpen) {
      setIsCodeManuallyEdited(!!editingLookup);
    }
  }, [isOpen, editingLookup]);

  // Auto-generate code
  useEffect(() => {
    if (!isCodeManuallyEdited && !isEditMode && watchedName) {
      const generatedCode = generateCodeFromName(watchedName);
      setValue('code', generatedCode, { shouldValidate: true });
    }
  }, [watchedName, isCodeManuallyEdited, isEditMode, setValue]);

  const onValidSubmit = useCallback(
    (data: LookupTypeFormData) => {
      const submissionData = {
        ...data,
        code: data.code?.trim() || null,
        description: data.description?.trim() || null,
        name: data.name?.trim(),
        category: data.category?.trim(),
      };
      onSubmit(submissionData as Lookup_typesInsertSchema);
    },
    [onSubmit],
  );

  const showSystemFlags = watchedCategory === 'SYSTEM_TYPES';

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title='Lookup Type'
      isEditMode={isEditMode}
      isLoading={isLoading}
      form={form}
      onSubmit={onValidSubmit}
      heightClass='h-auto'
    >
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div className='md:col-span-2'>
          <label
            htmlFor='category'
            className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'
          >
            Category <span className='text-red-500 dark:text-red-400'>*</span>
          </label>
          {isEditMode || category ? (
            <Input
              type='text'
              {...register('category')}
              readOnly
              className='bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              value={watchedCategory || ''}
            />
          ) : (
            <select
              {...register('category')}
              className='w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none border-gray-300 dark:border-gray-600'
              disabled={isLoading}
              value={watchedCategory || ''}
              onChange={(e) => setValue('category', e.target.value)}
            >
              <option value=''>Select category...</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {snakeToTitleCase(cat)}
                </option>
              ))}
            </select>
          )}
          {errors.category && (
            <p className='text-xs text-red-500 dark:text-red-400 mt-1'>{errors.category.message}</p>
          )}
        </div>
        <div className='md:col-span-2'>
          <label
            htmlFor='name'
            className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'
          >
            Name <span className='text-red-500 dark:text-red-400'>*</span>
          </label>
          <Input
            type='text'
            {...register('name')}
            placeholder='Enter lookup name'
            disabled={isLoading}
            className='bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600'
          />
          {errors.name && (
            <p className='text-xs text-red-500 dark:text-red-400 mt-1'>{errors.name.message}</p>
          )}
        </div>
        <div>
          <label
            htmlFor='code'
            className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'
          >
            Code
          </label>
          <Input
            type='text'
            id='code'
            {...register('code')}
            placeholder='Auto-generated or manual'
            value={watchedCode || ''}
            disabled={isLoading}
            onChange={(e) => {
              setIsCodeManuallyEdited(true);
              setValue('code', e.target.value);
            }}
            className='bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600'
          />
          {errors.code && (
            <p className='text-xs text-red-500 dark:text-red-400 mt-1'>{errors.code.message}</p>
          )}
        </div>
        <div>
          <label
            htmlFor='sort_order'
            className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'
          >
            Sort Order
          </label>
          <Input
            type='number'
            id='sort_order'
            {...register('sort_order', { valueAsNumber: true })}
            placeholder='0'
            disabled={isLoading}
            min='0'
            className='bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600'
          />
          {errors.sort_order && (
            <p className='text-xs text-red-500 dark:text-red-400 mt-1'>
              {errors.sort_order.message}
            </p>
          )}
        </div>
        <div className='md:col-span-2'>
          <label
            htmlFor='description'
            className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'
          >
            Description
          </label>
          <textarea
            className='w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none'
            rows={3}
            {...register('description')}
            placeholder='Enter description (optional)'
            disabled={isLoading}
          />
          {errors.description && (
            <p className='text-xs text-red-500 dark:text-red-400 mt-1'>
              {errors.description.message}
            </p>
          )}
        </div>
        <div className='md:col-span-2 space-y-3'>
          <div className='flex items-center'>
            <input
              type='checkbox'
              id='status'
              {...register('status')}
              disabled={isLoading}
              className='h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-blue-600 focus:ring-blue-500'
            />
            <label htmlFor='status' className='ml-2 text-sm text-gray-700 dark:text-gray-300'>
              Active Status
            </label>
          </div>
          <div className='flex items-center'>
            <input
              type='checkbox'
              id='is_system_default'
              {...register('is_system_default')}
              disabled={isLoading || (isEditMode && !!editingLookup?.is_system_default)}
              className='h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-blue-600 focus:ring-blue-500'
            />
            <label
              htmlFor='is_system_default'
              className='ml-2 text-sm text-gray-700 dark:text-gray-300'
            >
              System Default (Cannot be deleted)
            </label>
          </div>

          {showSystemFlags && (
            <div className='flex items-center'>
              <input
                type='checkbox'
                id='is_ring_based'
                {...register('is_ring_based')}
                disabled={isLoading}
                className='h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-blue-600 focus:ring-blue-500'
              />
              <label
                htmlFor='is_ring_based'
                className='ml-2 text-sm text-gray-700 dark:text-gray-300'
              >
                Is Ring-Based System
              </label>
            </div>
          )}
        </div>
      </div>
    </BaseFormModal>
  );
}
