"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Database, Json } from "@/types/supabase-types";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { useGetMyUserDetails, useTableUpdate } from "@/hooks/database";

type ProfileUpdate = Database["public"]["Tables"]["user_profiles"]["Update"];

// Define Address as a type that can be serialized to JSON
type Address = {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
};

interface ProfileFormData {
  first_name: string;
  last_name: string;
  avatar_url: string;
  date_of_birth: string;
  designation: string;
  phone_number: string;
  address: Address | null;
  preferences: Json | null;
}

// Helper function to safely get first profile
const getFirstProfile = (profiles: any[] | undefined) => {
  return profiles && profiles.length > 0 ? profiles[0] : null;
};

// Helper function to safely cast to Address
const toAddress = (data: unknown): Address | null => {
  if (!data || typeof data !== "object") return null;
  return data as Address;
};

// Helper function to create initial form data
const createInitialFormData = (): ProfileFormData => ({
  first_name: "",
  last_name: "",
  avatar_url: "",
  date_of_birth: "",
  designation: "",
  phone_number: "",
  address: null,
  preferences: null,
});

export default function OnboardingFormEnhanced() {
  const user = useAuthStore((state) => state.user);
  const supabase = createClient();
  // const updateProfile = useUpdateProfile();
  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>(createInitialFormData);
  const [localError, setLocalError] = useState<Error | null>(null);
  const [isUpdateSuccess, setIsUpdateSuccess] = useState(false);
  
  
  const { data: profiles, isLoading: profileLoading, error: profileError } = useGetMyUserDetails(supabase);

  const { mutate, isPending: updatePending } = useTableUpdate(supabase, "user_profiles", {
    onSuccess: () => {
      setIsDirty(false);
      setIsUpdateSuccess(true);
      setLocalError(null); // Clear any previous errors on success
    },
    onError: (error) => {
      console.log(error);
      setLocalError(error); // Store the error in local state
      setIsUpdateSuccess(false);
    },
  });

  const isLoading = profileLoading || updatePending;

  // Get the first profile safely
  const profile = getFirstProfile(profiles);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      console.log("profile", profile);
      const newFormData: ProfileFormData = {
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        avatar_url: profile.avatar_url || "",
        date_of_birth: profile.date_of_birth || "",
        designation: profile.designation || "",
        phone_number: profile.phone_number || "",
        address: toAddress(profile.address),
        preferences: (profile.preferences as Json) || null,
      };
      setFormData(newFormData);
      setIsDirty(false);
    }
  }, [profile]);

  // Memoized reset function
  const resetForm = useCallback(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        avatar_url: profile.avatar_url || "",
        date_of_birth: profile.date_of_birth || "",
        designation: profile.designation || "",
        phone_number: profile.phone_number || "",
        address: toAddress(profile.address),
        preferences: (profile.preferences as Json) || null,
      });
      setIsDirty(false);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isDirty) return;

    try {
      const updates: Partial<ProfileUpdate> = {};

      if (profile) {
        // Compare each field and only update if changed
        if (formData.first_name !== (profile.first_name || "")) {
          updates.first_name = formData.first_name;
        }
        if (formData.last_name !== (profile.last_name || "")) {
          updates.last_name = formData.last_name;
        }
        if (formData.avatar_url !== (profile.avatar_url || "")) {
          updates.avatar_url = formData.avatar_url;
        }
        if (formData.date_of_birth !== (profile.date_of_birth || "")) {
          updates.date_of_birth = formData.date_of_birth;
        }
        if (formData.designation !== (profile.designation || "")) {
          updates.designation = formData.designation;
        }
        if (formData.phone_number !== (profile.phone_number || "")) {
          updates.phone_number = formData.phone_number;
        }

        // Compare address objects
        const currentAddress = toAddress(profile.address) || {};
        const newAddress = formData.address || {};
        if (JSON.stringify(currentAddress) !== JSON.stringify(newAddress)) {
          updates.address = newAddress;
        }

        // Compare preferences objects
        const currentPreferences = (profile.preferences as Json) || {};
        const newPreferences = formData.preferences || {};
        if (JSON.stringify(currentPreferences) !== JSON.stringify(newPreferences)) {
          updates.preferences = newPreferences;
        }
      } else {
        // If no profile exists, create a new one with all form data
        Object.assign(updates, {
          first_name: formData.first_name,
          last_name: formData.last_name,
          avatar_url: formData.avatar_url,
          date_of_birth: formData.date_of_birth,
          designation: formData.designation,
          phone_number: formData.phone_number,
          address: formData.address,
          preferences: formData.preferences,
        });
      }

      if (Object.keys(updates).length > 0) {
        await mutate({
          id: profile.id,
          data: updates,
        });
      }
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setIsDirty(true);
  };

  const handleAddressChange = (field: keyof Address, value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        ...(prev.address || {}),
        [field]: value,
      },
    }));
    setIsDirty(true);
  };

  // Show loading state
  if (profileLoading) {
    return (
      <div className='animate-pulse space-y-4'>
        <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4'></div>
        <div className='space-y-3'>
          <div className='h-10 bg-gray-200 dark:bg-gray-700 rounded'></div>
          <div className='h-10 bg-gray-200 dark:bg-gray-700 rounded'></div>
          <div className='h-10 bg-gray-200 dark:bg-gray-700 rounded'></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (profileError) {
    return (
      <div className='p-4 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'>
        <h3 className='font-medium'>Error loading profile</h3>
        <p className='text-sm mt-1'>{profileError.message}</p>
        <button onClick={() => window.location.reload()} className='mt-3 text-sm underline hover:no-underline text-red-600 dark:text-red-400'>
          Try again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* Status Messages */}
      {localError && (
        <div className='p-4 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 flex justify-between items-start'>
          <div>
            <h3 className='font-medium'>Update Failed</h3>
            <p className='text-sm mt-1'>{localError.message}</p>
          </div>
          <button type='button' onClick={() => setLocalError(null)} className='text-red-400 hover:text-red-600 dark:hover:text-red-200' aria-label='Dismiss error'>
            ×
          </button>
        </div>
      )}
      {isUpdateSuccess && (
        <div className='p-4 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 flex justify-between items-center'>
          <span className='font-medium'>Profile updated successfully!</span>
          <button type='button' onClick={() => setIsUpdateSuccess(false)} className='text-green-400 hover:text-green-600 dark:hover:text-green-200' aria-label='Dismiss success message'>
            ×
          </button>
        </div>
      )}

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
        {/* Email - Read Only */}
        <div>
          <label htmlFor='email' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
            Email
          </label>
          <input
            id='email'
            type='email'
            value={user?.email || ""}
            disabled
            className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 sm:text-sm'
          />
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor='phone_number' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
            Phone Number
          </label>
          <input
            id='phone_number'
            name='phone_number'
            type='tel'
            value={formData.phone_number}
            onChange={handleChange}
            placeholder='+1 (555) 123-4567'
            className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
          />
        </div>

        {/* First Name */}
        <div>
          <label htmlFor='first_name' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
            First Name <span className='text-red-500'>*</span>
          </label>
          <input
            id='first_name'
            name='first_name'
            type='text'
            required
            value={formData.first_name}
            onChange={handleChange}
            className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
          />
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor='last_name' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
            Last Name <span className='text-red-500'>*</span>
          </label>
          <input
            id='last_name'
            name='last_name'
            type='text'
            required
            value={formData.last_name}
            onChange={handleChange}
            className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
          />
        </div>

        {/* Designation */}
        <div>
          <label htmlFor='designation' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
            Job Title / Designation
          </label>
          <input
            id='designation'
            name='designation'
            type='text'
            value={formData.designation}
            onChange={handleChange}
            placeholder='e.g. Software Engineer'
            className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
          />
        </div>

        {/* Date of Birth */}
        <div>
          <label htmlFor='date_of_birth' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
            Date of Birth
          </label>
          <input
            id='date_of_birth'
            name='date_of_birth'
            type='date'
            value={formData.date_of_birth}
            onChange={handleChange}
            max={new Date().toISOString().split("T")[0]} // Prevent future dates
            className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
          />
        </div>

        {/* Avatar URL */}
        <div className='sm:col-span-2'>
          <label htmlFor='avatar_url' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
            Avatar URL
          </label>
          <div className='mt-1 flex rounded-md shadow-sm'>
            <input
              id='avatar_url'
              name='avatar_url'
              type='url'
              value={formData.avatar_url}
              onChange={handleChange}
              placeholder='https://example.com/avatar.jpg'
              className='flex-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            />
            {formData.avatar_url && (
              <div className='inline-flex items-center px-3 border border-l-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-r-md'>
                <Image
                  src={formData.avatar_url}
                  alt='Avatar preview'
                  className='h-8 w-8 rounded-full object-cover'
                  width={32}
                  height={32}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Address Section */}
        <div className='sm:col-span-2 space-y-4 border border-gray-200 dark:border-gray-700 p-4 rounded-md bg-gray-50 dark:bg-gray-800'>
          <h3 className='text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center'>
            <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
            </svg>
            Address Information
          </h3>

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div className='sm:col-span-2'>
              <label htmlFor='address_street' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                Street Address
              </label>
              <input
                id='address_street'
                type='text'
                value={formData.address?.street || ""}
                onChange={(e) => handleAddressChange("street", e.target.value)}
                placeholder='123 Main Street'
                className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              />
            </div>

            <div>
              <label htmlFor='address_city' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                City
              </label>
              <input
                id='address_city'
                type='text'
                value={formData.address?.city || ""}
                onChange={(e) => handleAddressChange("city", e.target.value)}
                placeholder='New York'
                className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              />
            </div>

            <div>
              <label htmlFor='address_state' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                State/Province
              </label>
              <input
                id='address_state'
                type='text'
                value={formData.address?.state || ""}
                onChange={(e) => handleAddressChange("state", e.target.value)}
                placeholder='NY'
                className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              />
            </div>

            <div>
              <label htmlFor='address_postal_code' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                Postal Code
              </label>
              <input
                id='address_postal_code'
                type='text'
                value={formData.address?.zip_code || ""}
                onChange={(e) => handleAddressChange("zip_code", e.target.value)}
                placeholder='10001'
                className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              />
            </div>

            <div>
              <label htmlFor='address_country' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                Country
              </label>
              <input
                id='address_country'
                type='text'
                value={formData.address?.country || ""}
                onChange={(e) => handleAddressChange("country", e.target.value)}
                placeholder='United States'
                className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              />
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className='flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700'>
        <div className='text-sm text-gray-500 dark:text-gray-400'>{isDirty && <span className='text-orange-600 dark:text-orange-400'>● Unsaved changes</span>}</div>
        <div className='flex space-x-3'>
          <button
            type='button'
            onClick={resetForm}
            disabled={!isDirty || updatePending}
            className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed'>
            Reset
          </button>
          <button
            type='submit'
            disabled={!isDirty || updatePending}
            className='px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center'>
            {updatePending && (
              <svg className='animate-spin -ml-1 mr-2 h-4 w-4 text-white' fill='none' viewBox='0 0 24 24'>
                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
              </svg>
            )}
            {updatePending ? "Updating..." : "Update Profile"}
          </button>
        </div>
      </div>
    </form>
  );
}
