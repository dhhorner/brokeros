"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "clean-slate" | "executive-dark" | "modern-warm" | "sky-blue" | "sage-green";

const THEMES: { value: Theme; label: string }[] = [
  { value: "clean-slate", label: "Clean Slate" },
  { value: "executive-dark", label: "Executive Dark" },
  { value: "modern-warm", label: "Modern Warm" },
  { value: "sky-blue", label: "Sky Blue" },
  { value: "sage-green", label: "Sage Green" },
];

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
  themes: typeof THEMES;
}>({
  theme: "clean-slate",
  setTheme: () => {},
  themes: THEMES,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("clean-slate");

  useEffect(() => {
    const saved = localStorage.getItem("brokeros-theme") as Theme | null;
    if (saved && THEMES.some((t) => t.value === saved)) {
      setThemeState(saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("brokeros-theme", theme);
  }, [theme]);

  function setTheme(t: Theme) {
    setThemeState(t);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
