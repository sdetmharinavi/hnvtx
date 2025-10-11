// path: components/auth/Protected.tsx
"use client";

import { useEffect, useRef, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PageSpinner } from "../common/ui/LoadingSpinner";
import { UserRole } from "@/types/user-roles";
import { UnauthorizedModal } from "./UnauthorizedModal";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { UserProvider, useUser } from "@/providers/UserProvider"; // THE FIX: Import UserProvider

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

// THE FIX: Create a new inner component that can safely use the context.
const ProtectedContent = ({ children, allowedRoles }: { children: ReactNode, allowedRoles?: UserRole[] }) => {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  
  const { data: profile, isLoading: isProfileLoading } = useUserProfileCheck(user?.id);
  const { canAccess, isSuperAdmin, isLoading: isRoleLoading } = useUser();

  useEffect(() => {
    if (!isProfileLoading && !isRoleLoading) {
      const needsOnboarding = (profile?.preferences as any)?.needsOnboarding === true;

      if (needsOnboarding) {
        if (window.location.pathname !== '/onboarding') {
          router.replace('/onboarding');
        }
        return;
      }

      if (allowedRoles && !canAccess(allowedRoles) && !isSuperAdmin) {
        return;
      }
    }
  }, [
    profile, isProfileLoading, isRoleLoading,
    canAccess, isSuperAdmin, allowedRoles, router
  ]);

  if (isProfileLoading) {
     return <PageSpinner text="Loading user profile..." />;
  }
  
  const needsOnboarding = (profile?.preferences as any)?.needsOnboarding === true;
  if (needsOnboarding) {
    return <PageSpinner text="Finalizing session..." />;
  }

  if (allowedRoles && !canAccess(allowedRoles) && !isSuperAdmin) {
    return <UnauthorizedModal allowedRoles={allowedRoles} currentRole={user?.role} />;
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
    // THE FIX: The UserProvider is now placed here, wrapping all protected children.
    return (
      <UserProvider>
        <ProtectedContent allowedRoles={allowedRoles}>
          {children}
        </ProtectedContent>
      </UserProvider>
    );
  }

  return <PageSpinner text="Finalizing..." />;
};