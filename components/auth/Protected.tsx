// components/auth/Protected.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PageSpinner } from "../common/ui/LoadingSpinner";
import { useUserPermissionsExtended } from "@/hooks/useRoleFunctions";
import { UserRole } from "@/types/user-roles";
import { UnauthorizedModal } from "./UnauthorizedModal";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

// This hook checks the user's profile to see if they need to complete onboarding.
const useUserProfileCheck = (userId?: string) => {
  const supabase = createClient();
  return useQuery({
    queryKey: ['user-profile-check', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('first_name, preferences') // Only fetch what's needed for the check
        .eq('id', userId)
        .single();

      if (error) {
        // 'PGRST116' means no rows found, which is a valid state for a brand new user
        if (error.code === 'PGRST116') return null; 
        throw error;
      }
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

interface ProtectedProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
  fallbackComponent?: React.ReactNode;
}

export const Protected: React.FC<ProtectedProps> = ({ children, allowedRoles, redirectTo = "/login" }) => {
  const authState = useAuthStore((state) => state.authState);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const hasRedirected = useRef(false);

  const { data: profile, isLoading: isProfileLoading, isError: isProfileError, error: profileError } = useUserProfileCheck(user?.id);
  const { isSuperAdmin, canAccess, isLoading: isRoleLoading, isError: isRoleError, error: roleError } = useUserPermissionsExtended();

  useEffect(() => {
    // Unauthenticated: Redirect to login if not already done
    if (authState === 'unauthenticated' && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace(redirectTo);
      return;
    }

    // Authenticated: Check for onboarding completion once all data is loaded
    if (authState === 'authenticated' && !isProfileLoading && !isRoleLoading) {
      const needsOnboarding = (profile?.preferences)?.needsOnboarding === true;

      if (needsOnboarding) {
        if (window.location.pathname !== '/onboarding') {
          router.replace('/onboarding');
        }
        return;
      }

      // If onboarding is complete, check role-based access
      if (allowedRoles && !canAccess(allowedRoles) && !isSuperAdmin) {
        // The UnauthorizedModal will be rendered below.
        return;
      }
    }
  }, [
    authState,
    profile,
    isProfileLoading,
    isRoleLoading,
    canAccess,
    isSuperAdmin,
    allowedRoles,
    router,
    redirectTo
  ]);

  // Render states
  if (authState === 'loading' || isProfileLoading || isRoleLoading) {
    return <PageSpinner text="Verifying session..." />;
  }
  
  // ** Add an explicit check for any error state.**
  if (isRoleError || isProfileError) {
    const errorMessage = roleError?.message || profileError?.message || "Could not verify your user permissions or profile.";
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="p-8 text-center bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
          <h3 className="text-xl font-semibold text-red-700 dark:text-red-300">Authentication Error</h3>
          <p className="mt-2 text-red-600 dark:text-red-400">{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return <PageSpinner text="Redirecting..." />;
  }

  if (authState === 'authenticated' && user) {
    // If profile is still loading, it's safer to wait
    if (isProfileLoading) return <PageSpinner text="Loading user profile..." />;

    const needsOnboarding = (profile?.preferences)?.needsOnboarding === true;
    
    // The useEffect will handle the redirect, show a spinner in the meantime
    if (needsOnboarding) {
        return <PageSpinner text="Finalizing session..." />;
    }

    // If profile is loaded and onboarding is complete, check roles
    if (profile) {
      if (allowedRoles && !canAccess(allowedRoles) && !isSuperAdmin) {
        return <UnauthorizedModal allowedRoles={allowedRoles} currentRole={user.role} />;
      }
      // If authorized, render the children
      return <>{children}</>;
    }
  }

  // Fallback for any other unexpected state
  return <PageSpinner text="Finalizing..." />;
};