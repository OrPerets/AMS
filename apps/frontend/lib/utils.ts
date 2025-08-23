// /Users/orperetz/Documents/AMS/apps/frontend/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, locale: string = 'he-IL'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

export function formatCurrency(amount: number, currency: string = 'ILS', locale: string = 'he-IL'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNumber(number: number, locale: string = 'he-IL'): string {
  return new Intl.NumberFormat(locale).format(number);
}

export function getDirectionFromLocale(locale: string): 'rtl' | 'ltr' {
  const rtlLocales = ['he', 'ar', 'fa', 'ur'];
  const langCode = locale.split('-')[0];
  return rtlLocales.includes(langCode) ? 'rtl' : 'ltr';
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Status helpers
export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    'OPEN': 'status-open',
    'IN_PROGRESS': 'status-in-progress', 
    'COMPLETED': 'status-completed',
    'CLOSED': 'status-closed',
    'HIGH': 'status-high-priority',
    'URGENT': 'status-high-priority',
  };
  
  return statusMap[status?.toUpperCase()] || 'bg-muted text-muted-foreground';
}

export function getStatusLabel(status: string, locale: string = 'he'): string {
  const hebrewLabels: Record<string, string> = {
    'OPEN': 'פתוח',
    'IN_PROGRESS': 'בתהליך',
    'COMPLETED': 'הושלם',
    'CLOSED': 'סגור',
    'PENDING': 'ממתין',
    'CANCELLED': 'בוטל',
    'HIGH': 'גבוה',
    'MEDIUM': 'בינוני', 
    'LOW': 'נמוך',
    'URGENT': 'דחוף',
  };

  const englishLabels: Record<string, string> = {
    'OPEN': 'Open',
    'IN_PROGRESS': 'In Progress',
    'COMPLETED': 'Completed',
    'CLOSED': 'Closed',
    'PENDING': 'Pending',
    'CANCELLED': 'Cancelled',
    'HIGH': 'High',
    'MEDIUM': 'Medium',
    'LOW': 'Low', 
    'URGENT': 'Urgent',
  };

  const labels = locale === 'he' ? hebrewLabels : englishLabels;
  return labels[status?.toUpperCase()] || status;
}

// File helpers
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

export function isImageFile(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
  const extension = getFileExtension(filename).toLowerCase();
  return imageExtensions.includes(extension);
}

// Error handling
export function getErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error) return error.error;
  return 'אירעה שגיאה לא צפויה';
}

// URL helpers  
export function createQueryString(params: Record<string, string | number | boolean | null | undefined>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  
  return searchParams.toString();
}

export function parseQueryString(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
}
