"use client";

import { useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";

export type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const THEME_STORAGE_KEY = "wellmen-theme";

const listeners = new Set<() => void>();
let currentTheme: ThemeMode = "light";

const notify = () => {
  listeners.forEach((listener) => listener());
};

const applyTheme = (theme: ThemeMode) => {
  currentTheme = theme;

  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  notify();
};

const readPreferredTheme = (): ThemeMode => {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
    ? "dark"
    : "light";
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => currentTheme;

const getServerSnapshot = () => "light" as ThemeMode;

export function useThemeMode(): ThemeContextValue {
  const theme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return useMemo(
    () => ({
      theme,
      setTheme: applyTheme,
      toggleTheme: () =>
        applyTheme(theme === "light" ? "dark" : "light"),
    }),
    [theme],
  );
}

export default function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  useEffect(() => {
    applyTheme(readPreferredTheme());

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      if (event.newValue !== "light" && event.newValue !== "dark") return;
      applyTheme(event.newValue);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return children;
}
