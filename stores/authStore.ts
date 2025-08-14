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
          set({
            user,
            authState: user ? "authenticated" : "unauthenticated",
          });
        },

        setAuthState: (authState) => {
          set({ authState });
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

          // Only set loading if not already in a loading state
          if (currentState !== "loading") {
            set({ authState: "loading" });
          }

          try {
            const result = await action();

            // IMPORTANT: Don't automatically restore state after action completes
            // Let the action itself set the final state (like logout setting "unauthenticated")
            // Only restore if the state is still "loading" (meaning action didn't set a final state)
            const stateAfterAction = get().authState;
            if (stateAfterAction === "loading") {
              set({
                authState: get().user ? "authenticated" : "unauthenticated",
              });
            }

            return result;
          } catch (error) {
            // On error, reset to appropriate state
            set({
              authState: get().user ? "authenticated" : "unauthenticated",
            });
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
