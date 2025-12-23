// path: stores/themeStore.ts
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  subscribeWithSelector( // THIS IS THE FIX: Wrap with subscribeWithSelector
    persist(
      (set) => ({
        theme: "system", // Default value
        setTheme: (newTheme: Theme) => {
          set({ theme: newTheme });
        },
      }),
      {
        name: "theme-storage", // localStorage key
        partialize: (state) => ({ theme: state.theme }),
      }
    )
  )
);