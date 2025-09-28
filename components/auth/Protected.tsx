// "use client";

// import { useState, useEffect, useRef } from "react";
// import { useRouter } from "next/navigation";
// import { useUserPermissionsExtended } from "@/hooks/useRoleFunctions";
// import { UserRole } from "@/types/user-roles";
// import { UnauthorizedModal } from "./UnauthorizedModal";
// import { useAuthStore } from "@/stores/authStore";

// interface ProtectedProps {
//   children: React.ReactNode;
//   allowedRoles?: UserRole[];
//   redirectTo?: string;
//   fallbackComponent?: React.ReactNode;
// }

// type AuthState = "loading" | "authenticated" | "unauthenticated" | "unauthorized";

// export const Protected: React.FC<ProtectedProps> = ({ children, allowedRoles, redirectTo = "/login", fallbackComponent }) => {
//   const { role, isSuperAdmin, isLoading: isLoadingRole, canAccess } = useUserPermissionsExtended();
//   const authState = useAuthStore((state) => state.authState);
//   const user = useAuthStore((state) => state.user);
//   const setAuthState = useAuthStore((state) => state.setAuthState);
//   const router = useRouter();
  
//   const [authStateExtended, setAuthStateExtended] = useState<AuthState>("loading");
//   const hasRedirected = useRef(false);
//   const [loadingStartTime] = useState(Date.now());
//   const isOAuthFlow = useRef(false);
//   const recheckTimeout = useRef<NodeJS.Timeout | null>(null);

//   // Clean up timeouts on unmount
//   useEffect(() => {
//     return () => {
//       if (recheckTimeout.current) {
//         clearTimeout(recheckTimeout.current);
//       }
//     };
//   }, []);

//   // Detect OAuth callback flow (runs only once)
//   useEffect(() => {
//     const urlParams = new URLSearchParams(window.location.search);
//     const pathname = window.location.pathname;
//     const hasOAuthCode = urlParams.has('code');
//     const isCallbackPath = pathname.includes('/auth/callback');
//     const hasOAuthState = urlParams.has('state');
//     isOAuthFlow.current = hasOAuthCode || isCallbackPath || hasOAuthState;
//   }, []);

//   useEffect(() => {
//     // console.log("🔍 Protection Logic Debug:", {
//     //   authState,
//     //   user,
//     //   isLoadingRole,
//     //   allowedRoles,
//     //   hasRedirected: hasRedirected.current,
//     //   isOAuthFlow: isOAuthFlow.current,
//     //   "user === null": user === null,
//     //   "authState === 'loading'": authState === "loading",
//     //   "timeElapsed": Date.now() - loadingStartTime
//     // });

//     // Clear any pending timeout
//     if (recheckTimeout.current) {
//       clearTimeout(recheckTimeout.current);
//       recheckTimeout.current = null;
//     }

//     // If auth is explicitly unauthenticated, handle it
//     if (authState === "unauthenticated") {
//       // Only update state if it's not already unauthenticated to prevent unnecessary re-renders
//       if (authStateExtended !== "unauthenticated") {
//         setAuthStateExtended("unauthenticated");
//       }
//       // Don't call handleUnauthenticated here - we'll handle the redirect in the render phase
//       return;
//     }

//     // Enhanced timeout for loading state
//     const timeElapsed = Date.now() - loadingStartTime;
//     const maxTimeout = isOAuthFlow.current ? 4000 : 2000;

//     if (authState === "loading" && user === null && timeElapsed > maxTimeout) {
//       // console.log("🚨 TIMEOUT: Force setting unauthenticated after", maxTimeout, "ms");
//       setAuthState("unauthenticated");
//       return;
//     }

//     // Only wait for role loading if we have role restrictions AND auth is complete
//     const shouldWaitForRole = allowedRoles && allowedRoles.length > 0 && isLoadingRole;
    
//     if (authState === "loading" || shouldWaitForRole) {
//       setAuthStateExtended("loading");
//       return;
//     }

//     // If we reach here, auth should be resolved
//     if (authState === "authenticated" && user) {
//       // Reset hasRedirected when we successfully authenticate
//       hasRedirected.current = false;
      
//       // Check role-based permissions if roles are specified
//       if (allowedRoles && allowedRoles.length > 0) {
//         if (canAccess(allowedRoles) || isSuperAdmin) {
//           setAuthStateExtended("authenticated");
//         } else {
//           setAuthStateExtended("unauthorized");
//         }
//       } else {
//         // No role restrictions, just authenticated
//         setAuthStateExtended("authenticated");
//       }
//     }
//   }, [authState, allowedRoles, canAccess, user, setAuthState, router, redirectTo, isLoadingRole, loadingStartTime]);

//   // Don't render anything until we've determined the auth state
//   if (authStateExtended === "loading") {
//     return null; // Or <PageSpinner /> if you prefer
//   }

//   // Handle unauthenticated state
//   if (authStateExtended === "unauthenticated") {
//     // Use a timeout to prevent flash of content
//     const handleRedirect = () => {
//       if (!hasRedirected.current) {
//         hasRedirected.current = true;
//         router.replace(redirectTo);
//       }
//     };
    
//     // Queue the redirect to the next tick to ensure we don't block rendering
//     setTimeout(handleRedirect, 0);
//     return null; // Or <PageSpinner /> if you prefer
//   }

//   // Handle unauthorized state
//   if (authStateExtended === "unauthorized") {
//     return fallbackComponent || <UnauthorizedModal allowedRoles={allowedRoles || []} currentRole={role} />;
//   }

//   // If we get here, user is authenticated and authorized
//   return <>{children}</>;
// };

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

// A new, dedicated hook to check the user's profile status
const useUserProfileCheck = (userId?: string) => {
  const supabase = createClient();
  return useQuery({
    queryKey: ['user-profile-check', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();
      if (error) {
        // PostgREST 'PGRST116' means no rows found, which is a valid state for a new user
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

  // Use the new hook to check the profile
  const { data: profile, isLoading: isProfileLoading, isError: isProfileError } = useUserProfileCheck(user?.id);
  const { isSuperAdmin, canAccess, isLoading: isRoleLoading } = useUserPermissionsExtended();

  useEffect(() => {
    // Unauthenticated: Redirect to login if not already done
    if (authState === 'unauthenticated' && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace(redirectTo);
      return;
    }

    // Authenticated: Check for onboarding completion
    if (authState === 'authenticated' && !isProfileLoading && !isRoleLoading) {
      // Condition 1: No profile exists OR it's a placeholder created by the trigger.
      // This indicates the user must complete onboarding.
      if (!profile || profile.first_name === 'Placeholder') {
        // Avoid redirecting if already on the onboarding page
        if (window.location.pathname !== '/onboarding') {
          router.replace('/onboarding');
        }
        return;
      }

      // Condition 2: Profile is complete, now check role-based access.
      if (allowedRoles && !canAccess(allowedRoles) && !isSuperAdmin) {
        // The UnauthorizedModal will be rendered below.
        return;
      }
    }
  }, [
    authState,
    user,
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

  if (authState === 'unauthenticated') {
    // Return a spinner while the redirect is in progress
    return <PageSpinner text="Redirecting..." />;
  }

  if (authState === 'authenticated' && user) {
    // If the profile is still loading or doesn't exist yet, show a spinner.
    // This handles the brief period after login before the profile is available.
    if (isProfileLoading) return <PageSpinner text="Loading user profile..." />;

    // If profile exists and is not a placeholder, check role permissions
    if (profile && profile.first_name !== 'Placeholder') {
      if (allowedRoles && !canAccess(allowedRoles) && !isSuperAdmin) {
        return <UnauthorizedModal allowedRoles={allowedRoles} currentRole={user.role} />;
      }
      return <>{children}</>;
    }

    // If the logic determined the user needs onboarding, the effect will redirect them.
    // In the meantime, we can show a loading state.
    if (!profile || profile.first_name === 'Placeholder') {
        return <PageSpinner text="Redirecting to onboarding..." />;
    }

    if(isProfileError){
      return <PageSpinner text="Redirecting to onboarding..." />;
    }
  }

  // Fallback for any other state
  return <PageSpinner text="Finalizing..." />;
};