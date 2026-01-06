'use client';

import React, { useCallback } from 'react';
import { Modal } from '@/components/common/ui/Modal';
import { FormCard } from '@/components/common/form/FormCard';
import { UseFormReturn, FieldValues, SubmitHandler, SubmitErrorHandler } from 'react-hook-form';
import { toast } from 'sonner';
import { cn } from '@/lib/utils'; // Import cn utility

interface BaseFormModalProps<T extends FieldValues> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  isEditMode: boolean;
  isLoading: boolean;
  form: UseFormReturn<T>;
  onSubmit: (data: T) => void;
  children: React.ReactNode;
  widthClass?: string;
  heightClass?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  footerContent?: React.ReactNode;
  subtitle?: string | React.ReactNode;
  className?: string; // Added className prop
}

export function BaseFormModal<T extends FieldValues>({
  isOpen,
  onClose,
  title,
  isEditMode,
  isLoading,
  form,
  onSubmit,
  children,
  widthClass,
  heightClass,
  size,
  footerContent,
  subtitle,
  className, // Destructure className
}: BaseFormModalProps<T>) {
  const {
    handleSubmit,
    formState: { isDirty },
  } = form;

  // Intercept Close to check for unsaved changes
  const handleClose = useCallback(() => {
    if (isDirty) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to close?')) return;
    }
    onClose();
  }, [isDirty, onClose]);

  const onValidSubmit: SubmitHandler<T> = (data) => {
    onSubmit(data);
  };

  const onInvalidSubmit: SubmitErrorHandler<T> = (errors) => {
    console.error('Form Errors:', errors);
    toast.error('Please fix validation errors.');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      visible={false} // We rely on FormCard for the title header
      // Merge default transparent class with passed className
      className={cn('bg-transparent h-0 w-0', className)}
      closeOnOverlayClick={false}
      closeOnEscape={!isDirty}
      size={size}
    >
      <FormCard
        title={isEditMode ? `Edit ${title}` : `Add ${title}`}
        subtitle={subtitle}
        onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}
        onCancel={handleClose}
        isLoading={isLoading}
        disableSubmit={isLoading}
        widthClass={widthClass}
        heightClass={heightClass}
        standalone
        footerContent={footerContent}
      >
        {children}
      </FormCard>
    </Modal>
  );
}
