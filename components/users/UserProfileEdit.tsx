import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { FiUser, FiPhone, FiCalendar, FiMapPin, FiSave, FiX, FiCamera, FiShield } from "react-icons/fi";
import { useAdminGetUserById, useAdminUpdateUserProfile, useGetMyRole, useIsSuperAdmin } from "@/hooks/useAdminUsers";
import { toast } from "sonner";
import { UserRole } from "@/types/user-roles";
import { Json } from "@/types/supabase-types";
import Image from "next/image";
import { useForm, Resolver, FieldErrors } from "react-hook-form";
import { UserProfile, userProfileSchema } from "@/schemas/schema";
import { zodResolver } from "@hookform/resolvers/zod";

interface UpdateParams {
  user_id: string;
  update_first_name?: string;
  update_last_name?: string;
  update_avatar_url?: string;
  update_phone_number?: string;
  update_date_of_birth?: string;
  update_address?: Json;
  update_preferences?: Json;
  update_role?: UserRole;
  update_designation?: string;
  update_status?: string;
}

interface UserProfileEditProps {
  userId: string;
  onClose: () => void;
  onSave?: () => void;
}

const UserProfileEdit: React.FC<UserProfileEditProps> = ({ userId, onClose, onSave }) => {
  // === React Hook Form Setup ===
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UserProfile>({
    resolver: zodResolver(userProfileSchema) as Resolver<UserProfile>,
    defaultValues: {
      first_name: "",
      last_name: "",
      avatar_url: "",
      phone_number: "",
      date_of_birth: null,
      address: {},
      preferences: {},
      role: UserRole.VIEWER,
      designation: "",
      status: "inactive",
    },
  });

  // === Data Fetching and Mutation Hooks ===
  const { data: user, isLoading: isLoadingUser } = useAdminGetUserById(userId);
  const { data: currentUserRole } = useGetMyRole();
  const { data: isSuperAdmin } = useIsSuperAdmin();
  const updateProfile = useAdminUpdateUserProfile();

  // Normalize API values that might come as JSON strings
  const toObject = (val: unknown): Record<string, unknown> => {
    if (!val) return {};
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        return typeof parsed === "object" && parsed !== null ? parsed as Record<string, unknown> : {};
      } catch {
        return {};
      }
    }
    return (val as Record<string, unknown>) || {};
  };

  // === Form Population Effect ===
  useEffect(() => {
    if (user) {
      // Use reset to populate the form with fetched data
      // This correctly updates the form state managed by react-hook-form
      reset({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        avatar_url: user.avatar_url || "",
        phone_number: user.phone_number || "",
        // The schema expects a Date object, so we convert the string from the DB
        date_of_birth: user.date_of_birth ? new Date(user.date_of_birth) : null,
        address: toObject(user.address),
        preferences: toObject(user.preferences),
        role: (typeof user.role === "string" ? user.role : UserRole.VIEWER) as "admin" | "viewer" | "cpan_admin" | "maan_admin" | "sdh_admin" | "vmux_admin" | "mng_admin",
        designation: user.designation || "",
        status: (user.status as "active" | "inactive" | "suspended") || "inactive",
      });
    }
  }, [user, reset]);

  // === Form Submission Handler ===
  const onValidSubmit = async (data: UserProfile) => {
    // console.log("Submitting user profile form with data:", data);
    if (!user) {
      toast.error("Original user data not available.");
      return;
    }

    // Build update parameters by comparing validated form data with original user data
    const updateParams: UpdateParams = { user_id: userId };

    if (data.first_name !== user.first_name) updateParams.update_first_name = data.first_name;
    if (data.last_name !== user.last_name) updateParams.update_last_name = data.last_name;
    if (data.avatar_url !== user.avatar_url) updateParams.update_avatar_url = data.avatar_url;
    if (data.phone_number !== user.phone_number) updateParams.update_phone_number = data.phone_number;
    if (data.designation !== user.designation) updateParams.update_designation = data.designation ?? undefined;

    // Compare dates correctly
    const formDateString = data.date_of_birth ? data.date_of_birth.toISOString().split("T")[0] : null;
    const userDateString = user.date_of_birth ? user.date_of_birth.split("T")[0] : null;
    if (formDateString !== userDateString) {
      updateParams.update_date_of_birth = formDateString || undefined;
    }

    // Compare objects
    if (JSON.stringify(data.address) !== JSON.stringify(user.address)) updateParams.update_address = data.address;
    if (JSON.stringify(data.preferences) !== JSON.stringify(user.preferences)) updateParams.update_preferences = data.preferences;

    // Admin-only fields
    if (isSuperAdmin || currentUserRole === "admin") {
      if (data.role !== user.role) updateParams.update_role = data.role as UserRole;
      if (data.status !== user.status) updateParams.update_status = data.status;
    }

    // Check if there are any actual changes to submit
    if (Object.keys(updateParams).length === 1) {
      toast.info("No changes to save.");
      return;
    }

    try {
      await updateProfile.mutateAsync(updateParams);
      toast.success("Profile updated successfully");
      onSave?.();
      onClose();
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile.");
    }
  };

  const onInvalidSubmit = (formErrors: FieldErrors<UserProfile>) => {
    console.error("Form validation errors:", formErrors);
    toast.error("Please fix the highlighted errors and try again.");
  };

  // Handle close with unsaved changes warning
  const handleClose = () => {
    onClose();
  };

  if (isLoadingUser) {
    return (
      <div className='fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50'>
        <div className='bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full mx-4'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-500 mx-auto mb-4'></div>
          <p className='text-gray-700 dark:text-gray-300 text-center'>Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50'>
        <div className='bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full mx-4 text-center'>
          <div className='text-red-500 text-5xl mb-4'>⚠️</div>
          <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>User Not Found</h3>
          <p className='text-gray-600 dark:text-gray-400 mb-4'>The user you&apos;re trying to edit could not be found.</p>
          <button onClick={onClose} className='bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors'>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4'>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'
      >
        {/* Header */}
        <div className='px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10'>
          <div className='flex items-center gap-3'>
            <FiUser className='text-blue-600 dark:text-blue-500 text-xl' />
            <div>
              <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>Edit User Profile</h2>
              <p className='text-sm text-gray-500 dark:text-gray-400'>{user.email}</p>
            </div>
          </div>
          <button onClick={handleClose} className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500'>
            <FiX size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)} className='p-6'>
          <div className='space-y-6'>
            {/* Profile Image */}
            <div className='flex items-center gap-4'>
              <div className='relative'>
                {/* This part needs a state derived from the form for live preview, using watch() */}
                {user.avatar_url ? (
                  <Image src={user.avatar_url} alt='Profile' width={40} height={40} className='w-16 h-16 rounded-full object-cover' />
                ) : (
                  <div className='w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center'>
                    <span className='text-lg font-medium text-gray-700 dark:text-gray-300'>
                      {user.first_name?.[0]}
                      {user.last_name?.[0]}
                    </span>
                  </div>
                )}{" "}
                <button type='button' className='absolute -bottom-1 -right-1 bg-blue-600 dark:bg-blue-700 text-white p-1.5 rounded-full hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800'>
                  <FiCamera size={12} />
                </button>
              </div>
              <div className='flex-1'>
                <label htmlFor='avatar_url' className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Avatar URL
                </label>
                <input 
                  id='avatar_url' 
                  type='url' 
                  {...register("avatar_url")} 
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white' 
                  placeholder='https://example.com/avatar.jpg' 
                />
                {errors.avatar_url && <p className='text-red-500 text-xs mt-1'>{errors.avatar_url.message}</p>}
              </div>
            </div>

            {/* Basic Information */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label htmlFor='first_name' className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  First Name *
                </label>
                <input 
                  id='first_name' 
                  type='text' 
                  {...register("first_name")} 
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white' 
                />
                {errors.first_name && <p className='text-red-500 text-xs mt-1'>{errors.first_name.message}</p>}
              </div>

              <div>
                <label htmlFor='last_name' className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Last Name *
                </label>
                <input 
                  id='last_name' 
                  type='text' 
                  {...register("last_name")} 
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white' 
                />
                {errors.last_name && <p className='text-red-500 text-xs mt-1'>{errors.last_name.message}</p>}
              </div>
            </div>

            {/* Contact Information */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label htmlFor='phone_number' className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  <FiPhone className='inline mr-1' />
                  Phone Number
                </label>
                <input 
                  id='phone_number' 
                  type='tel' 
                  {...register("phone_number")} 
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white' 
                  placeholder='+1 (555) 123-4567' 
                />
                {errors.phone_number && <p className='text-red-500 text-xs mt-1'>{errors.phone_number.message}</p>}
              </div>

              <div>
                <label htmlFor='date_of_birth' className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  <FiCalendar className='inline mr-1' />
                  Date of Birth
                </label>
                <input
                  id='date_of_birth'
                  type='date'
                  {...register("date_of_birth", { valueAsDate: true })}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white'
                  max={new Date().toISOString().split("T")[0]} // Prevent future dates
                />
                {errors.date_of_birth && <p className='text-red-500 text-xs mt-1'>{errors.date_of_birth.message}</p>}
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <label htmlFor='designation' className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Designation
              </label>
              <input
                id='designation'
                type='text'
                {...register("designation")}
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white'
                placeholder='e.g., Senior Engineer, Product Manager'
              />
              {errors.designation && <p className='text-red-500 text-xs mt-1'>{errors.designation.message}</p>}
            </div>

            {/* Address */}
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                <FiMapPin className='inline mr-1' />
                Address
              </label>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <input
                  type='text'
                  {...register("address.street" as const)}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white'
                  placeholder='Street Address'
                />
                <input 
                  type='text' 
                  {...register("address.city" as const)} 
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white' 
                  placeholder='City' 
                />
                <input
                  type='text'
                  {...register("address.state" as const)}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white'
                  placeholder='State/Province'
                />
                <input
                  type='text'
                  {...register("address.zip_code" as const)}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white'
                  placeholder='ZIP/Postal Code'
                />
              </div>
              {errors.address?.message && <p className='text-red-500 text-xs mt-1'>{errors.address.message}</p>}
            </div>

            {/* Admin-only fields */}
            {(isSuperAdmin || currentUserRole === "admin") && (
              <div className='border-t border-gray-200 dark:border-gray-700 pt-6'>
                <div className='flex items-center gap-2 mb-4'>
                  <FiShield className='text-orange-600 dark:text-orange-500' />
                  <h3 className='text-lg font-medium text-gray-900 dark:text-white'>Administrative Settings</h3>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label htmlFor='role' className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                      Role
                    </label>
                    <select 
                      id='role' 
                      {...register("role")} 
                      className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white'
                    >
                      {Object.values(UserRole).map((role) => (
                        <option key={role} value={role}>
                          {role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                    {errors.role && <p className='text-red-500 text-xs mt-1'>{errors.role.message}</p>}
                  </div>

                  <div>
                    <label htmlFor='status' className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                      Status
                    </label>
                    <select 
                      id='status' 
                      {...register("status")} 
                      className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white'
                    >
                      <option value='active'>Active</option>
                      <option value='inactive'>Inactive</option>
                      <option value='suspended'>Suspended</option>
                    </select>
                    {errors.status && <p className='text-red-500 text-xs mt-1'>{errors.status.message}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className='flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800 z-10'>
            <div className='text-sm text-gray-500 dark:text-gray-400'></div>

            <div className='flex items-center gap-3'>
              <button 
                type='button' 
                onClick={handleClose} 
                className='px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800'
              >
                Cancel
              </button>
              <button
                type='submit'
                onClick={handleSubmit(onValidSubmit, onInvalidSubmit)}
                disabled={isSubmitting}
                className='flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800'>
                <FiSave />
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default UserProfileEdit;