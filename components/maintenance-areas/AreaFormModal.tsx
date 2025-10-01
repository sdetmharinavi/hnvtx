// components/AreaFormModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { MaintenanceArea, AreaFormModalProps } from "@/config/areas";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormCard } from "@/components/common/form/FormCard";
import { FormInput, FormSearchableSelect, FormSwitch, FormTextarea } from "@/components/common/form/FormControls";
import { useForm } from "react-hook-form";
import { maintenance_areasInsertSchema, Maintenance_areasInsertSchema } from "@/schemas/zod-schemas";
import { generateCodeFromName } from "@/config/helper-functions";

export function AreaFormModal({
  isOpen,
  onClose,
  onSubmit,
  area,
  allAreas,
  areaTypes,
  isLoading
}: AreaFormModalProps) {
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);
  const isEditMode = !!area;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
    setValue,
  } = useForm<Maintenance_areasInsertSchema>({
    resolver: zodResolver(maintenance_areasInsertSchema),
    defaultValues: {
      name: "", code: "", area_type_id: null, parent_id: null,
      contact_person: null, contact_number: null, email: null,
      address: null, latitude: null, longitude: null, status: true
    },
  });

  const watchedName = watch('name');

  useEffect(() => {
    if (isOpen) {
      setIsCodeManuallyEdited(isEditMode);
      if (area) {
        reset({ ...area, status: area.status ?? true });
      } else {
        reset({
          name: "", code: "", area_type_id: null, parent_id: null,
          contact_person: null, contact_number: null, email: null,
          address: null, latitude: null, longitude: null, status: true
        });
      }
    }
  }, [area, isOpen, reset, isEditMode]);

  useEffect(() => {
    if (!isCodeManuallyEdited && !isEditMode) {
      const generatedCode = generateCodeFromName(watchedName);
      setValue('code', generatedCode, { shouldValidate: true });
    }
  }, [watchedName, isCodeManuallyEdited, isEditMode, setValue]);

  const availableParents = useMemo(() => {
    if (!area) return allAreas;
    const getDescendantIds = (areaId: string, areas: MaintenanceArea[]): Set<string> => {
      const descendants = new Set<string>([areaId]);
      const children = areas.filter(a => a.parent_id === areaId);
      children.forEach(child => {
        const childDescendants = getDescendantIds(child.id, areas);
        childDescendants.forEach(id => descendants.add(id));
      });
      return descendants;
    };
    const excludeIds = getDescendantIds(area.id, allAreas);
    return allAreas.filter(a => !excludeIds.has(a.id));
  }, [area, allAreas]);

  const onValidSubmit = (data: Maintenance_areasInsertSchema) => {
    onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-0 h-0 transparent">
        <FormCard 
          onSubmit={handleSubmit(onValidSubmit)} 
          title={area ? "Edit Area" : "Add New Area"} 
          onCancel={onClose}
          isLoading={isLoading}
          heightClass="max-h-[85vh] overflow-y-auto"
          standalone
        >
          {/* Basic Information Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput 
                name="name" 
                label="Area Name" 
                register={register} 
                error={errors.name} 
                required 
                disabled={isLoading} 
              />
              
              <FormInput
                name="code"
                label="Area Code"
                register={register}
                error={errors.code}
                disabled={isLoading}
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
                disabled={isLoading}
                options={areaTypes.filter(type => type.name !== "DEFAULT").map(type => ({ value: type.id, label: type.name }))}
              />
              
              <FormSearchableSelect
                name="parent_id"
                label="Parent Area"
                control={control}
                error={errors.parent_id}
                disabled={isLoading}
                options={availableParents.map(a => ({ value: a.id, label: a.name }))}
              />
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="mt-6 space-y-4 border-t border-gray-200 pt-6 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Contact Information</h3>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput 
                name="contact_person" 
                label="Contact Person" 
                register={register} 
                error={errors.contact_person} 
                disabled={isLoading} 
              />
              
              <FormInput 
                name="contact_number" 
                label="Contact Number" 
                register={register} 
                error={errors.contact_number} 
                disabled={isLoading} 
              />
            </div>
            
            <FormInput 
              name="email" 
              label="Email Address" 
              register={register} 
              error={errors.email} 
              disabled={isLoading} 
            />
          </div>

          {/* Location Information Section */}
          <div className="mt-6 space-y-4 border-t border-gray-200 pt-6 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Location Details</h3>
            
            <FormTextarea 
              name="address" 
              label="Address" 
              control={control} 
              error={errors.address} 
              disabled={isLoading} 
            />
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput 
                name="latitude" 
                label="Latitude" 
                register={register} 
                error={errors.latitude} 
                disabled={isLoading} 
                placeholder="e.g., 22.5726"
              />
              
              <FormInput 
                name="longitude" 
                label="Longitude" 
                register={register} 
                error={errors.longitude} 
                disabled={isLoading} 
                placeholder="e.g., 88.3639"
              />
            </div>
          </div>

          {/* Status Section */}
          <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
            <FormSwitch 
              name="status" 
              label="Active Status" 
              control={control} 
              error={errors.status} 
            />
          </div>
        </FormCard>
      </div>
    </div>
  );
}