// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
// THE FIX: Import the context hook `useUser` instead of the old data-fetching hook.
import { useUser } from '@/providers/UserProvider';
import { useTableUpdate } from '@/hooks/database';
import { createClient } from '@/utils/supabase/client';
import { OnboardingPromptModal } from '@/components/auth/OnboardingPromptModal';
import ScalableFiberNetworkDashboard from '@/app/bsnl/page';
import { toast } from 'sonner';
import { User_profilesRowSchema } from '@/schemas/zod-schemas';

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  // THE FIX: Get the profile and its loading state from the `useUser` context.
  const { profile, isLoading: isProfileLoading, refetch } = useUser();
  const { mutate: updateProfile } = useTableUpdate(createClient(), 'user_profiles');

  const [isPromptOpen, setIsPromptOpen] = useState(false);

  useEffect(() => {
    if (!isProfileLoading && profile) {
      const needsOnboarding =
        (profile.preferences as User_profilesRowSchema['preferences'])?.needsOnboarding === true;
      const hasDismissedPrompt =
        (profile.preferences as User_profilesRowSchema['preferences'])?.showOnboardingPrompt ===
        false;

      if (needsOnboarding && !hasDismissedPrompt) {
        setIsPromptOpen(true);
      }
    }
  }, [profile, isProfileLoading]);

  const handleGoToProfile = () => {
    setIsPromptOpen(false);
    router.push('/onboarding');
  };

  const handleDismissTemporarily = () => {
    setIsPromptOpen(false);
  };

  const handleDismissPermanently = () => {
    if (user?.id && profile) {
      const currentPreferences =
        (profile.preferences as User_profilesRowSchema['preferences']) || {};
      const newPreferences = { ...currentPreferences, showOnboardingPrompt: false };

      updateProfile(
        { id: user.id, data: { preferences: newPreferences } },
        {
          onSuccess: () => {
            toast.success("Preference saved. We won't ask again.");
            refetch();
          },
          onError: (error) => {
            toast.error(`Failed to save preference: ${error.message}`);
          },
        }
      );
    }
    setIsPromptOpen(false);
  };

  return (
    <>
      <ScalableFiberNetworkDashboard />
      <OnboardingPromptModal
        isOpen={isPromptOpen}
        onClose={handleDismissTemporarily}
        onGoToProfile={handleGoToProfile}
        onDismissPermanently={handleDismissPermanently}
        userName={
          profile?.first_name && profile.first_name !== 'Placeholder' ? profile.first_name : 'there'
        }
      />
    </>
  );
}
