// stores/authStore.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { User } from "@supabase/supabase-js";

export type AuthState = "loading" | "authenticated" | "unauthenticated";

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
        authState: "loading",

        // Actions
        setUser: (user) => {
          // Only update if the user has actually changed
          const currentUser = get().user;
          if (user?.id !== currentUser?.id) {
            set({
              user,
              authState: user ? "authenticated" : "unauthenticated",
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
            authState: "unauthenticated",
          });
        },

        // Fixed async action wrapper
        executeWithLoading: async <T>(action: () => Promise<T>): Promise<T> => {
          const currentState = get().authState;
          const currentUser = get().user;

          // Only set loading if not already in a loading state
          if (currentState !== "loading") {
            set({ authState: "loading" });
          }

          try {
            const result = await action();
            
            // Get the latest state after action completes
            const { authState: latestState, user: latestUser } = get();
            
            // Only update state if still in loading state and we have a definitive state
            if (latestState === "loading") {
              // If user exists, we're authenticated, otherwise unauthenticated
              const newState = latestUser ? "authenticated" : "unauthenticated";
              if (newState !== currentState) {
                set({ authState: newState });
              }
            }

            return result;
          } catch (error) {
            // On error, reset to appropriate state based on current user
            const { user } = get();
            const newState = user ? "authenticated" : "unauthenticated";
            if (newState !== currentState) {
              set({ authState: newState });
            }
            throw error;
          }
        },

        // Getters
        isLoading: () => {
          return get().authState === "loading";
        },

        isAuthenticated: () => {
          const { user, authState } = get();
          return user !== null && authState === "authenticated";
        },

        getUserId: () => {
          const { user } = get();
          return user?.id || null;
        },
      }),
      {
        name: "AuthenticationStore",
      }
    ),
    {
      name: "auth-store",
      partialize: (state) => ({
        user: state.user,
        authState: state.authState,
      }),
    }
  )
);
