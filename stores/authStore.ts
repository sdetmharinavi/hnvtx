// stores/authStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User } from '@supabase/supabase-js';

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthStore {
  // Auth State
  user: User | null;
  authState: AuthState;

  // Actions
  setUser: (user: User | null) => void;
  setAuthState: (state: AuthState) => void;
  logout: () => void;

  // Async action wrapper to handle loading states
  executeWithLoading: <T>(action: () => Promise<T>) => Promise<T>;

  // Getters
  isLoading: () => boolean;
  isAuthenticated: () => boolean;
  getUserId: () => string | null;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    devtools(
      (set, get) => ({
        // Initial State
        user: null,
        authState: 'loading',

        // Actions
        setUser: (user) => {
          // Only update if the user has actually changed
          const currentUser = get().user;
          if (user?.id !== currentUser?.id) {
            set({
              user,
              authState: user ? 'authenticated' : 'unauthenticated',
            });
          }
        },

        setAuthState: (newAuthState) => {
          // Only update if the state has actually changed
          if (get().authState !== newAuthState) {
            set({ authState: newAuthState });
          }
        },

        logout: () => {
          set({
            user: null,
            authState: 'unauthenticated',
          });
        },

        executeWithLoading: async <T>(action: () => Promise<T>): Promise<T> => {
          if (get().authState !== 'loading') {
            set({ authState: 'loading' });
          }

          try {
            const result = await action();
            // The onAuthStateChange listener is the primary driver for state changes.
            // This is a reliable fallback to ensure the UI doesn't get stuck in loading.
            if (get().authState === 'loading') {
              const finalUser = get().user;
              set({ authState: finalUser ? 'authenticated' : 'unauthenticated' });
            }
            return result;
          } catch (error) {
            // // On error, let onAuthStateChange handle the state, or fall back.
            // const finalUser = get().user;
            // set({ authState: finalUser ? "authenticated" : "unauthenticated" });
            // throw error;
            // On any error within the action, assume the session might be invalid.
            // Set the state directly to 'unauthenticated'.
            set({ authState: 'unauthenticated', user: null }); // Also clear the user
            throw error;
          }
        },

        // Getters
        isLoading: () => {
          return get().authState === 'loading';
        },

        isAuthenticated: () => {
          const { user, authState } = get();
          return user !== null && authState === 'authenticated';
        },

        getUserId: () => {
          const { user } = get();
          return user?.id || null;
        },
      }),
      {
        name: 'AuthenticationStore',
      }
    ),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        authState: state.authState,
      }),
    }
  )
);
