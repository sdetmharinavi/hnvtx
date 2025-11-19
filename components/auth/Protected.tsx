"use client";

import { useEffect, useRef, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PageSpinner } from "../common/ui/LoadingSpinner";
import { UserRole } from "@/types/user-roles";
import { UnauthorizedModal } from "./UnauthorizedModal";
import { useAuthStore } from "@/stores/authStore";
import { useUser } from "@/providers/UserProvider";
import { User_profilesRowSchema } from "@/schemas/zod-schemas";

interface ProtectedProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

const ProtectedContent = ({ children, allowedRoles }: { children: ReactNode, allowedRoles?: UserRole[] }) => {
  const router = useRouter();
  // THE FIX: Get all user data from the single, consolidated useUser context.
  const { canAccess, isSuperAdmin, role, profile, isLoading: isUserLoading } = useUser();

  const needsOnboarding = 
    !isUserLoading && 
    profile && 
    typeof profile.preferences === 'object' && 
    profile.preferences !== null && 
    !Array.isArray(profile.preferences) &&
    'needsOnboarding' in profile.preferences &&
    (profile.preferences as User_profilesRowSchema['preferences'])?.needsOnboarding === true;

  useEffect(() => {
    if (!isUserLoading && needsOnboarding && window.location.pathname !== '/onboarding') {
      router.replace('/onboarding');
    }
  }, [isUserLoading, needsOnboarding, router]);
  
  if (isUserLoading) {
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
    return (
      <ProtectedContent allowedRoles={allowedRoles}>
        {children}
      </ProtectedContent>
    );
  }

  return <PageSpinner text="Finalizing..." />;
};