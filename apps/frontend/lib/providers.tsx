// /Users/orperetz/Documents/AMS/apps/frontend/lib/providers.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Toaster } from '../components/ui/toaster';

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
type Locale = "he" | "en";

type LocaleProviderProps = {
  children: React.ReactNode;
  defaultLocale?: Locale;
  storageKey?: string;
};

type LocaleProviderState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
};

const LocaleProviderContext = createContext<LocaleProviderState>({
  locale: "he",
  setLocale: () => null,
  t: (key: string) => key,
});

// Basic translations - in a real app, you'd use next-intl or similar
const translations: Record<Locale, Record<string, string>> = {
  he: {
    // Navigation
    'nav.home': 'דף הבית',
    'nav.dashboard': 'דשבורד',
    'nav.tickets': 'קריאות שירות',
    'nav.buildings': 'בניינים',
    'nav.payments': 'תשלומים',
    'nav.tech-jobs': 'משימות טכנאי',
    'nav.admin': 'ניהול',
    
    // Common
    'common.loading': 'טוען...',
    'common.error': 'שגיאה',
    'common.success': 'הצלחה',
    'common.save': 'שמור',
    'common.cancel': 'בטל',
    'common.delete': 'מחק',
    'common.edit': 'ערוך',
    'common.view': 'צפה',
    'common.search': 'חיפוש',
    'common.filter': 'סינון',
    'common.export': 'יצוא',
    'common.print': 'הדפס',
    'common.refresh': 'רענן',
    'common.back': 'חזור',
    'common.next': 'הבא',
    'common.previous': 'הקודם',
    'common.close': 'סגור',
    'common.open': 'פתח',
    
    // Status
    'status.open': 'פתוח',
    'status.closed': 'סגור',
    'status.in-progress': 'בתהליך',
    'status.completed': 'הושלם',
    'status.pending': 'ממתין',
    'status.cancelled': 'בוטל',
    
    // Priority
    'priority.low': 'נמוך',
    'priority.medium': 'בינוני',
    'priority.high': 'גבוה',
    'priority.urgent': 'דחוף',
    
    // Time
    'time.today': 'היום',
    'time.yesterday': 'אתמול',
    'time.this-week': 'השבוע',
    'time.this-month': 'החודש',
    
    // Errors
    'error.generic': 'אירעה שגיאה לא צפויה',
    'error.network': 'שגיאת רשת',
    'error.unauthorized': 'אין הרשאה',
    'error.not-found': 'לא נמצא',
    'error.validation': 'שגיאת אימות',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.tickets': 'Tickets',
    'nav.buildings': 'Buildings',
    'nav.payments': 'Payments',
    'nav.tech-jobs': 'Tech Jobs',
    'nav.admin': 'Admin',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.print': 'Print',
    'common.refresh': 'Refresh',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.close': 'Close',
    'common.open': 'Open',
    
    // Status
    'status.open': 'Open',
    'status.closed': 'Closed',
    'status.in-progress': 'In Progress',
    'status.completed': 'Completed',
    'status.pending': 'Pending',
    'status.cancelled': 'Cancelled',
    
    // Priority
    'priority.low': 'Low',
    'priority.medium': 'Medium',
    'priority.high': 'High',
    'priority.urgent': 'Urgent',
    
    // Time
    'time.today': 'Today',
    'time.yesterday': 'Yesterday',
    'time.this-week': 'This Week',
    'time.this-month': 'This Month',
    
    // Errors
    'error.generic': 'An unexpected error occurred',
    'error.network': 'Network error',
    'error.unauthorized': 'Unauthorized',
    'error.not-found': 'Not found',
    'error.validation': 'Validation error',
  },
};

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
    const storedLocale = localStorage.getItem(storageKey) as Locale;
    if (storedLocale) {
      setLocale(storedLocale);
    }
  }, [storageKey]);

  const t = (key: string, params?: Record<string, string>): string => {
    let translation = translations[locale][key] || key;
    
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(`{{${paramKey}}}`, paramValue);
      });
    }
    
    return translation;
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
  return (
    <ThemeProvider defaultTheme="light" storageKey="amit-theme">
      <DirectionProvider defaultDirection="rtl" storageKey="amit-direction">
        <LocaleProvider defaultLocale="he" storageKey="amit-locale">
          {children}
          <Toaster />
        </LocaleProvider>
      </DirectionProvider>
    </ThemeProvider>
  );
}
