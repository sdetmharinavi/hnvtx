// path: app/onboarding/onboarding-form-enhanced.tsx

import { useAuthStore } from "@/stores/authStore";
import { createClient } from "@/utils/supabase/client";
import { useTableUpdate } from "@/hooks/database";
import { toast } from "sonner";
import Image from "next/image";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { user_profilesUpdateSchema, User_profilesUpdateSchema } from "@/schemas/zod-schemas";
import { useGetMyUserDetails } from "@/hooks/useAdminUsers";
import { useEffect } from "react";
import { Input, Label } from "@/components/common/ui";
import { Json } from "@/types/supabase-types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/common/ui/select/Select";

// THE FIX: This function is now robust. It handles null/undefined/non-object
// values by returning an empty object, preventing crashes.
const toObject = (data: Json | null | undefined): Record<string, unknown> => {
  if (data && typeof data === "object") {
    return data as Record<string, unknown>;
  }
  return {};
};

export default function OnboardingFormEnhanced() {
  const user = useAuthStore((state) => state.user);
  const supabase = createClient();

  const { data: profile, isLoading: isProfileLoading, error: profileError, refetch } = useGetMyUserDetails();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty, dirtyFields },
    watch,
  } = useForm<User_profilesUpdateSchema>({
    resolver: zodResolver(user_profilesUpdateSchema),
    defaultValues: {
      first_name: "",
      avatar_url: null,
      date_of_birth: null,
      designation: null,
      phone_number: null,
      address: {},
      preferences: {
        language: null,
        theme: null,
      },
    },
  });

  const { mutate: updateProfile, isPending: isUpdatePending } = useTableUpdate(supabase, "user_profiles", {
    onSuccess: (data) => {
      console.log('Update success data:', data);
      toast.success("Profile updated successfully!");
      refetch();

      if (data && data[0]) {
        const updatedProfile = data[0] as User_profilesUpdateSchema;
        console.log('Updated profile for reset:', updatedProfile);

        // Normalize the returned values for form reset
        const normalizePreferenceValue = (value: unknown): string | null => {
          if (!value || typeof value !== 'string') return null;
          const normalized = value.toLowerCase().trim();

          switch (normalized) {
            case 'english':
            case 'en-us':
            case 'en-gb':
              return 'en';
            case 'light':
            case 'light-theme':
              return 'light';
            case 'dark':
            case 'dark-theme':
              return 'dark';
            case 'system':
            case 'auto':
            case 'default':
              return 'system';
            default:
              return normalized;
          }
        };

        // Ensure proper structure for form reset
        reset({
          ...updatedProfile,
          address: toObject(updatedProfile.address),
          preferences: {
            ...toObject(updatedProfile.preferences),
            language: normalizePreferenceValue(toObject(updatedProfile.preferences).language),
            theme: normalizePreferenceValue(toObject(updatedProfile.preferences).theme),
          },
        });
      } else {
        // Fallback to refetch if no data returned
        refetch();
      }
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error(`Update failed: ${error.message}`);
    },
  });

  const isLoading = isProfileLoading || isUpdatePending;
  const avatarUrl = watch("avatar_url");

  // Watch preferences values to debug
  const languageValue = watch("preferences.language");
  const themeValue = watch("preferences.theme");

  console.log('Watched values - Language:', languageValue, 'Theme:', themeValue);

  useEffect(() => {
    if (profile) {
      const preferences = toObject(profile.preferences);
      console.log('Profile preferences:', profile.preferences);
      console.log('Converted preferences:', preferences);

      // Normalize preference values to match SelectItem values exactly
      const normalizePreferenceValue = (value: unknown): string | null => {
        if (!value || typeof value !== 'string') return null;
        const normalized = value.toLowerCase().trim();

        // Map common variations to canonical values
        switch (normalized) {
          case 'english':
          case 'en-us':
          case 'en-gb':
            return 'en';
          case 'light':
          case 'light-theme':
            return 'light';
          case 'dark':
          case 'dark-theme':
            return 'dark';
          case 'system':
          case 'auto':
          case 'default':
            return 'system';
          default:
            return normalized; // Return as-is if it doesn't match known variations
        }
      };

      const normalizedPreferences = {
        language: normalizePreferenceValue(preferences.language),
        theme: normalizePreferenceValue(preferences.theme),
        needsOnboarding: preferences.needsOnboarding as boolean | null | undefined,
        showOnboardingPrompt: preferences.showOnboardingPrompt as boolean | null | undefined,
      };

      console.log('Normalized preferences:', normalizedPreferences);

      reset({
        ...profile,
        address: toObject(profile.address),
        preferences: normalizedPreferences,
      });
    } else if (!isProfileLoading) {
      reset({
        first_name: "",
        last_name: "",
        avatar_url: null,
        date_of_birth: null,
        designation: null,
        phone_number: null,
        address: {},
        preferences: {
          language: null,
          theme: null,
        },
      });
    }
  }, [profile, isProfileLoading, reset]);

  const onSubmit = (data: User_profilesUpdateSchema) => {
    if (!isDirty || !user?.id) {
      toast.info("No changes to save.");
      return;
    }

    console.log('Form submit data:', data);

    const updates: Partial<User_profilesUpdateSchema> = {};

    // THE FIX: Type-safe iteration over dirty fields without using `any`.
    // This ensures correctness and adheres to the project's strict linting rules.
    for (const key in dirtyFields) {
      if (Object.prototype.hasOwnProperty.call(dirtyFields, key)) {
        const typedKey = key as keyof User_profilesUpdateSchema;

        const value = data[typedKey];
        const keyForUpdate = typedKey as keyof User_profilesUpdateSchema;

        // Convert empty strings or undefined to null for database compatibility.
        // Use targeted type assertion for database update compatibility
        (updates as Record<string, unknown>)[keyForUpdate] = value === '' || value === undefined ? null : value;
      }
    }


    const newPreferences = {
      ...toObject(profile?.preferences),
      ...toObject(data.preferences),
      needsOnboarding: false,
    };
    updates.preferences = newPreferences;

    console.log('Final updates to send:', updates);

    if (Object.keys(updates).length > 0) {
      updateProfile({ id: user.id, data: updates });
    }
  };

  if (isProfileLoading) {
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
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6 w-full max-w-3xl mx-auto'>
      <div className='flex items-center gap-4'>
        <Image src={avatarUrl || "/default-avatar.png"} alt='Profile' width={64} height={64} className='w-16 h-16 rounded-full object-cover bg-gray-200' />
        <div className='flex-1'>
          <Label htmlFor='avatar_url'>Avatar URL</Label>
          <Input id='avatar_url' {...register("avatar_url")} placeholder='https://example.com/avatar.jpg' className='mt-1' />
          {errors.avatar_url && <p className='text-red-500 text-xs mt-1'>{errors.avatar_url.message}</p>}
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
        <div>
          <Label htmlFor='email'>Email</Label>
          <Input id='email' type='email' value={user?.email || ""} disabled className='mt-1 bg-gray-50 dark:bg-gray-700 text-gray-500' />
        </div>
        <div>
          <Label htmlFor='phone_number'>Phone Number</Label>
          <Input id='phone_number' type='tel' {...register("phone_number")} placeholder='+1 (555) 123-4567' className='mt-1' />
          {errors.phone_number && <p className='text-red-500 text-xs mt-1'>{errors.phone_number.message}</p>}
        </div>
        <div>
          <Label htmlFor='first_name'>
            First Name <span className='text-red-500'>*</span>
          </Label>
          <Input id='first_name' type='text' {...register("first_name")} className='mt-1' />
          {errors.first_name && <p className='text-red-500 text-xs mt-1'>{errors.first_name.message}</p>}
        </div>
        <div>
          <Label htmlFor='last_name'>
            Last Name <span className='text-red-500'>*</span>
          </Label>
          <Input id='last_name' type='text' {...register("last_name")} className='mt-1' />
          {errors.last_name && <p className='text-red-500 text-xs mt-1'>{errors.last_name.message}</p>}
        </div>
      </div>

      <div className='space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6'>
        <h3 className='text-md font-medium text-gray-700 dark:text-gray-300'>Address Information</h3>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <div className='sm:col-span-2'>
            <Label htmlFor='address_street'>Street Address</Label>
            <Input id='address_street' {...register("address.street")} placeholder='123 Main St' className='mt-1' />
          </div>
          <div>
            <Label htmlFor='address_city'>City</Label>
            <Input id='address_city' {...register("address.city")} placeholder='New York' className='mt-1' />
          </div>
          <div>
            <Label htmlFor='address_state'>State/Province</Label>
            <Input id='address_state' {...register("address.state")} placeholder='NY' className='mt-1' />
          </div>
          <div>
            <Label htmlFor='address_zip_code'>Zip Code</Label>
            <Input id='address_zip_code' {...register("address.zip_code")} placeholder='12345' className='mt-1' />
          </div>
          <div>
            <Label htmlFor='address_country'>Country</Label>
            <Input id='address_country' {...register("address.country")} placeholder='USA' className='mt-1' />
          </div>
        </div>
      </div>

      <div className='space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6'>
        <h3 className='text-md font-medium text-gray-700 dark:text-gray-300'>Preferences</h3>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <div>
            <Label htmlFor='preferences_language'>Language</Label>
            <Controller
              name="preferences.language"
              control={control}
              render={({ field }) => {
                console.log('Language field value:', field.value, typeof field.value);
                // Ensure consistent string value to prevent controlled/uncontrolled warning
                const selectValue = field.value && typeof field.value === 'string' ? field.value : "";
                return (
                  <Select value={selectValue} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={field.value ? field.value : "Select language"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                );
              }}
            />
          </div>
          <div>
            <Label htmlFor='preferences_theme'>Theme</Label>
            <Controller
              name="preferences.theme"
              control={control}
              render={({ field }) => {
                console.log('Theme field value:', field.value, typeof field.value);
                // Ensure consistent string value to prevent controlled/uncontrolled warning
                const selectValue = field.value && typeof field.value === 'string' ? field.value : "";
                return (
                  <Select value={selectValue} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={field.value ? field.value : "Select theme"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                );
              }}
            />
          </div>
        </div>
      </div>

      <div className='flex justify-end items-center pt-4 border-t border-gray-200 dark:border-gray-700'>
        <div className='flex space-x-3'>
          <button
            type='button'
            onClick={() => reset()}
            disabled={!isDirty || isLoading}
            className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50'>
            Reset
          </button>
          <button type='submit' disabled={!isDirty || isLoading} className='px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center'>
            {isLoading && (
              <svg className='animate-spin -ml-1 mr-2 h-4 w-4 text-white' fill='none' viewBox='0 0 24 24'>
                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
              </svg>
            )}
            {isLoading ? "Updating..." : "Update Profile"}
          </button>
        </div>
      </div>
    </form>
  );
}