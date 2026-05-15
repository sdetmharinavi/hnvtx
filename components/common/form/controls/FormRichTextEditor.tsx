// components/common/form/controls/FormRichTextEditor.tsx
'use client';

import React from 'react';
import { Control, Controller, FieldValues } from 'react-hook-form';
import { RichTextEditor } from '@/components/common/form/RichTextEditor';
import { BaseProps, HelperText } from './shared';

interface FormRichTextEditorProps<T extends FieldValues> extends BaseProps<T> {
  control: Control<T>;
  placeholder?: string;
  disabled?: boolean;
}

export function FormRichTextEditor<T extends FieldValues>({
  name,
  control,
  label,
  error,
  className,
  helperText,
  ...props
}: FormRichTextEditorProps<T>) {
  return (
    <div className={className}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <>
            <RichTextEditor
              label={label}
              value={field.value ?? ''}
              onChange={field.onChange}
              error={typeof error?.message === 'string' ? error.message : undefined}
              disabled={props.disabled}
              placeholder={props.placeholder}
            />
            {!error && helperText && <HelperText text={helperText} />}
          </>
        )}
      />
    </div>
  );
}
