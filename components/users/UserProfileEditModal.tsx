// components/users/UserProfileEditModal.tsx
'use client';

import React, { useEffect } from 'react';
import { FiShield } from 'react-icons/fi';
import {
  useAdminUpdateUserProfile,
  type AdminUpdateUserProfile,
} from '@/hooks/data/useAdminUserMutations';
import { UserRole } from '@/types/user-roles';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput, FormDateInput } from '../common/form/FormControls';
import { Input, Label } from '@/components/common/ui';
import { BaseFormModal } from '@/components/common/form/BaseFormModal'; // CHANGED: Import BaseFormModal
import {
  user_profilesUpdateSchema,
  V_user_profiles_extendedRowSchema,
} from '@/schemas/zod-schemas';
import { z } from 'zod';
import { useUser } from '@/providers/UserProvider';
import { Json } from '@/types/supabase-types';

const userProfileFormSchema = user_profilesUpdateSchema.extend({
  address: z
    .object({
      street: z.string().optional().nullable(),
      city: z.string().optional().nullable(),
      state: z.string().optional().nullable(),
      zip_code: z.string().optional().nullable(),
      country: z.string().optional().nullable(),
    })
    .nullable(),
  preferences: z
    .object({
      language: z.string().optional().nullable(),
      theme: z.string().optional().nullable(),
      needsOnboarding: z.boolean().optional().nullable(),
      showOnboardingPrompt: z.boolean().optional().nullable(),
    })
    .nullable(),
});

type UserProfileFormData = z.infer<typeof userProfileFormSchema>;

interface UserProfileEditProps {
  user: V_user_profiles_extendedRowSchema | null;
  onClose: () => void;
  onSave?: () => void;
  isOpen: boolean;
}

const normalizeUserToForm = (user: V_user_profiles_extendedRowSchema): UserProfileFormData => {
  return {
    avatar_url: user.avatar_url ?? null,
    first_name: user.first_name ?? undefined,
    last_name: user.last_name ?? undefined,
    phone_number: user.phone_number ?? null,
    date_of_birth: user.date_of_birth ?? undefined,
    designation: user.designation ?? undefined,
    role: user.role ?? undefined,
    status: user.status ?? 'inactive',
    address: user.address
      ? {
          street: user.address.street ?? null,
          city: user.address.city ?? null,
          state: user.address.state ?? null,
          zip_code: user.address.zip_code ?? null,
          country: user.address.country ?? null,
        }
      : null,
    preferences: user.preferences
      ? {
          language: user.preferences.language ?? null,
          theme: user.preferences.theme ?? null,
          needsOnboarding: user.preferences.needsOnboarding ?? null,
          showOnboardingPrompt: user.preferences.showOnboardingPrompt ?? null,
        }
      : null,
  } as UserProfileFormData;
};

const UserProfileEditModal: React.FC<UserProfileEditProps> = ({
  isOpen,
  user,
  onClose,
  onSave,
}) => {
  const form = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileFormSchema),
  });

  const {
    register,
    formState: { errors, dirtyFields },
    reset,
    control,
    watch,
  } = form;

  useEffect(() => {
    if (!isOpen) return;
    if (user) {
      reset(normalizeUserToForm(user));
    } else {
      reset();
    }
  }, [isOpen, reset, user]);

  const avatarUrl = watch('avatar_url');
  const { isSuperAdmin, role: currentUserRole } = useUser();
  const updateProfile = useAdminUpdateUserProfile();

  const handleValidSubmit = async (data: UserProfileFormData) => {
    if (!user?.id) return;

    // Construct the update payload based only on dirty fields
    const updateParams: Partial<AdminUpdateUserProfile> & { user_id: string } = {
      user_id: user.id,
    };

    // Helper to check if a nested object actually has changes
    const getDirtyValues = (dirtyFieldsObj: unknown, dataObj: unknown): Json | undefined => {
      if (!dirtyFieldsObj || !dataObj) return undefined;
      // If we have dirty fields for this object, return the FULL object data
      // This ensures we don't send partial JSON objects to the DB which might overwrite existing JSONB keys incorrectly
      // if the DB merge logic isn't perfect. For safety with Supabase/Postgres JSONB, sending the whole object is often safer.
      return dataObj as Json;
    };

    for (const key in dirtyFields) {
      const typedKey = key as keyof UserProfileFormData;
      const rpcKey = `update_${typedKey}` as keyof AdminUpdateUserProfile;

      if (typedKey === 'address' || typedKey === 'preferences') {
        // For nested JSON, if any field inside is dirty, we send the whole object state
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const jsonVal = getDirtyValues((dirtyFields as any)[key], data[typedKey]);
        if (jsonVal !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (updateParams as any)[rpcKey] = jsonVal;
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (updateParams as any)[rpcKey] = data[typedKey];
      }
    }

    try {
      await updateProfile.mutateAsync(updateParams as AdminUpdateUserProfile);
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit User Profile"
      isEditMode={true}
      isLoading={updateProfile.isPending}
      form={form}
      onSubmit={handleValidSubmit}
      size="full"
      // Custom class for full screen styling
      className="h-screen w-screen transparent bg-gray-700 rounded-2xl"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Image
            src={avatarUrl || '/default-avatar.png'}
            alt="Profile"
            width={64}
            height={64}
            className="w-16 h-16 rounded-full object-cover bg-gray-200"
          />
          <div className="flex-1">
            <FormInput
              name="avatar_url"
              label="Avatar URL"
              register={register}
              error={errors.avatar_url}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            name="first_name"
            label="First Name"
            register={register}
            error={errors.first_name}
            required
          />
          <FormInput
            name="last_name"
            label="Last Name"
            register={register}
            error={errors.last_name}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            name="phone_number"
            label="Phone Number"
            register={register}
            error={errors.phone_number}
            type="tel"
          />
          <FormDateInput
            name="date_of_birth"
            label="Date of Birth"
            control={control}
            error={errors.date_of_birth}
            placeholder="YYYY-MM-DD"
          />
        </div>

        <FormInput
          name="designation"
          label="Designation"
          register={register}
          error={errors.designation}
          placeholder="e.g., Senior Engineer"
        />

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <Label className="mb-2 block">Address</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('address.street')}
              placeholder="Street Address"
              error={errors.address?.street?.message}
            />
            <Input
              {...register('address.city')}
              placeholder="City"
              error={errors.address?.city?.message}
            />
            <Input
              {...register('address.state')}
              placeholder="State/Province"
              error={errors.address?.state?.message}
            />
            <Input
              {...register('address.zip_code')}
              placeholder="ZIP/Postal Code"
              error={errors.address?.zip_code?.message}
            />
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <Label className="mb-2 block">Preferences</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1">Language</Label>
              <select
                {...register('preferences.language')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        {(isSuperAdmin || currentUserRole === 'admin' || currentUserRole === 'admin_pro') && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiShield className="text-orange-500" /> Administrative Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role" required>
                  Role
                </Label>
                <select
                  id="role"
                  {...register('role')}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  {Object.values(UserRole).map((role) => (
                    <option key={role} value={role}>
                      {role.replace(/_/g, ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="status" required>
                  Status
                </Label>
                <select
                  id="status"
                  {...register('status')}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseFormModal>
  );
};

export default UserProfileEditModal;
