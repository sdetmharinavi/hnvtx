"use client";

import { hydrateThemeStore, Theme, useThemeStore } from "@/stores/themeStore";
import { useEffect } from "react";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme, hydrated } = useThemeStore();

  // Hydrate theme from localStorage on mount
  useEffect(() => {
    // Add class to disable transitions during initial load
    document.documentElement.classList.add("no-transition");

    hydrateThemeStore();

    // Re-enable transitions after a short delay
    setTimeout(() => {
      document.documentElement.classList.remove("no-transition");
    }, 50);
  }, []);

  // Apply theme when hydrated or theme changes
  useEffect(() => {
    if (!hydrated) return;

    const applyTheme = (theme: Theme) => {
      const isDark =
        theme === "dark" ||
        (theme === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    applyTheme(theme);

    // Listen for system theme changes
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme("system");

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme, hydrated]);

  return <>{children}</>;
}