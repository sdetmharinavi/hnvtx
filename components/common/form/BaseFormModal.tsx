// components/common/form/BaseFormModal.tsx
'use client';

import React, { useCallback } from 'react';
import { Modal } from '@/components/common/ui/Modal';
import { FormCard } from '@/components/common/form/FormCard';
import { UseFormReturn, FieldValues, SubmitHandler, SubmitErrorHandler } from 'react-hook-form';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { toTitleCase } from '@/config/helper-functions';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

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
  className?: string;
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
  className,
}: BaseFormModalProps<T>) {
  const {
    handleSubmit,
    formState: { isDirty },
  } = form;

  const isOnline = useOnlineStatus();

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

  // Smart Error Feedback
  const onInvalidSubmit: SubmitErrorHandler<T> = (errors) => {
    console.error('Form Validation Errors:', errors);

    // Extract field names, replace underscores, and convert to Title Case
    const errorFields = Object.keys(errors).map((key) => toTitleCase(key.replace(/_/g, ' ')));

    if (errorFields.length > 0) {
      toast.error('Validation Error', {
        description: `Please check the following fields: ${errorFields.join(', ')}`,
        duration: 6000,
      });
    } else {
      toast.error('Please fix validation errors.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      visible={false} // We rely on FormCard for the title header
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
        disableSubmit={isLoading || !isOnline} // Prevent submission while offline
        widthClass={widthClass}
        heightClass={heightClass}
        standalone
        footerContent={footerContent}
      >
        {/* Offline Banner Indicator */}
        {!isOnline && (
          <div className="mb-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-lg p-3 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-400">
            <WifiOff className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold">Offline Mode:</span> You are currently offline. Any changes made to this form cannot be saved until you reconnect to the network.
            </div>
          </div>
        )}
        {children}
      </FormCard>
    </Modal>
  );
}