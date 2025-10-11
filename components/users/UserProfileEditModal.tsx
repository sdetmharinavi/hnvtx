'use client';

import React, { useEffect } from 'react';
import { FiShield } from 'react-icons/fi';
import {
  useAdminUpdateUserProfile,
} from '@/hooks/useAdminUsers';
import { toast } from 'sonner';
import { UserRole } from '@/types/user-roles';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput, FormDateInput } from '../common/form/FormControls';
import { Input, Label, Modal } from '@/components/common/ui';
import { FormCard } from '@/components/common/form';
import { user_profilesUpdateSchema } from '@/schemas/zod-schemas';
import { z } from 'zod';
import { useUser } from '@/providers/UserProvider';

// ** Define types based on the Zod schema, not manually.**
const addressSchema = user_profilesUpdateSchema.shape.address;
const preferencesSchema = user_profilesUpdateSchema.shape.preferences;

// Extend the auto-generated schema to handle nested objects for the form
const userProfileFormSchema = user_profilesUpdateSchema.extend({
    address: addressSchema,
    preferences: preferencesSchema,
});

type UserProfileFormData = z.infer<typeof userProfileFormSchema>;

interface UserProfileEditProps {
  user: UserProfileFormData | null; // The component now accepts the Zod-inferred type
  onClose: () => void;
  onSave?: () => void;
  isOpen: boolean;
}

const toObject = (val: unknown): Record<string, unknown> => {
  if (!val) return {};
  if (typeof val === 'object') return val as Record<string, unknown>;
  return {};
};

const UserProfileEditModal: React.FC<UserProfileEditProps> = ({
  isOpen,
  user,
  onClose,
  onSave,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    control,
    watch,
  } = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileFormSchema),
    defaultValues: {
      first_name: '', last_name: '', avatar_url: null, phone_number: null, date_of_birth: null,
      address: {}, preferences: {}, role: UserRole.VIEWER, designation: null, status: 'inactive',
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (user) {
      reset({
        ...user,
        address: toObject(user.address),
        preferences: toObject(user.preferences),
      });
    } else {
      reset({
        first_name: '', last_name: '', avatar_url: null, phone_number: null, date_of_birth: null,
        address: {}, preferences: {}, role: UserRole.VIEWER, designation: null, status: 'inactive',
      });
    }
  }, [isOpen, reset, user]);

  const avatarUrl = watch('avatar_url');
  const { isSuperAdmin, role: currentUserRole } = useUser();
  const updateProfile = useAdminUpdateUserProfile();

  const onValidSubmit = async (data: UserProfileFormData) => {
    if (!isDirty || !user?.id) {
      toast.info('No changes to save.');
      onClose();
      return;
    }
    
    // The payload now perfectly matches the expected type for the RPC function
    const updateParams: { user_id: string; [key: string]: unknown } = { user_id: user.id };
    
    (Object.keys(data) as Array<keyof UserProfileFormData>).forEach(key => {
      updateParams[`update_${key}`] = data[key];
    });

    try {
      await updateProfile.mutateAsync(updateParams);
      onSave?.();
    } catch (error) {
      console.error('Update failed:', error);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User Profile" size="full" visible={false} className="h-screen w-screen transparent bg-gray-700 rounded-2xl">
      <FormCard onSubmit={handleSubmit(onValidSubmit)} isLoading={isSubmitting} title="Edit User Profile" onCancel={onClose}>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Image src={avatarUrl || '/default-avatar.png'} alt="Profile" width={64} height={64} className="w-16 h-16 rounded-full object-cover bg-gray-200" />
            <div className="flex-1">
              <FormInput name="avatar_url" label="Avatar URL" register={register} error={errors.avatar_url} placeholder="https://example.com/avatar.jpg" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput name="first_name" label="First Name" register={register} error={errors.first_name} required />
            <FormInput name="last_name" label="Last Name" register={register} error={errors.last_name} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput name="phone_number" label="Phone Number" register={register} error={errors.phone_number} type="tel" />
            <FormDateInput name="date_of_birth" label="Date of Birth" control={control} error={errors.date_of_birth} placeholder="YYYY-MM-DD" />
          </div>

          <FormInput name="designation" label="Designation" register={register} error={errors.designation} placeholder="e.g., Senior Engineer" />
          
          <div>
            <Label>Address</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
              <Input {...register("address.street")} placeholder="Street Address" error={errors.address?.street?.message} />
              <Input {...register("address.city")} placeholder="City" error={errors.address?.city?.message} />
              <Input {...register("address.state")} placeholder="State/Province" error={errors.address?.state?.message} />
              <Input {...register("address.zip_code")} placeholder="ZIP/Postal Code" error={errors.address?.zip_code?.message} />
            </div>
          </div>
          
          <div>
            <Label>Preferences</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
              <Label>Language</Label>
              <select {...register('preferences.language')} className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                <option value="en">English</option>
              </select>
            </div>
          </div>

          {(isSuperAdmin || currentUserRole === 'admin') && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2"><FiShield className="text-orange-500" /> Administrative Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role" required>Role</Label>
                  <select id="role" {...register('role')} className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                    {Object.values(UserRole).map((role) => (<option key={role} value={role}>{role.replace(/_/g, ' ').toUpperCase()}</option>))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="status" required>Status</Label>
                  <select id="status" {...register('status')} className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </FormCard>
    </Modal>
  );
};

export default UserProfileEditModal;