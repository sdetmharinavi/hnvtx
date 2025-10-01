import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "system", // Default value
      setTheme: (newTheme: Theme) => {
        set({ theme: newTheme });
      },
    }),
    {
      name: "theme-storage", // localStorage key
    }
  )
);