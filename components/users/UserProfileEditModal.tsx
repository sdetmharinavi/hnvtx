"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { FiX, FiShield } from "react-icons/fi";
import { useAdminUpdateUserProfile, useGetMyRole, useIsSuperAdmin } from "@/hooks/useAdminUsers";
import { toast } from "sonner";
import { UserRole } from "@/types/user-roles";
import Image from "next/image";
import { useForm, Resolver, FieldErrors, Controller } from "react-hook-form";
import { UserProfileFormData, userProfileFormSchema } from "@/schemas"; // Use the main schema and type
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput, FormDateInput } from "../common/FormControls"; // Import your new controls
import { Button, Input, Label, Modal } from "@/components/common/ui";

interface UserProfileEditProps {
  user: UserProfileFormData | null;
  onClose: () => void;
  onSave?: () => void; // Optional callback for when save is successful
  isOpen: boolean;
}

// Helper to safely parse JSON-like data
const toObject = (val: unknown): Record<string, any> => {
  if (!val) return {};
  if (typeof val === "object") return val as Record<string, any>;
  return {};
};

const UserProfileEditModal: React.FC<UserProfileEditProps> = ({ isOpen, user, onClose, onSave }) => {
  // === React Hook Form Setup ===
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    control,
    watch,
  } = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileFormSchema) as Resolver<UserProfileFormData>,
    // Initialize with empty defaults. We will populate it with an effect.
    defaultValues: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      avatar_url: user?.avatar_url || "",
      phone_number: user?.phone_number || "",
      date_of_birth: user?.date_of_birth ? new Date(user.date_of_birth) : null,
      address: user?.address ? toObject(user.address) : {},
      preferences: user?.preferences ? toObject(user.preferences) : {},
      role: (user?.role as "admin" | "viewer" | "cpan_admin" | "maan_admin" | "sdh_admin" | "vmux_admin" | "mng_admin") || UserRole.VIEWER,
      designation: user?.designation || "",
      status: (user?.status as "active" | "inactive" | "suspended") || "inactive",
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    // if (user) {
    //   console.log("Populating form with user data:", user);
    //   reset({
    //     first_name: user?.first_name || "",
    //     last_name: user?.last_name || "",
    //     avatar_url: user?.avatar_url || "",
    //     phone_number: user?.phone_number || "",
    //     date_of_birth: user?.date_of_birth ? new Date(user.date_of_birth) : null,
    //     address: user?.address ? toObject(user.address) : {},
    //     preferences: user?.preferences ? toObject(user.preferences) : {},
    //     role: (user?.role as "admin" | "viewer" | "cpan_admin" | "maan_admin" | "sdh_admin" | "vmux_admin" | "mng_admin") || UserRole.VIEWER,
    //     designation: user?.designation || "",
    //     status: (user?.status as "active" | "inactive" | "suspended") || "inactive",
    //   });
    // } else {
    //   // If the modal is opened for a new user, reset to blank fields
    //   reset({
    //     first_name: "",
    //     last_name: "",
    //     avatar_url: "",
    //     phone_number: "",
    //     date_of_birth: null,
    //     address: {},
    //     preferences: {},
    //     role: UserRole.VIEWER,
    //     designation: "",
    //     status: "inactive",
    //   });
    // }
  }, [isOpen]);

  // Watch the avatar_url for live preview
  const avatarUrl = watch("avatar_url");

  // === Data Fetching and Mutation Hooks ===
  const { data: currentUserRole } = useGetMyRole();
  const { data: isSuperAdmin } = useIsSuperAdmin();
  const updateProfile = useAdminUpdateUserProfile();

  // === Form Submission Handler ===
  const onValidSubmit = async (data: UserProfileFormData) => {
    if (!isDirty) {
      toast.info("No changes to save.");
      onClose();
      return;
    }

    // Create the update payload only with changed fields
    const updateParams: { user_id: string; [key: string]: any } = { user_id: user?.id! };

    (Object.keys(data) as Array<keyof UserProfileFormData>).forEach((key) => {
      if (JSON.stringify(data[key]) !== JSON.stringify((user as any)[key])) {
        // Special handling for date to ensure correct format
        if (key === "date_of_birth" && data.date_of_birth) {
          updateParams[`update_${key}`] = data.date_of_birth.toISOString().split("T")[0];
        } else {
          updateParams[`update_${key}`] = data[key];
        }
      }
    });

    try {
      await updateProfile.mutateAsync(updateParams);
      onSave?.(); // Call the parent's onSave to trigger refetch
    } catch (error) {
      // The hook itself will show a toast error message
      console.error("Update failed:", error);
    }
    onClose();
  };

  const onInvalidSubmit = (formErrors: FieldErrors<UserProfileFormData>) => {
    console.error("Form validation errors:", formErrors);
    toast.error("Please correct the errors before saving.");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Edit User Profile'>
      <form onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}>
        <div className='p-6 space-y-6'>
          {/* Profile Image & URL */}
          <div className='flex items-center gap-4'>
            <Image src={avatarUrl || "/default-avatar.png"} alt='Profile' width={64} height={64} className='w-16 h-16 rounded-full object-cover bg-gray-200' />
            <div className='flex-1'>
              <FormInput<UserProfileFormData> name='avatar_url' label='Avatar URL' register={register} error={errors.avatar_url} placeholder='https://example.com/avatar.jpg' />
            </div>
          </div>

          {/* Name */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormInput<UserProfileFormData> name='first_name' label='First Name' register={register} error={errors.first_name} required />
            <FormInput<UserProfileFormData> name='last_name' label='Last Name' register={register} error={errors.last_name} required />
          </div>

          {/* Contact */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormInput<UserProfileFormData> name='phone_number' label='Phone Number' register={register} error={errors.phone_number} type='tel' />
            <FormDateInput<UserProfileFormData> name='date_of_birth' label='Date of Birth' control={control} error={errors.date_of_birth} />
          </div>

          {/* Designation */}
          <FormInput<UserProfileFormData> name='designation' label='Designation' register={register} error={errors.designation} placeholder='e.g., Senior Engineer' />

          {/* *** THE FIX IS HERE: Use Controller for Address Fields *** */}
          <div>
            <Label>Address</Label>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-1'>
              <Controller name='address.street' control={control} render={({ field }) => <Input {...field} value={field.value || ""} placeholder='Street Address' error={errors.address?.street?.message} />} />
              <Controller name='address.city' control={control} render={({ field }) => <Input {...field} value={field.value || ""} placeholder='City' error={errors.address?.city?.message} />} />
              <Controller name='address.state' control={control} render={({ field }) => <Input {...field} value={field.value || ""} placeholder='State/Province' error={errors.address?.state?.message} />} />
              <Controller name='address.zip_code' control={control} render={({ field }) => <Input {...field} value={field.value || ""} placeholder='ZIP/Postal Code' error={errors.address?.zip_code?.message} />} />
            </div>
          </div>
          {/* Users Preferences */}
          <div>
            <Label>Preferences</Label>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-1'>
              <Controller name='preferences.theme' control={control} render={({ field }) => <Input {...field} value={field.value || ""} placeholder='Theme' error={errors.preferences?.theme?.message} />} />
            </div>
          </div>

          {(isSuperAdmin || currentUserRole === "admin") && (
            <div className='border-t border-gray-200 dark:border-gray-700 pt-6'>
              <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2'>
                <FiShield className='text-orange-500' /> Administrative Settings
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='role' required>
                    Role
                  </Label>
                  <select id='role' {...register("role")} className='w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white'>
                    {Object.values(UserRole).map((role) => (
                      <option key={role} value={role}>
                        {role.replace(/_/g, " ").toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor='status' required>
                    Status
                  </Label>
                  <select id='status' {...register("status")} className='w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white'>
                    <option value='active'>Active</option>
                    <option value='inactive'>Inactive</option>
                    <option value='suspended'>Suspended</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className='flex items-center justify-end gap-3 mt-8 p-6 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800 z-10'>
          <Button type='button' variant='outline' onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type='submit' disabled={isSubmitting || !isDirty}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserProfileEditModal;
