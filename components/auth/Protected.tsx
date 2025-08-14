"use client";

import { useState, useEffect, useRef } from "react";
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

type AuthState = "loading" | "authenticated" | "unauthenticated" | "unauthorized";

export const Protected: React.FC<ProtectedProps> = ({ children, allowedRoles, redirectTo = "/login", fallbackComponent }) => {
  const { role, isSuperAdmin, isLoading: isLoadingRole, canAccess } = useUserPermissionsExtended();
  const authState = useAuthStore((state) => state.authState);
  const user = useAuthStore((state) => state.user);
  const setAuthState = useAuthStore((state) => state.setAuthState);
  const router = useRouter();
  
  const [authStateExtended, setAuthStateExtended] = useState<AuthState>("loading");
  const hasRedirected = useRef(false);
  const [loadingStartTime] = useState(Date.now());
  const isOAuthFlow = useRef(false);
  const recheckTimeout = useRef<NodeJS.Timeout | null>(null);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (recheckTimeout.current) {
        clearTimeout(recheckTimeout.current);
      }
    };
  }, []);

  // Detect OAuth callback flow (runs only once)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;
    const hasOAuthCode = urlParams.has('code');
    const isCallbackPath = pathname.includes('/auth/callback');
    const hasOAuthState = urlParams.has('state');
    isOAuthFlow.current = hasOAuthCode || isCallbackPath || hasOAuthState;
  }, []);

  const handleUnauthenticated = () => {
    if (authState === "unauthenticated" && !hasRedirected.current) {
      // console.log("handleUnauthenticated redirecting");
      // check non blocking way after 2 seconds
      setTimeout(() => {
        // Get current auth state from store instead of closure
        const currentAuthState = useAuthStore.getState().authState;
        if (currentAuthState === "unauthenticated" && !hasRedirected.current) {
          hasRedirected.current = true;
          router.replace(redirectTo);
        }
      }, 1000)
    }
  };

  useEffect(() => {
    // console.log("🔍 Protection Logic Debug:", {
    //   authState,
    //   user,
    //   isLoadingRole,
    //   allowedRoles,
    //   hasRedirected: hasRedirected.current,
    //   isOAuthFlow: isOAuthFlow.current,
    //   "user === null": user === null,
    //   "authState === 'loading'": authState === "loading",
    //   "timeElapsed": Date.now() - loadingStartTime
    // });

    // Clear any pending timeout
    if (recheckTimeout.current) {
      clearTimeout(recheckTimeout.current);
      recheckTimeout.current = null;
    }

    // If auth is explicitly unauthenticated, handle it
    if (authState === "unauthenticated") {
      setAuthStateExtended("unauthenticated");
      handleUnauthenticated();
      return;
    }

    // Enhanced timeout for loading state
    const timeElapsed = Date.now() - loadingStartTime;
    const maxTimeout = isOAuthFlow.current ? 4000 : 2000;

    if (authState === "loading" && user === null && timeElapsed > maxTimeout) {
      // console.log("🚨 TIMEOUT: Force setting unauthenticated after", maxTimeout, "ms");
      setAuthState("unauthenticated");
      return;
    }

    // Only wait for role loading if we have role restrictions AND auth is complete
    const shouldWaitForRole = allowedRoles && allowedRoles.length > 0 && isLoadingRole;
    
    if (authState === "loading" || shouldWaitForRole) {
      setAuthStateExtended("loading");
      return;
    }

    // If we reach here, auth should be resolved
    if (authState === "authenticated" && user) {
      // Reset hasRedirected when we successfully authenticate
      hasRedirected.current = false;
      
      // Check role-based permissions if roles are specified
      if (allowedRoles && allowedRoles.length > 0) {
        if (canAccess(allowedRoles) || isSuperAdmin) {
          setAuthStateExtended("authenticated");
        } else {
          setAuthStateExtended("unauthorized");
        }
      } else {
        // No role restrictions, just authenticated
        setAuthStateExtended("authenticated");
      }
    }
  }, [authState, allowedRoles, canAccess, user, setAuthState, router, redirectTo, isLoadingRole, loadingStartTime]);

  // Render based on current auth state
  switch (authStateExtended) {
    case "loading":
      return <PageSpinner />;

    case "unauthenticated":
      // Show spinner while redirecting to login
      return <PageSpinner />;

    case "unauthorized":
      // Show custom fallback or default unauthorized modal
      return fallbackComponent || <UnauthorizedModal allowedRoles={allowedRoles || []} currentRole={role} />;

    case "authenticated":
      return <>{children}</>;

    default:
      console.error("Unknown auth state:", authStateExtended);
      return <PageSpinner />;
  }
};