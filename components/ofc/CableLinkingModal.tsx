// components/ofc/CableLinkingModal.tsx
'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/common/ui';
import { FormCard, FormSearchableSelect, FormTextarea } from '@/components/common/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLinkCables } from '@/hooks/database/ofc-linking-hooks';
import { useOfcRoutesForSelection } from '@/hooks/database/route-manager-hooks';
import { ExtendedOfcCable } from '@/schemas/custom-schemas';

interface CableLinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceCable: ExtendedOfcCable;
}

const linkSchema = z.object({
  target_cable_id: z.string().min(1, 'Please select a cable'),
  description: z.string().optional(),
});

type LinkFormValues = z.infer<typeof linkSchema>;

export const CableLinkingModal: React.FC<CableLinkingModalProps> = ({
  isOpen,
  onClose,
  sourceCable,
}) => {
  const { mutate: linkCables, isPending } = useLinkCables();
  
  // Reuse existing hook for cable selection options
  const { data: allCables, isLoading: loadingCables } = useOfcRoutesForSelection();

  const form = useForm<LinkFormValues>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      target_cable_id: '',
      description: '',
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  // Filter out the current cable and already linked cables
  const availableOptions = React.useMemo(() => {
    if (!allCables) return [];
    
    // Get IDs of currently linked cables
    const linkedIds = new Set(sourceCable.linked_cables?.map(l => l.cable_id) || []);
    linkedIds.add(sourceCable.id!); // Exclude self

    return allCables
      .filter(c => c.id && c.route_name && !linkedIds.has(c.id))
      .map(c => ({
        value: c.id!,
        label: c.route_name!,
      }));
  }, [allCables, sourceCable]);

  const onSubmit = (data: LinkFormValues) => {
    if (!sourceCable.id) return;
    
    linkCables({
      cableId1: sourceCable.id,
      cableId2: data.target_cable_id,
      description: data.description
    }, {
      onSuccess: () => {
        onClose();
        form.reset();
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Link Related Cable" size="md">
      <FormCard
        title={`Link to: ${sourceCable.route_name}`}
        subtitle="Create a logical reference to another cable route."
        onSubmit={handleSubmit(onSubmit)}
        onCancel={onClose}
        isLoading={isPending}
        submitText="Create Link"
        standalone
      >
        <div className="space-y-4">
          <FormSearchableSelect
            name="target_cable_id"
            label="Select Cable to Link"
            control={control}
            options={availableOptions}
            error={errors.target_cable_id}
            isLoading={loadingCables}
            placeholder="Search cable routes..."
            required
          />
          
          <FormTextarea
            name="description"
            label="Description / Reason"
            control={control}
            rows={2}
            placeholder="e.g. Parallel route, logical extension..."
          />
        </div>
      </FormCard>
    </Modal>
  );
};