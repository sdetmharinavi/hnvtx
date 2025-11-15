"use client";

import { useEffect, useRef, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PageSpinner } from "../common/ui/LoadingSpinner";
import { UserRole } from "@/types/user-roles";
import { UnauthorizedModal } from "./UnauthorizedModal";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/providers/UserProvider";

const useUserProfileCheck = (userId?: string) => {
  const supabase = createClient();
  return useQuery({
    queryKey: ['user-profile-check', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('preferences')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

interface ProtectedProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

const ProtectedContent = ({ children, allowedRoles }: { children: ReactNode, allowedRoles?: UserRole[] }) => {
  // THE FIX: Call ALL hooks unconditionally at the top of the component.
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const { canAccess, isSuperAdmin, role, isLoading: isRoleLoading } = useUser();
  const { data: profile, isLoading: isProfileLoading } = useUserProfileCheck(user?.id);

  // Derive state from the results of the hooks. This is safe to do before conditional returns.
  const needsOnboarding = 
    !isProfileLoading && // Only check if profile is loaded
    profile && 
    typeof profile.preferences === 'object' && 
    profile.preferences !== null && 
    !Array.isArray(profile.preferences) &&
    'needsOnboarding' in profile.preferences &&
    (profile.preferences as { needsOnboarding?: boolean }).needsOnboarding === true;

  // THE FIX: The useEffect hook is now also called unconditionally at the top level.
  useEffect(() => {
    // The logic *inside* the effect can be conditional. This is the correct pattern.
    if (!isProfileLoading && !isRoleLoading && needsOnboarding && window.location.pathname !== '/onboarding') {
      router.replace('/onboarding');
    }
  }, [isProfileLoading, isRoleLoading, needsOnboarding, router]);
  
  // THE FIX: All conditional returns now happen AFTER all hooks have been called.
  if (isRoleLoading || isProfileLoading) {
     return <PageSpinner text="Verifying permissions..." />;
  }
  
  if (needsOnboarding) {
    return <PageSpinner text="Redirecting to onboarding..." />;
  }

  if (allowedRoles && !canAccess(allowedRoles) && !isSuperAdmin) {
    return <UnauthorizedModal allowedRoles={allowedRoles} currentRole={role} />;
  }

  return <>{children}</>;
}

export const Protected: React.FC<ProtectedProps> = ({ children, allowedRoles, redirectTo = "/login" }) => {
  const authState = useAuthStore((state) => state.authState);
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (authState === 'unauthenticated' && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace(redirectTo);
    }
  }, [authState, router, redirectTo]);

  if (authState === 'loading') {
    return <PageSpinner text="Verifying session..." />;
  }

  if (authState === 'unauthenticated') {
    return <PageSpinner text="Redirecting..." />;
  }

  if (authState === 'authenticated') {
    // The UserProvider is still wrapping the content in the layout, which is correct.
    // We just render the content gatekeeper here.
    return (
      <ProtectedContent allowedRoles={allowedRoles}>
        {children}
      </ProtectedContent>
    );
  }

  return <PageSpinner text="Finalizing..." />;
};