// /Users/orperetz/Documents/AMS/apps/frontend/lib/providers.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Toaster } from '../components/ui/toaster';
import { toast } from '../components/ui/use-toast';
import { type Locale, getLocaleDirection, getStoredLocale, translate } from './i18n';

// Theme Provider
type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "amit-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Only run on client side
  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem(storageKey) as Theme;
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!mounted) return;
    
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme, mounted]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      if (mounted) {
        localStorage.setItem(storageKey, newTheme);
      }
      setTheme(newTheme);
    },
  };

  // Prevent flash of wrong theme by not rendering until mounted
  if (!mounted) {
    return (
      <ThemeProviderContext.Provider {...props} value={value}>
        {children}
      </ThemeProviderContext.Provider>
    );
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};

// Direction Provider
type Direction = "rtl" | "ltr";

type DirectionProviderProps = {
  children: React.ReactNode;
  defaultDirection?: Direction;
  storageKey?: string;
};

type DirectionProviderState = {
  direction: Direction;
  setDirection: (direction: Direction) => void;
  isRTL: boolean;
};

const DirectionProviderContext = createContext<DirectionProviderState>({
  direction: "rtl",
  setDirection: () => null,
  isRTL: true,
});

export function DirectionProvider({
  children,
  defaultDirection = "rtl",
  storageKey = "amit-direction",
}: DirectionProviderProps) {
  const [direction, setDirection] = useState<Direction>(defaultDirection);
  const [mounted, setMounted] = useState(false);

  // Only run on client side
  useEffect(() => {
    setMounted(true);
    const storedDirection = localStorage.getItem(storageKey) as Direction;
    if (storedDirection) {
      setDirection(storedDirection);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!mounted) return;
    
    const html = window.document.documentElement;
    html.setAttribute('dir', direction);
    html.lang = direction === 'rtl' ? 'he' : 'en';
  }, [direction, mounted]);

  const value = {
    direction,
    isRTL: direction === 'rtl',
    setDirection: (newDirection: Direction) => {
      if (mounted) {
        localStorage.setItem(storageKey, newDirection);
      }
      setDirection(newDirection);
    },
  };

  return (
    <DirectionProviderContext.Provider value={value}>
      {children}
    </DirectionProviderContext.Provider>
  );
}

export const useDirection = () => {
  const context = useContext(DirectionProviderContext);

  if (context === undefined)
    throw new Error("useDirection must be used within a DirectionProvider");

  return context;
};

// Locale Provider
type LocaleProviderProps = {
  children: React.ReactNode;
  defaultLocale?: Locale;
  storageKey?: string;
};

type LocaleProviderState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const LocaleProviderContext = createContext<LocaleProviderState>({
  locale: "he",
  setLocale: () => null,
  t: (key: string) => key,
});

export function LocaleProvider({
  children,
  defaultLocale = "he",
  storageKey = "amit-locale",
}: LocaleProviderProps) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [mounted, setMounted] = useState(false);

  // Only run on client side
  useEffect(() => {
    setMounted(true);
    setLocale(getStoredLocale(defaultLocale));
  }, [storageKey]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    return translate(locale, key, params);
  };

  const value = {
    locale,
    setLocale: (newLocale: Locale) => {
      if (mounted) {
        localStorage.setItem(storageKey, newLocale);
      }
      setLocale(newLocale);
    },
    t,
  };

  return (
    <LocaleProviderContext.Provider value={value}>
      {children}
    </LocaleProviderContext.Provider>
  );
}

export const useLocale = () => {
  const context = useContext(LocaleProviderContext);

  if (context === undefined)
    throw new Error("useLocale must be used within a LocaleProvider");

  return context;
};

// Combined Providers
export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_API_BASE) {
      toast({
        title: 'Missing API base',
        description: 'NEXT_PUBLIC_API_BASE is not set',
      });
    }
  }, []);
  return (
    <ThemeProvider defaultTheme="light" storageKey="amit-theme">
      <DirectionProvider defaultDirection={getLocaleDirection('he')} storageKey="amit-direction">
        <LocaleProvider defaultLocale="he" storageKey="amit-locale">
          {children}
          <Toaster />
        </LocaleProvider>
      </DirectionProvider>
    </ThemeProvider>
  );
}
