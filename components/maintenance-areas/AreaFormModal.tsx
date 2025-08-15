// components/AreaFormModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { TablesInsert, TablesUpdate } from "@/types/supabase-types";
import { MaintenanceArea, AreaFormModalProps } from "@/components/maintenance-areas/maintenance-areas-types";
import {
  MdEmail as Mail,
  MdLocationOn as MapPin,
  MdPerson as User,
  MdPhone as Phone,
} from "react-icons/md";
import { maintenanceAreaSchema } from "@/schemas/schema";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SearchableSelect } from "../common/SearchableSelect";
import { FormCard } from "../common/ui/form/FormCard";

export function AreaFormModal({
  isOpen,
  onClose,
  onSubmit,
  area,
  allAreas,
  areaTypes,
  isLoading
}: AreaFormModalProps) {
  // Create a form-specific schema that excludes timestamp fields
  const areaFormSchema = maintenanceAreaSchema.pick({ 
    name: true, 
    code: true, 
    area_type_id: true, 
    parent_id: true, 
    contact_person: true, 
    contact_number: true, 
    email: true, 
    address: true, 
    latitude: true, 
    longitude: true, 
    status: true 
  });

  type AreaForm = z.infer<typeof areaFormSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    control,
  } = useForm<AreaForm>({
    resolver: zodResolver(areaFormSchema),
    defaultValues: {
      name: "",
      code: "",
      area_type_id: "",
      parent_id: null,
      contact_person: "",
      contact_number: "",
      email: "",
      address: "",
      latitude: "",
      longitude: "",
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
          latitude: area.latitude || "",
          longitude: area.longitude || "",
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
          latitude: "",
          longitude: "",
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

  const onValidSubmit = (data: AreaForm) => {
    // Convert empty strings to null for database
    const cleanedData = {
      ...data,
      area_type_id: data.area_type_id || null,
      parent_id: data.parent_id || null,
      code: data.code || null,
      contact_person: data.contact_person || null,
      contact_number: data.contact_number || null,
      email: data.email || null,
      address: data.address || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
    };
    
    onSubmit(cleanedData);
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
        >
          {/* Name Field */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Area Name *
            </label>
            <input
              id="name"
              type="text"
              {...register("name")}
              placeholder="Area Name" 
              required 
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-600"
              disabled={isLoading}
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
          </div>
          
          {/* Code Field */}
          <div className="mb-4">
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Area Code
            </label>
            <input
              id="code"
              type="text"
              {...register("code")}
              placeholder="Area Code" 
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-600"
              disabled={isLoading}
            />
            {errors.code && <p className="mt-1 text-sm text-red-500">{errors.code.message}</p>}
          </div>
          
          {/* Area Type Field */}
          <div className="mb-4">
            <label htmlFor="area_type_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Area Type *
            </label>
            <Controller
              control={control}
              name="area_type_id"
              render={({ field }) => (
                <SearchableSelect
                  value={field.value as string}
                  onChange={field.onChange}
                  options={areaTypes
                    .filter(type => type.name !== "DEFAULT")
                    .map(type => ({ value: type.id, label: type.name }))
                  }
                  placeholder="Select area type"
                  className="w-full"
                  disabled={isLoading}
                  required
                />
              )}
            />
            {errors.area_type_id && <p className="mt-1 text-sm text-red-500">{errors.area_type_id.message}</p>}
          </div>
          
          {/* Parent Area Field */}
          <div className="mb-4">
            <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Parent Area
            </label>
            <Controller
              control={control}
              name="parent_id"
              render={({ field }) => (
                <SearchableSelect
                  value={field.value as string}
                  onChange={field.onChange}
                  options={availableParents.map(a => ({ value: a.id, label: a.name }))}
                  placeholder="Select parent area"
                  className="w-full"
                  disabled={isLoading}
                  clearable
                />
              )}
            />
            {errors.parent_id && <p className="mt-1 text-sm text-red-500">{errors.parent_id.message}</p>}
          </div>
          
          {/* Contact Person Field */}
          <div className="mb-4">
            <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contact Person
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="contact_person"
                type="text"
                {...register("contact_person")}
                placeholder="Contact Person" 
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pl-10 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-600"
                disabled={isLoading}
              />
            </div>
            {errors.contact_person && <p className="mt-1 text-sm text-red-500">{errors.contact_person.message}</p>}
          </div>
          
          {/* Contact Number Field */}
          <div className="mb-4">
            <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contact Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="contact_number"
                type="tel"
                {...register("contact_number")}
                placeholder="Contact Number" 
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pl-10 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-600"
                disabled={isLoading}
              />
            </div>
            {errors.contact_number && <p className="mt-1 text-sm text-red-500">{errors.contact_number.message}</p>}
          </div>
          
          {/* Email Field */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="email"
                type="email"
                {...register("email")}
                placeholder="Email Address" 
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pl-10 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-600"
                disabled={isLoading}
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
          </div>
          
          {/* Address Field */}
          <div className="mb-4">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pt-2 pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <textarea
                id="address"
                {...register("address")}
                placeholder="Address" 
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pl-10 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-600" 
                rows={3}
                disabled={isLoading}
              />
            </div>
            {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>}
          </div>
          
          {/* Coordinates Fields */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Latitude
              </label>
              <input
                id="latitude"
                type="text"
                {...register("latitude")}
                placeholder="Latitude" 
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-600"
                disabled={isLoading}
              />
              {errors.latitude && <p className="mt-1 text-sm text-red-500">{errors.latitude.message}</p>}
            </div>
            <div>
              <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Longitude
              </label>
              <input
                id="longitude"
                type="text"
                {...register("longitude")}
                placeholder="Longitude" 
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-600"
                disabled={isLoading}
              />
              {errors.longitude && <p className="mt-1 text-sm text-red-500">{errors.longitude.message}</p>}
            </div>
          </div>
          
          {/* Status Field */}
          <div className="pt-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                {...register("status")}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-blue-600"
                disabled={isLoading}
              />
              Active
            </label>
            {errors.status && <p className="mt-1 text-sm text-red-500">{errors.status.message}</p>}
          </div>
        </FormCard>
      </div>
    </div>
  );
}