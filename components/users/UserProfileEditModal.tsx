// components/users/UserProfileEditModal.tsx
'use client';

import React, { useEffect } from 'react';
import { FiShield } from 'react-icons/fi';
import { useAdminUpdateUserProfile, type AdminUpdateUserProfile } from '@/hooks/data/useAdminUserMutations';
import { toast } from 'sonner';
import { UserRole } from '@/types/user-roles';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput, FormDateInput } from '../common/form/FormControls';
import { Input, Label, Modal } from '@/components/common/ui';
import { FormCard } from '@/components/common/form';
import { user_profilesUpdateSchema, V_user_profiles_extendedRowSchema } from '@/schemas/zod-schemas';
import { z } from 'zod';
import { useUser } from '@/providers/UserProvider';

// THE FIX: Define a form schema that is perfectly compatible with the incoming `v_user_profiles_extendedRowSchema` prop.
// We do this by taking the base update schema and overriding the nested objects to match the view's structure (without `undefined`).
const userProfileFormSchema = user_profilesUpdateSchema.extend({
  // This precisely matches the shape of the `address` object in `v_user_profiles_extendedRowSchema`
  address: z.object({
      street: z.string().optional().nullable(),
      city: z.string().optional().nullable(),
      state: z.string().optional().nullable(),
      zip_code: z.string().optional().nullable(),
      country: z.string().optional().nullable(),
  }).nullable(),
  // This matches the `preferences` object shape as well.
  preferences: z.object({
      language: z.string().optional().nullable(),
      theme: z.string().optional().nullable(),
      needsOnboarding: z.boolean().optional().nullable(),
      showOnboardingPrompt: z.boolean().optional().nullable(),
  }).nullable(),
});

// The form data type is now inferred from our new, compatible schema.
type UserProfileFormData = z.infer<typeof userProfileFormSchema>;

interface UserProfileEditProps {
  // THE FIX: The prop type now correctly uses the view schema, which is what the parent page provides.
  user: V_user_profiles_extendedRowSchema | null;
  onClose: () => void;
  onSave?: () => void;
  isOpen: boolean;
}

// Normalize the view row (nullable fields) into form data (optional fields)
const normalizeUserToForm = (user: V_user_profiles_extendedRowSchema): UserProfileFormData => {
  return {
    // scalars: convert null -> undefined where the update schema expects optional
    avatar_url: user.avatar_url ?? null,
    first_name: user.first_name ?? undefined,
    last_name: user.last_name ?? undefined,
    phone_number: user.phone_number ?? undefined,
    date_of_birth: user.date_of_birth ?? undefined,
    designation: user.designation ?? undefined,
    role: user.role ?? undefined,
    status: user.status ?? "inactive",
    // created_at: user.created_at ?? undefined,
    // updated_at: user.updated_at ?? undefined,

    // nested objects: keep null as null, otherwise coerce to the expected shape
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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
    reset,
    control,
    watch,
  } = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileFormSchema),
  });

  useEffect(() => {
    if (!isOpen) return;
    if (user) {
      reset(normalizeUserToForm(user));
    } else {
      reset(); // Reset to default form values if no user is provided
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
    
    const updateParams: Partial<AdminUpdateUserProfile> & { user_id: string } = { user_id: user.id };

    for (const key in dirtyFields) {
      const typedKey = key as keyof UserProfileFormData;
      const rpcKey = `update_${typedKey}` as keyof AdminUpdateUserProfile;
      
      if (typedKey === 'address' || typedKey === 'preferences') {
        if(data[typedKey]) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (updateParams as any)[rpcKey] = data[typedKey];
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (updateParams as any)[rpcKey] = data[typedKey];
      }
    }

    console.log(updateParams);
    

    try {
      await updateProfile.mutateAsync(updateParams as AdminUpdateUserProfile);
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

 const onInvalidSubmit = () => {
    // Get all error messages from the form
    const errorMessages: string[] = [];
    
    // Iterate through all errors and collect messages
    Object.entries(errors).forEach(([field, error]) => {
      if (error?.message) {
        errorMessages.push(`${field}: ${error.message}`);
      }
      
      // Handle nested errors (address, preferences)
      if (typeof error === 'object' && error !== null && !error.message) {
        Object.entries(error).forEach(([nestedField, nestedError]) => {
          if (nestedError && typeof nestedError === 'object' && 'message' in nestedError) {
            errorMessages.push(`${field}.${nestedField}: ${nestedError.message}`);
          }
        });
      }
    });
    
    // Display error messages
    if (errorMessages.length > 0) {
      toast.error('Validation failed', {
        description: errorMessages.join('\n'),
        duration: 5000,
      });
      
      // Also log to console for debugging
      console.error('Form validation errors:', errors);
    } else {
      toast.error('Form validation failed. Please check your inputs.');
      console.error('Form validation errors:', errors);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User Profile" size="full" visible={false} className="h-screen w-screen transparent bg-gray-700 rounded-2xl">
      <FormCard onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)} isLoading={isSubmitting} title="Edit User Profile" onCancel={onClose} submitText="Update" disableSubmit={!isDirty}>
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