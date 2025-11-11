// path: components/ring-manager/EditSystemInRingModal.tsx
"use client";

import { FC, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Modal } from "@/components/common/ui";
import { FormCard, FormInput, FormSwitch } from "@/components/common/form";
import { V_systems_completeRowSchema } from "@/schemas/zod-schemas";
import { toast } from "sonner";

// Schema for the fields we want to edit in this modal
const editSystemInRingSchema = z.object({
  order_in_ring: z.number().nullable(),
  is_hub: z.boolean().nullable(),
});

type EditSystemInRingForm = z.infer<typeof editSystemInRingSchema>;

interface EditSystemInRingModalProps {
  isOpen: boolean;
  onClose: () => void;
  system: V_systems_completeRowSchema | null;
  onSubmit: (data: EditSystemInRingForm) => void;
  isLoading: boolean;
}

export const EditSystemInRingModal: FC<EditSystemInRingModalProps> = ({
  isOpen,
  onClose,
  system,
  onSubmit,
  isLoading,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<EditSystemInRingForm>({
    resolver: zodResolver(editSystemInRingSchema),
    defaultValues: {
      order_in_ring: 0,
      is_hub: false,
    },
  });

  useEffect(() => {
    if (isOpen && system) {
      reset({
        order_in_ring: system.order_in_ring,
        is_hub: system.is_hub,
      });
    }
  }, [isOpen, system, reset]);

  const handleValidSubmit = useCallback(
    (formData: EditSystemInRingForm) => {
      onSubmit(formData);
    },
    [onSubmit]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit System: ${system?.system_name || ""}`}
      visible={false}
      className='transparent bg-gray-700 rounded-2xl'>
      <FormCard
        standalone
        onSubmit={handleSubmit(handleValidSubmit, () =>
          toast.error("Please fix validation errors")
        )}
        onCancel={onClose}
        isLoading={isLoading}
        title={`Edit: ${system?.system_name || "System"}`}
        submitText='Save Changes'>
        <div className='space-y-4'>
          <FormInput
            name='order_in_ring'
            label='Order in Ring'
            type='number'
            step='0.1'
            register={register}
            error={errors.order_in_ring}
            placeholder='e.g., 1, 2, 2.1, 3...'
          />
          <FormSwitch name='is_hub' label='Is Hub System' control={control} />
        </div>
      </FormCard>
    </Modal>
  );
};
