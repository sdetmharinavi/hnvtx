// "use client";

// import { useEffect, useRef } from "react";
// import { useRouter } from "next/navigation";
// import { PageSpinner } from "../common/ui/LoadingSpinner";
// import { useUserPermissionsExtended } from "@/hooks/useRoleFunctions";
// import { UserRole } from "@/types/user-roles";
// import { UnauthorizedModal } from "./UnauthorizedModal";
// import { useAuthStore } from "@/stores/authStore";
// import { useQuery } from "@tanstack/react-query";
// import { createClient } from "@/utils/supabase/client";

// // A new, dedicated hook to check the user's profile status
// const useUserProfileCheck = (userId?: string) => {
//   const supabase = createClient();
//   return useQuery({
//     queryKey: ['user-profile-check', userId],
//     queryFn: async () => {
//       if (!userId) return null;
//       const { data, error } = await supabase
//         .from('user_profiles')
//         .select('first_name, last_name')
//         .eq('id', userId)
//         .single();
//       if (error) {
//         // PostgREST 'PGRST116' means no rows found, which is a valid state for a new user
//         if (error.code === 'PGRST116') return null; 
//         throw error;
//       }
//       return data;
//     },
//     enabled: !!userId,
//     staleTime: 5 * 60 * 1000, // 5 minutes
//   });
// };

// interface ProtectedProps {
//   children: React.ReactNode;
//   allowedRoles?: UserRole[];
//   redirectTo?: string;
//   fallbackComponent?: React.ReactNode;
// }

// export const Protected: React.FC<ProtectedProps> = ({ children, allowedRoles, redirectTo = "/login" }) => {
//   const authState = useAuthStore((state) => state.authState);
//   const user = useAuthStore((state) => state.user);
//   const router = useRouter();
//   const hasRedirected = useRef(false);

//   // Use the new hook to check the profile
//   const { data: profile, isLoading: isProfileLoading, isError: isProfileError } = useUserProfileCheck(user?.id);
//   const { isSuperAdmin, canAccess, isLoading: isRoleLoading } = useUserPermissionsExtended();

//   useEffect(() => {
//     // Unauthenticated: Redirect to login if not already done
//     if (authState === 'unauthenticated' && !hasRedirected.current) {
//       hasRedirected.current = true;
//       router.replace(redirectTo);
//       return;
//     }

//     // Authenticated: Check for onboarding completion
//     if (authState === 'authenticated' && !isProfileLoading && !isRoleLoading) {
//       // Condition 1: No profile exists OR it's a placeholder created by the trigger.
//       // This indicates the user must complete onboarding.
//       if (!profile || profile.first_name === 'Placeholder') {
//         // Avoid redirecting if already on the onboarding page
//         if (window.location.pathname !== '/onboarding') {
//           router.replace('/onboarding');
//         }
//         return;
//       }

//       // Condition 2: Profile is complete, now check role-based access.
//       if (allowedRoles && !canAccess(allowedRoles) && !isSuperAdmin) {
//         // The UnauthorizedModal will be rendered below.
//         return;
//       }
//     }
//   }, [
//     authState,
//     user,
//     profile,
//     isProfileLoading,
//     isRoleLoading,
//     canAccess,
//     isSuperAdmin,
//     allowedRoles,
//     router,
//     redirectTo
//   ]);

//   // Render states
//   if (authState === 'loading' || isProfileLoading || isRoleLoading) {
//     return <PageSpinner text="Verifying session..." />;
//   }

//   if (authState === 'unauthenticated') {
//     // Return a spinner while the redirect is in progress
//     return <PageSpinner text="Redirecting..." />;
//   }

//   if (authState === 'authenticated' && user) {
//     // If the profile is still loading or doesn't exist yet, show a spinner.
//     // This handles the brief period after login before the profile is available.
//     if (isProfileLoading) return <PageSpinner text="Loading user profile..." />;

//     // If profile exists and is not a placeholder, check role permissions
//     if (profile && profile.first_name !== 'Placeholder') {
//       if (allowedRoles && !canAccess(allowedRoles) && !isSuperAdmin) {
//         return <UnauthorizedModal allowedRoles={allowedRoles} currentRole={user.role} />;
//       }
//       return <>{children}</>;
//     }

//     // If the logic determined the user needs onboarding, the effect will redirect them.
//     // In the meantime, we can show a loading state.
//     if (!profile || profile.first_name === 'Placeholder') {
//         return <PageSpinner text="Redirecting to onboarding..." />;
//     }

//     if(isProfileError){
//       return <PageSpinner text="Redirecting to onboarding..." />;
//     }
//   }

//   // Fallback for any other state
//   return <PageSpinner text="Finalizing..." />;
// };


// components/auth/Protected.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PageSpinner } from "../common/ui/LoadingSpinner";
import { useUserPermissionsExtended } from "@/hooks/useRoleFunctions";
import { UserRole } from "@/types/user-roles";
import { UnauthorizedModal } from "./UnauthorizedModal";
import { useAuthStore } from "@/stores/authStore";

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

  // This hook now only checks for role permissions
  const { isSuperAdmin, canAccess, isLoading: isRoleLoading } = useUserPermissionsExtended();

  useEffect(() => {
    if (authState === 'unauthenticated' && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace(redirectTo);
    }
  }, [authState, router, redirectTo]);

  // Render states
  if (authState === 'loading' || isRoleLoading) {
    return <PageSpinner text="Verifying session..." />;
  }

  if (authState === 'unauthenticated') {
    return <PageSpinner text="Redirecting..." />;
  }

  if (authState === 'authenticated' && user) {
    // Check role-based permissions after authentication is confirmed
    if (allowedRoles && !canAccess(allowedRoles) && !isSuperAdmin) {
      return <UnauthorizedModal allowedRoles={allowedRoles} currentRole={user.role} />;
    }
    // If authorized, render the children
    return <>{children}</>;
  }

  // Fallback for any other state
  return <PageSpinner text="Finalizing..." />;
};