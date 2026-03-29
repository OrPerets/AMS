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
  getStoredDirection,
  getStoredLocale,
  getStoredRegionalFormat,
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
  const [hydratedTheme, setHydratedTheme] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const storedTheme = window.localStorage.getItem(storageKey);
    if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
      setTheme(storedTheme);
    }
    setHydratedTheme(true);
  }, [defaultTheme, mounted, storageKey]);

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

  useEffect(() => {
    if (!mounted || !hydratedTheme) return;
    window.localStorage.setItem(storageKey, theme);
  }, [hydratedTheme, mounted, storageKey, theme]);

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
  const [direction, setDirectionState] = useState<Direction>(defaultDirection);
  const [hydratedDirection, setHydratedDirection] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedDirection = getStoredDirection();
    if (storedDirection) {
      setDirectionState(storedDirection);
    } else {
      setDirectionState(getLocaleDirection(getStoredLocale(defaultDirection === 'ltr' ? 'en' : 'he')));
    }
    setHydratedDirection(true);
  }, [defaultDirection]);

  useEffect(() => {
    if (typeof window === 'undefined' || !hydratedDirection) return;

    const html = window.document.documentElement;
    html.setAttribute('dir', direction);
    window.localStorage.setItem(storageKey, direction);
  }, [direction, hydratedDirection, storageKey]);

  const value = {
    direction,
    isRTL: direction === 'rtl',
    setDirection: (nextDirection: Direction) => {
      setDirectionState(nextDirection);
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
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [regionalFormat, setRegionalFormatState] = useState<RegionalFormat>(defaultLocale === 'en' ? 'en-US' : 'he-IL');
  const [hydratedLocale, setHydratedLocale] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setLocaleState(getStoredLocale(defaultLocale));
    setRegionalFormatState(getStoredRegionalFormat());
    setHydratedLocale(true);
  }, [defaultLocale]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    return translate(locale, key, params);
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !hydratedLocale) return;

    window.document.documentElement.lang = locale;
    window.localStorage.setItem(storageKey, locale);
  }, [hydratedLocale, locale, storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined' || !hydratedLocale) return;

    window.localStorage.setItem('amit-regional-format', regionalFormat);
  }, [hydratedLocale, regionalFormat]);

  const value: LocaleProviderState = {
    locale,
    setLocale: (nextLocale: Locale) => {
      setLocaleState(nextLocale);
      setRegionalFormatState((currentFormat) => {
        const currentLocale = currentFormat.startsWith('en') ? 'en' : 'he';
        if (currentLocale === nextLocale) {
          return currentFormat;
        }
        return nextLocale === 'en' ? 'en-US' : 'he-IL';
      });
    },
    regionalFormat,
    setRegionalFormat: (format: RegionalFormat) => {
      setRegionalFormatState(format);
      setLocaleState(format.startsWith('en') ? 'en' : 'he');
    },
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
