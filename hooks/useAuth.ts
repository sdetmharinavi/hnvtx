// hooks/useAuth.ts
"use client";

import { useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

// Auth Hook
export const useAuth = () => {
  const { user, authState, setUser, setAuthState, logout: logoutStore, executeWithLoading, isAuthenticated, isLoading, getUserId } = useAuthStore();
  const supabase = useMemo(() => createClient(), []);

  // Initialize auth state - runs only once
  useEffect(() => {
    let isMounted = true;
    const subscription = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
      }
    }).data.subscription;

    const initAuth = async () => {
      try {
        // First try to get existing session without forcing refresh
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession?.user) {
          if (isMounted) setUser(existingSession.user);
          return;
        }

        // Only force refresh if no existing session
        const { data: { session }, error } = await supabase.auth.refreshSession();

        if (error) {
          if (isMounted) setAuthState("unauthenticated");
          return;
        }

        if (session?.user && isMounted) {
          setUser(session.user);
        } else if (isMounted) {
          setAuthState("unauthenticated");
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to initialize auth:", error instanceof Error ? error.message : "Unknown error");
          setAuthState("unauthenticated");
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [supabase, setUser, setAuthState]);

  // Memoized auth methods
  const signUp = useCallback(async (credentials: { email: string; password: string; firstName: string; lastName: string }) => {
    return executeWithLoading(async () => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: credentials.email,
          password: credentials.password,
          options: {
            data: {
              first_name: credentials.firstName,
              last_name: credentials.lastName,
            },
          },
        });

        if (error) throw error;
        if (data.user && !data.session) {
          toast.success("Signup successful! Please check your email for verification.");
        }
        return { data, error: null };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Signup failed";
        toast.error(message);
        return { data: null, error: message };
      }
    });
  }, [executeWithLoading, supabase.auth]);

  const signIn = useCallback(async (email: string, password: string) => {
    return executeWithLoading(async () => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in successfully!");
        return { data, error: null };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Sign in failed";
        toast.error(message);
        return { data: null, error: message };
      }
    });
  }, [executeWithLoading, supabase.auth]);

  const signInWithMagicLink = useCallback(async (email: string) => {
    return executeWithLoading(async () => {
      try {
        const { data, error } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: true },
        });
        if (error) throw error;
        toast.success("Check your email for the magic link!");
        return { data, error: null };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to send magic link";
        toast.error(message);
        return { data: null, error: message };
      }
    });
  }, [executeWithLoading, supabase.auth]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (data) sessionStorage.removeItem('oauth_in_progress');
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google sign in failed";
      toast.error(message);
      return { data: null, error: message };
    }
  }, [supabase.auth]);

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      logoutStore();
      toast.success("Signed out successfully!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Logout failed";
      toast.error(message);
      logoutStore();
      throw error;
    }
  }, [supabase.auth, logoutStore]);

  const forgotPassword = useCallback(async (email: string) => {
    return executeWithLoading(async () => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        return { error: null };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to send reset email";
        toast.error(message);
        return { error: message };
      } finally {
        setAuthState("unauthenticated");
      }
    });
  }, [executeWithLoading, supabase.auth, setAuthState]);

  const resetPassword = useCallback(async (newPassword: string) => {
    return executeWithLoading(async () => {
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        toast.success("Password updated successfully!");
        return { error: null };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Password update failed";
        toast.error(message);
        return { error: message };
      }
    });
  }, [executeWithLoading, supabase.auth]);

  const syncSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error("Session sync error:", error);
        return false;
      }
      if (session?.user) {
        setUser(session.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to sync session:", error);
      return false;
    }
  }, [supabase.auth, setUser]);

  const checkSession = useCallback(async () => {
    return executeWithLoading(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      return session;
    });
  }, [executeWithLoading, supabase.auth, setUser]);

  // Memoize the entire return value
  return useMemo(() => ({
    // State
    user,
    authState,
    isLoading: isLoading(),
    isAuthenticated: isAuthenticated(),
    userId: getUserId(),

    // Actions
    signUp,
    signIn,
    signInWithMagicLink,
    signInWithGoogle,
    logout,
    forgotPassword,
    resetPassword,
    syncSession,
    checkSession,
  }), [
    user,
    authState,
    isLoading,
    isAuthenticated,
    getUserId,
    signUp,
    signIn,
    signInWithMagicLink,
    signInWithGoogle,
    logout,
    forgotPassword,
    resetPassword,
    syncSession,
    checkSession
  ]);
};