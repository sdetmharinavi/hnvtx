// components/systems/PortTemplateModal.tsx
'use client';

import React, { useMemo } from 'react';
import { FormSearchableSelect } from '@/components/common/form';
import { useForm } from 'react-hook-form';
import { PORT_TEMPLATES } from '@/config/port-templates';
import { BaseFormModal } from '@/components/common/form/BaseFormModal'; // IMPORT

interface PortTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (templateKey: string) => void;
  isLoading: boolean;
}

export const PortTemplateModal: React.FC<PortTemplateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const form = useForm<{ templateKey: string }>();
  const { control, watch } = form;

  const templateOptions = useMemo(() => {
    return Object.entries(PORT_TEMPLATES).map(([key, template]) => ({
      value: key,
      label: template.name,
    }));
  }, []);

  const selectedKey = watch('templateKey');
  const selectedDescription = selectedKey ? PORT_TEMPLATES[selectedKey]?.description : null;

  const handleFormSubmit = (data: { templateKey: string }) => {
    onSubmit(data.templateKey);
  };

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply Port Template"
      isEditMode={false}
      isLoading={isLoading}
      form={form}
      onSubmit={handleFormSubmit}
      size="full"
      subtitle="Select a configuration to auto-populate ports."
    >
      <div className="space-y-4">
        <FormSearchableSelect
          name="templateKey"
          label="Select Template"
          control={control}
          options={templateOptions}
          placeholder="Choose a configuration..."
          required
        />

        {selectedDescription && (
          <div className="p-3 bg-blue-50 text-blue-800 rounded-md text-sm border border-blue-100">
            <strong>Description:</strong> {selectedDescription}
          </div>
        )}

        <div className="p-3 bg-yellow-50 text-yellow-800 rounded-md text-xs border border-yellow-100">
          <strong>Warning:</strong> Applying a template will create new ports. If ports with the
          same name already exist, they will be updated (upsert).
        </div>
      </div>
    </BaseFormModal>
  );
};
