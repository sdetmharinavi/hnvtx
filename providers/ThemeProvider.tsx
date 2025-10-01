"use client";

import { useEffect } from "react";
import { useThemeStore, Theme } from "@/stores/themeStore";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useThemeStore((state) => state.theme);

  // This useEffect now only needs to react to subsequent theme changes.
  useEffect(() => {
    const applyTheme = (themeToApply: Theme) => {
      const root = document.documentElement;
      
      const isDark =
        themeToApply === "dark" ||
        (themeToApply === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      // Simply toggle the class. No need for transition management.
      root.classList.toggle("dark", isDark);
    };

    applyTheme(theme);

    // If the theme is 'system', we still need to listen for OS-level changes.
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme("system");

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  return <>{children}</>;
}