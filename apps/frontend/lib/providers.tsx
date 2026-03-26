// /Users/orperetz/Documents/AMS/apps/frontend/lib/providers.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { HeroUIProvider } from '@heroui/react';
import { Toaster } from '../components/ui/toaster';
import { toast } from '../components/ui/use-toast';
import {
  type Direction,
  type Locale,
  type RegionalFormat,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatTime,
  getLocaleDirection,
  translate,
} from './i18n';

// Theme Provider
type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => null,
};

function resolveThemeValue(theme: Theme): "light" | "dark" {
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "amit-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
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
    const nextResolvedTheme = resolveThemeValue(theme);
    setResolvedTheme(nextResolvedTheme);

    root.classList.remove("light", "dark", "ams-light", "ams-dark");
    root.classList.add(nextResolvedTheme, `ams-${nextResolvedTheme}`);
    root.setAttribute("data-theme", `ams-${nextResolvedTheme}`);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted || theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => setResolvedTheme(resolveThemeValue("system"));
    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mounted, theme]);

  const value = {
    theme,
    resolvedTheme,
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

function HeroUIBridgeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { regionalFormat } = useLocale();

  return (
    <HeroUIProvider
      navigate={(path) => router.push(String(path))}
      useHref={(href) => String(href)}
      locale={regionalFormat}
      reducedMotion="user"
    >
      {children}
    </HeroUIProvider>
  );
}

// Direction Provider

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
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const html = window.document.documentElement;
    localStorage.removeItem(storageKey);
    html.setAttribute('dir', defaultDirection);
    html.lang = 'he';
  }, [storageKey]);

  const value = {
    direction: defaultDirection,
    isRTL: true,
    setDirection: () => null,
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
  regionalFormat: RegionalFormat;
  setRegionalFormat: (format: RegionalFormat) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  fmtDate: (date: Date | string | number) => string;
  fmtTime: (date: Date | string | number) => string;
  fmtDateTime: (date: Date | string | number) => string;
  fmtNumber: (value: number) => string;
  fmtCurrency: (value: number, currency?: string) => string;
};

const LocaleProviderContext = createContext<LocaleProviderState>({
  locale: "he",
  setLocale: () => null,
  regionalFormat: "he-IL",
  setRegionalFormat: () => null,
  t: (key: string) => key,
  fmtDate: () => '',
  fmtTime: () => '',
  fmtDateTime: () => '',
  fmtNumber: () => '',
  fmtCurrency: () => '',
});

export function LocaleProvider({
  children,
  defaultLocale = "he",
  storageKey = "amit-locale",
}: LocaleProviderProps) {
  const [regionalFormat, setRegionalFormatState] = useState<RegionalFormat>('he-IL');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(storageKey);
    localStorage.removeItem('amit-regional-format');
    setRegionalFormatState('he-IL');
  }, [storageKey]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    return translate(defaultLocale, key, params);
  };

  const value: LocaleProviderState = {
    locale: defaultLocale,
    setLocale: () => null,
    regionalFormat,
    setRegionalFormat: () => null,
    t,
    fmtDate: (date) => formatDate(date, regionalFormat),
    fmtTime: (date) => formatTime(date, regionalFormat),
    fmtDateTime: (date) => formatDateTime(date, regionalFormat),
    fmtNumber: (value) => formatNumber(value, regionalFormat),
    fmtCurrency: (value, currency) => formatCurrency(value, currency, regionalFormat),
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
          <HeroUIBridgeProvider>{children}</HeroUIBridgeProvider>
          <Toaster />
        </LocaleProvider>
      </DirectionProvider>
    </ThemeProvider>
  );
}
