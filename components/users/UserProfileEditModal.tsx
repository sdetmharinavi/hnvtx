'use client';

import React, { useEffect } from 'react';
import { FiShield } from 'react-icons/fi';
import {
  useAdminUpdateUserProfile,
  useGetMyRole,
  useIsSuperAdmin,
} from '@/hooks/useAdminUsers';
import { toast } from 'sonner';
import { UserRole } from '@/types/user-roles';
import Image from 'next/image';
import { useForm, Controller} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput, FormDateInput } from '../common/form/FormControls'; // Import your new controls
import { Input, Label, Modal } from '@/components/common/ui';
import { FormCard } from '@/components/common/form/FormCard';
import {
  User_profilesUpdateSchema,
  user_profilesUpdateSchema,
} from '@/schemas/zod-schemas';

export type UserProfile = Omit<User_profilesUpdateSchema, "address" | "preferences"> & {
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  } | null;
  preferences?: {
    language?: string;
    theme?: string;
  } | null;
};

interface UserProfileEditProps {
  user: UserProfile | null;
  onClose: () => void;
  onSave?: () => void; // Optional callback for when save is successful
  isOpen: boolean;
}

// Helper to safely parse JSON-like data
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
  // === React Hook Form Setup ===
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    control,
    watch,
  } = useForm<UserProfile>({
    resolver: zodResolver(  user_profilesUpdateSchema),
    // Initialize with empty defaults. We will populate it with an effect.
    defaultValues: {
      first_name: user?.first_name,
      last_name: user?.last_name,
      avatar_url: user?.avatar_url,
      phone_number: user?.phone_number,
      date_of_birth: user?.date_of_birth,
      address: user?.address ? toObject(user.address) : {},
      preferences: user?.preferences ? toObject(user.preferences) : {},
      role: user?.role,
      designation: user?.designation,
      status: user?.status,
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (user) {
      reset({
        first_name: user?.first_name,
        last_name: user?.last_name,
        avatar_url: user?.avatar_url,
        phone_number: user?.phone_number,
        date_of_birth: user?.date_of_birth,
        address: user?.address ? toObject(user.address) : {},
        preferences: user?.preferences ? toObject(user.preferences) : {},
        role: user?.role,
        designation: user?.designation,
        status: user?.status,
      });
    } else {
      // If the modal is opened for a new user, reset to blank fields
      reset({
        first_name: '',
        last_name: '',
        avatar_url: null,
        phone_number: null,
        date_of_birth: null,
        address: null,
        preferences: null,
        role: UserRole.VIEWER,
        designation: null,
        status: 'inactive',
      });
    }
  }, [isOpen, reset, user]);

  // Watch the avatar_url for live preview
  const avatarUrl = watch('avatar_url');

  // === Data Fetching and Mutation Hooks ===
  const { data: currentUserRole } = useGetMyRole();
  const { data: isSuperAdmin } = useIsSuperAdmin();
  const updateProfile = useAdminUpdateUserProfile();

  // === Form Submission Handler ===
  const onValidSubmit = async (data: UserProfile) => {
    if (!isDirty) {
      toast.info('No changes to save.');
      onClose();
      return;
    }

    // Create the update payload only with changed fields
    const updateParams: { user_id: string; [key: string]: unknown } = {
      user_id: user?.id || '',
    };

    (Object.keys(data) as Array<keyof UserProfile>).forEach(
      (key) => {
        if (
          JSON.stringify(data[key]) !==
          JSON.stringify((user as UserProfile)[key])
        ) {
          // Special handling for date to ensure correct format
          if (key === 'date_of_birth' && data.date_of_birth) {
            updateParams[`update_${key}`] = data.date_of_birth;
          } else {
            updateParams[`update_${key}`] = data[key];
          }
        }
      }
    );

    try {
      await updateProfile.mutateAsync(updateParams);
      onSave?.(); // Call the parent's onSave to trigger refetch
    } catch (error) {
      // The hook itself will show a toast error message
      console.error('Update failed:', error);
    }
    onClose();
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User Profile" size="full" visible={false}
      className="h-screen w-screen transparent bg-gray-700 rounded-2xl">
      <FormCard
        onSubmit={handleSubmit(onValidSubmit)}
        isLoading={isSubmitting}
        title="Edit User Profile"
        onCancel={onClose}
      >
        <div className="p-6 space-y-6">
          {/* Profile Image & URL */}
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

          {/* Name */}
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

          {/* Contact */}
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
              pickerProps={{
                maxDate: new Date(),
                dateFormat: 'yyyy-MM-dd',
                showMonthDropdown: true,
                showYearDropdown: true,
                yearDropdownItemNumber: 100,
                scrollableYearDropdown: true,
                withPortal: true,
                popperPlacement: 'bottom-start',
              }}
            />
          </div>

          {/* Designation */}
          <FormInput
            name="designation"
            label="Designation"
            register={register}
            error={errors.designation}
            placeholder="e.g., Senior Engineer"
          />

          {/* *** THE FIX IS HERE: Use Controller for Address Fields *** */}
          <div>
            <Label>Address</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
              <Controller
                name="address.street"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ''}
                    placeholder="Street Address"
                    error={errors.address?.street?.message}
                  />
                )}
              />
              <Controller
                name="address.city"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ''}
                    placeholder="City"
                    error={errors.address?.city?.message}
                  />
                )}
              />
              <Controller
                name="address.state"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ''}
                    placeholder="State/Province"
                    error={errors.address?.state?.message}
                  />
                )}
              />
              <Controller
                name="address.zip_code"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ''}
                    placeholder="ZIP/Postal Code"
                    error={errors.address?.zip_code?.message}
                  />
                )}
              />
            </div>
          </div>
          {/* Users Preferences */}
          <div>
            <Label>Preferences</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
              <Label>Language</Label>
              <select
                id="language"
                {...register('preferences.language')}
                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="en">English</option>
              </select>
            </div>
          </div>

          {(isSuperAdmin || currentUserRole === 'admin') && (
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
      </FormCard>
    </Modal>
  );
};

export default UserProfileEditModal;
