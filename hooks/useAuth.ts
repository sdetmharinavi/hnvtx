'use client';

import { useEffect, useMemo, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { AuthError, Subscription } from '@supabase/supabase-js';

interface AuthActionResult {
  success: boolean;
  error: AuthError | null;
}

let listenerCount = 0;
let authSubscription: Subscription | null = null;
let isInitializing = false;

export const useAuth = () => {
  const {
    user,
    authState,
    setUser,
    setAuthState,
    logout: logoutStore,
    executeWithLoading,
    isAuthenticated,
    isLoading,
    getUserId,
  } = useAuthStore();

  const supabase = useMemo(() => createClient(), []);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    listenerCount++;

    const initAuth = async () => {
      try {
        const {
          data: { session: existingSession },
        } = await supabase.auth.getSession();

        if (existingSession?.user) {
          useAuthStore.getState().setUser(existingSession.user);
          return;
        }

        const {
          data: { session },
          error,
        } = await supabase.auth.refreshSession();

        if (error) {
          useAuthStore.getState().setAuthState('unauthenticated');
          return;
        }

        if (session?.user) {
          useAuthStore.getState().setUser(session.user);
        } else {
          useAuthStore.getState().setAuthState('unauthenticated');
        }
      } catch (error) {
        console.error(
          'Failed to initialize auth:',
          error instanceof Error ? error.message : 'Unknown error',
        );
        useAuthStore.getState().setAuthState('unauthenticated');
      } finally {
        isInitializing = false;
      }
    };

    if (listenerCount === 1) {
      authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
        useAuthStore.getState().setUser(session?.user ?? null);
      }).data.subscription;

      if (!isInitializing) {
        isInitializing = true;
        initAuth();
      }
    }

    const timeoutId = setTimeout(() => {
      if (useAuthStore.getState().authState === 'loading' && isMounted) {
        console.warn('Auth check timed out. Forcing unauthenticated state.');
        useAuthStore.getState().setAuthState('unauthenticated');
      }
    }, 8000);

    return () => {
      isMounted = false;
      listenerCount--;
      clearTimeout(timeoutId);

      if (listenerCount === 0 && authSubscription) {
        authSubscription.unsubscribe();
        authSubscription = null;
      }
    };
  }, [supabase]);

  const signUp = useCallback(
    async (credentials: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    }): Promise<AuthActionResult> => {
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
            toast.success('Signup successful! Please check your email for verification.');
          }
          return { success: true, error: null };
        } catch (error) {
          const authError = error as AuthError;
          toast.error(authError.message || 'Signup failed');
          return { success: false, error: authError };
        }
      });
    },
    [executeWithLoading, supabase.auth],
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthActionResult> => {
      return executeWithLoading(async () => {
        try {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          toast.success('Signed in successfully!');
          return { success: true, error: null };
        } catch (error) {
          const authError = error as AuthError;
          toast.error(authError.message || 'Sign in failed');
          return { success: false, error: authError };
        }
      });
    },
    [executeWithLoading, supabase.auth],
  );

  const signInWithGoogle = useCallback(async () => {
    if (isProcessingRef.current) return { success: false, error: null };
    try {
      isProcessingRef.current = true;
      sessionStorage.setItem('oauth_in_progress', 'true');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
      return { success: true, error: null };
    } catch (error) {
      sessionStorage.removeItem('oauth_in_progress');
      const authError = error as AuthError;
      toast.error(authError.message || 'Google sign in failed');
      return { success: false, error: authError };
    } finally {
      isProcessingRef.current = false;
    }
  }, [supabase.auth]);

  const logout = useCallback(async (): Promise<AuthActionResult> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      logoutStore();
      toast.success('Signed out successfully!');
      return { success: true, error: null };
    } catch (error) {
      const authError = error as AuthError;
      toast.error(authError.message || 'Logout failed');
      logoutStore();
      return { success: false, error: authError };
    }
  }, [supabase.auth, logoutStore]);

  const forgotPassword = useCallback(
    async (email: string): Promise<AuthActionResult> => {
      return executeWithLoading(async () => {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });
          if (error) throw error;
          toast.success('Password reset email sent!');
          return { success: true, error: null };
        } catch (error) {
          const authError = error as AuthError;
          toast.error(authError.message || 'Failed to send reset email');
          return { success: false, error: authError };
        } finally {
          setAuthState('unauthenticated');
        }
      });
    },
    [executeWithLoading, supabase.auth, setAuthState],
  );

  const resetPassword = useCallback(
    async (newPassword: string): Promise<AuthActionResult> => {
      return executeWithLoading(async () => {
        try {
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (error) throw error;
          toast.success('Password updated successfully!');
          return { success: true, error: null };
        } catch (error) {
          const authError = error as AuthError;
          toast.error(authError.message || 'Password update failed');
          return { success: false, error: authError };
        }
      });
    },
    [executeWithLoading, supabase.auth],
  );

  const syncSession = useCallback(async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession();
      if (error) return false;
      if (session?.user) {
        setUser(session.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to sync session:', error);
      return false;
    }
  }, [supabase.auth, setUser]);

  return useMemo(
    () => ({
      user,
      authState,
      isLoading: isLoading(),
      isAuthenticated: isAuthenticated(),
      getUserId: getUserId(),
      signUp,
      signIn,
      signInWithGoogle,
      logout,
      forgotPassword,
      resetPassword,
      syncSession,
    }),
    [
      user,
      authState,
      isLoading,
      isAuthenticated,
      getUserId,
      signUp,
      signIn,
      signInWithGoogle,
      logout,
      forgotPassword,
      resetPassword,
      syncSession,
    ],
  );
};
