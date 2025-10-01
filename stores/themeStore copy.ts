import { create } from "zustand";

export type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
}

export const useThemeStore = create<ThemeState>()((set, get) => ({
  // NEVER access localStorage in initial state - always use default
  theme: "system", // Default value, no localStorage access
  hydrated: false,

  setTheme: (newTheme: Theme) => {
    set({ theme: newTheme });
    // Only access localStorage in actions (client-side)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("theme-storage", newTheme);
      } catch (error) {
        console.warn("Failed to save theme:", error);
      }
    }
  },

  setHydrated: (hydrated: boolean) => set({ hydrated }),
}));

// Client-side hydration function
export const hydrateThemeStore = () => {
  if (typeof window === "undefined") return;

  try {
    const storedTheme = localStorage.getItem("theme-storage");
    if (storedTheme && ["light", "dark", "system"].includes(storedTheme)) {
      useThemeStore.setState({
        theme: storedTheme as Theme,
        hydrated: true,
      });
    } else {
      useThemeStore.setState({ hydrated: true });
    }
  } catch (error) {
    console.warn("Failed to load theme:", error);
    useThemeStore.setState({ hydrated: true });
  }
};