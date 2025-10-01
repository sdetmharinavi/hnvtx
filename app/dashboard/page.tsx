// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useGetMyUserDetails } from "@/hooks/useAdminUsers";
import { useTableUpdate } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { OnboardingPromptModal } from "@/components/auth/OnboardingPromptModal";
import ScalableFiberNetworkDashboard from "@/app/bsnl/page";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { data: profile, isLoading: isProfileLoading, refetch } = useGetMyUserDetails();
  const { mutate: updateProfile } = useTableUpdate(createClient(), 'user_profiles');

  const [isPromptOpen, setIsPromptOpen] = useState(false);

  useEffect(() => {
    if (!isProfileLoading && profile) {
      // **THE FIX: Check the 'needsOnboarding' flag directly from the user's preferences.**
      // This is the reliable source of truth.
      const needsOnboarding = (profile.preferences as any)?.needsOnboarding === true;
      const hasDismissedPrompt = (profile.preferences as any)?.showOnboardingPrompt === false;

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
      const currentPreferences = (profile.preferences as object) || {};
      const newPreferences = { ...currentPreferences, showOnboardingPrompt: false };
      
      updateProfile({ id: user.id, data: { preferences: newPreferences } }, {
        onSuccess: () => {
          toast.success("Preference saved. We won't ask again.");
          // Manually update the local profile state to prevent the prompt from reappearing before a full refetch
          refetch(); 
        },
        onError: (error) => {
          toast.error(`Failed to save preference: ${error.message}`);
        }
      });
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
        userName={(profile?.first_name && profile.first_name !== 'Placeholder') ? profile.first_name : 'there'}
      />
    </>
  );
}