// path: components/maintenance-areas/AreaFormModal.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FormInput,
  FormSearchableSelect,
  FormSwitch,
  FormTextarea,
} from '@/components/common/form/FormControls';
import { useForm } from 'react-hook-form';
import {
  maintenance_areasInsertSchema,
  Maintenance_areasInsertSchema,
  Maintenance_areasRowSchema,
} from '@/schemas/zod-schemas';
import { generateCodeFromName } from '@/config/helper-functions';
import { useLookupTypeOptions } from '@/hooks/data/useDropdownOptions';
import { BaseFormModal } from '@/components/common/form/BaseFormModal'; // IMPORT
import { MaintenanceAreaWithRelations } from '@/config/areas';

// Redefine props slightly to match
interface AreaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Maintenance_areasInsertSchema) => void;
  area: MaintenanceAreaWithRelations | null;
  allAreas: Maintenance_areasRowSchema[];
  isLoading: boolean;
}

export function AreaFormModal({
  isOpen,
  onClose,
  onSubmit,
  area,
  allAreas,
  isLoading,
}: AreaFormModalProps) {
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);
  const isEditMode = !!area;

  const { options: areaTypeOptions, isLoading: isLoadingAreaTypes } =
    useLookupTypeOptions('MAINTENANCE_AREA_TYPES');

  const form = useForm<Maintenance_areasInsertSchema>({
    resolver: zodResolver(maintenance_areasInsertSchema),
    defaultValues: {
      name: '',
      code: '',
      area_type_id: null,
      parent_id: null,
      contact_person: null,
      contact_number: null,
      email: null,
      address: null,
      latitude: null,
      longitude: null,
      status: true,
    },
  });

  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = form;
  const watchedName = watch('name');

  useEffect(() => {
    if (isOpen) {
      setIsCodeManuallyEdited(isEditMode);
      if (area) {
        reset({
          name: area.name,
          code: area.code,
          area_type_id: area.area_type_id,
          parent_id: area.parent_id,
          contact_person: area.contact_person,
          contact_number: area.contact_number,
          email: area.email,
          address: area.address,
          latitude: area.latitude,
          longitude: area.longitude,
          status: area.status ?? true,
        });
      } else {
        reset({
          name: '',
          code: '',
          area_type_id: null,
          parent_id: null,
          contact_person: null,
          contact_number: null,
          email: null,
          address: null,
          latitude: null,
          longitude: null,
          status: true,
        });
      }
    }
  }, [area, isOpen, reset, isEditMode]);

  useEffect(() => {
    if (!isCodeManuallyEdited && !isEditMode && watchedName) {
      const generatedCode = generateCodeFromName(watchedName);
      setValue('code', generatedCode, { shouldValidate: true });
    }
  }, [watchedName, isCodeManuallyEdited, isEditMode, setValue]);

  const availableParents = useMemo(() => {
    if (!area) return allAreas;
    const getDescendantIds = (areaId: string, areas: Maintenance_areasRowSchema[]): Set<string> => {
      const descendants = new Set<string>([areaId]);
      const children = areas.filter((a) => a.parent_id === areaId);
      children.forEach((child) => {
        if (!child.id) return;
        const childDescendants = getDescendantIds(child.id, areas);
        childDescendants.forEach((id) => descendants.add(id));
      });
      return descendants;
    };
    const excludeIds = getDescendantIds(area.id, allAreas);
    return allAreas.filter((a) => !a.id || !excludeIds.has(a.id));
  }, [area, allAreas]);

  const combinedLoading = isLoading || isLoadingAreaTypes;

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Area"
      isEditMode={isEditMode}
      isLoading={combinedLoading}
      form={form}
      onSubmit={(data) => onSubmit(data as Maintenance_areasInsertSchema)}
      heightClass="max-h-[85vh] overflow-y-auto"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormInput
            name="name"
            label="Area Name"
            register={register}
            error={errors.name}
            required
            disabled={combinedLoading}
          />
          <FormInput
            name="code"
            label="Area Code"
            register={register}
            error={errors.code}
            disabled={combinedLoading}
            onChange={(e) => {
              setIsCodeManuallyEdited(true);
              register('code').onChange(e);
            }}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormSearchableSelect
            name="area_type_id"
            label="Area Type"
            control={control}
            error={errors.area_type_id}
            disabled={combinedLoading}
            options={areaTypeOptions}
          />
          <FormSearchableSelect
            name="parent_id"
            label="Parent Area"
            control={control}
            error={errors.parent_id}
            disabled={combinedLoading}
            options={availableParents.map((a) => ({ value: a.id, label: a.name }))}
          />
        </div>

        <div className="mt-6 space-y-4 border-t border-gray-200 pt-6 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Contact Information
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              name="contact_person"
              label="Contact Person"
              register={register}
              error={errors.contact_person}
              disabled={combinedLoading}
            />
            <FormInput
              name="contact_number"
              label="Contact Number"
              register={register}
              error={errors.contact_number}
              disabled={combinedLoading}
            />
          </div>
          <FormInput
            name="email"
            label="Email Address"
            register={register}
            error={errors.email}
            disabled={combinedLoading}
          />
        </div>

        <div className="mt-6 space-y-4 border-t border-gray-200 pt-6 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Location Details
          </h3>
          <FormTextarea
            name="address"
            label="Address"
            control={control}
            error={errors.address}
            disabled={combinedLoading}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              name="latitude"
              label="Latitude"
              type="number"
              step="any"
              register={register}
              error={errors.latitude}
              disabled={combinedLoading}
              placeholder="e.g., 22.5726"
            />
            <FormInput
              name="longitude"
              label="Longitude"
              type="number"
              step="any"
              register={register}
              error={errors.longitude}
              disabled={combinedLoading}
              placeholder="e.g., 88.3639"
            />
          </div>
        </div>

        <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
          <FormSwitch name="status" label="Active Status" control={control} error={errors.status} />
        </div>
      </div>
    </BaseFormModal>
  );
}
