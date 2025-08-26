// components/AreaFormModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { MaintenanceArea, AreaFormModalProps } from "@/config/areas";
import {
  MdEmail as Mail,
  MdLocationOn as MapPin,
  MdPerson as User,
  MdPhone as Phone,
} from "react-icons/md";
import { MaintenanceAreaFormData, maintenanceAreaFormSchema } from "@/schemas";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SearchableSelect } from "../common/SearchableSelect";
import { FormCard } from "../common/ui/form/FormCard";
import { FormInput, FormSearchableSelect, FormSwitch, FormTextarea } from "@/components/common/ui/form/FormControls";
import { Switch } from "@/components/common/ui";

export function AreaFormModal({
  isOpen,
  onClose,
  onSubmit,
  area,
  allAreas,
  areaTypes,
  isLoading
}: AreaFormModalProps) {

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    control,
  } = useForm<MaintenanceAreaFormData>({
    resolver: zodResolver(maintenanceAreaFormSchema),
    defaultValues: {
      name: "",
      code: "",
      area_type_id: "",
      parent_id: null,
      contact_person: "",
      contact_number: "",
      email: "",
      address: "",
      latitude: null,
      longitude: null,
      status: true
    },
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize form data when modal opens or area changes
  useEffect(() => {
    if (isOpen && !isInitialized) {
      if (area) {
        reset({
          name: area.name || "",
          code: area.code || "",
          area_type_id: area.area_type_id || "",
          parent_id: area.parent_id || null,
          contact_person: area.contact_person || "",
          contact_number: area.contact_number || "",
          email: area.email || "",
          address: area.address || "",
          latitude: area.latitude || null,
          longitude: area.longitude || null,
          status: area.status ?? true
        });
      } else {
        reset({
          name: "",
          code: "",
          area_type_id: "",
          parent_id: null,
          contact_person: "",
          contact_number: "",
          email: "",
          address: "",
          latitude: null,
          longitude: null,
          status: true
        });
      }
      setIsInitialized(true);
    }
  }, [area, isOpen, isInitialized, reset]);

  // Reset initialization when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsInitialized(false);
    }
  }, [isOpen]);

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

  const onValidSubmit = (data: MaintenanceAreaFormData) => {
    onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {area ? "Edit Area" : "Add New Area"}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={isLoading}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <FormCard 
          onSubmit={handleSubmit(onValidSubmit)} 
          title={area ? "Edit Area" : "Add New Area"} 
          onCancel={onClose}
          isLoading={isLoading}
          hightClass="max-h-[calc(90vh-140px)]"
        >
          {/* Name Field */}
          <FormInput
            name="name"
            label="Area Name"
            register={register}
            error={errors.name}
            required
            disabled={isLoading}
          />
          
          {/* Code Field */}
          <FormInput
            name="code"
            label="Area Code"
            register={register}
            error={errors.code}
            disabled={isLoading}
          />
          
          {/* Area Type Field */}
          <FormSearchableSelect
            name="area_type_id"
            label="Area Type"
            control={control}
            error={errors.area_type_id}
            disabled={isLoading}
            options={areaTypes
              .filter(type => type.name !== "DEFAULT")
              .map(type => ({ value: type.id, label: type.name }))
            }
          />
          
          {/* Parent Area Field */}
          <FormSearchableSelect
            name="parent_id"
            label="Parent Area"
            control={control}
            error={errors.parent_id}
            disabled={isLoading}
            options={availableParents.map(a => ({ value: a.id, label: a.name }))}
          />
          
          {/* Contact Person Field */}
          <FormInput
            name="contact_person"
            label="Contact Person"
            register={register}
            error={errors.contact_person}
            disabled={isLoading}
          />
          
          {/* Contact Number Field */}
          <FormInput
            name="contact_number"
            label="Contact Number"
            register={register}
            error={errors.contact_number}
            disabled={isLoading}
          />
          
          {/* Email Field */}
          <FormInput
            name="email"
            label="Email Address"
            register={register}
            error={errors.email}
            disabled={isLoading}
          />
          
          {/* Address Field */}
          <FormTextarea
            name="address"
            label="Address"
            register={register}
            error={errors.address}
            disabled={isLoading}
          />
          
          {/* Coordinates Fields */}
          <FormInput
            name="latitude"
            label="Latitude"
            register={register}
            error={errors.latitude}
            disabled={isLoading}
          />
          <FormInput
            name="longitude"
            label="Longitude"
            register={register}
            error={errors.longitude}
            disabled={isLoading}
          />
          
          {/* Status Field */}
          <FormSwitch
            name="status"
            label="Active"
            control={control}
            error={errors.status}
            className="mt-2"
          />
        </FormCard>
      </div>
    </div>
  );
}