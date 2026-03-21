// /Users/orperetz/Documents/AMS/apps/frontend/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { getIntlLocale, getStoredLocale, normalizeLocale } from "./i18n";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function resolveLocale(locale?: string): string {
  if (locale) {
    return getIntlLocale(locale);
  }

  return getIntlLocale(getStoredLocale());
}

export function formatDate(date: Date | string, locale?: string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

export function formatDateTime(date: Date | string, locale?: string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

export function formatCurrency(amount: number, currency: string = 'ILS', locale?: string): string {
  return new Intl.NumberFormat(resolveLocale(locale), {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNumber(number: number, locale?: string): string {
  return new Intl.NumberFormat(resolveLocale(locale)).format(number);
}

export function getDirectionFromLocale(locale: string): 'rtl' | 'ltr' {
  return normalizeLocale(locale) === 'en' ? 'ltr' : 'rtl';
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
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
    'ASSIGNED': 'status-assigned',
    'IN_PROGRESS': 'status-in-progress',
    'RESOLVED': 'status-resolved',
    'HIGH': 'status-high-priority',
  };
  
  return statusMap[status?.toUpperCase()] || 'bg-muted text-muted-foreground';
}

export function getStatusLabel(status: string, locale: string = 'he'): string {
  const hebrewLabels: Record<string, string> = {
    'OPEN': 'פתוח',
    'ASSIGNED': 'הוקצה',
    'IN_PROGRESS': 'בתהליך',
    'RESOLVED': 'נפתרה',
    'PENDING': 'ממתין',
    'CANCELLED': 'בוטל',
    'HIGH': 'גבוה',
    'MEDIUM': 'בינוני',
    'LOW': 'נמוך',
  };

  const englishLabels: Record<string, string> = {
    'OPEN': 'Open',
    'ASSIGNED': 'Assigned',
    'IN_PROGRESS': 'In Progress',
    'RESOLVED': 'Resolved',
    'PENDING': 'Pending',
    'CANCELLED': 'Cancelled',
    'HIGH': 'High',
    'MEDIUM': 'Medium',
    'LOW': 'Low',
  };

  const labels = locale === 'he' ? hebrewLabels : englishLabels;
  return labels[status?.toUpperCase()] || status;
}

export function humanizeEnum(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getUserRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    ADMIN: 'מנהל מערכת',
    PM: 'מנהל נכס',
    TECH: 'טכנאי שטח',
    RESIDENT: 'דייר',
    ACCOUNTANT: 'חשבונות',
    MASTER: 'גישה ראשית',
  };

  return labels[role?.toUpperCase()] || humanizeEnum(role);
}

export function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    LOW: 'נמוכה',
    MEDIUM: 'בינונית',
    HIGH: 'גבוהה',
    URGENT: 'דחופה',
    CRITICAL: 'קריטית',
  };

  return labels[priority?.toUpperCase()] || humanizeEnum(priority);
}

export function getNotificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    SYSTEM: 'מערכת',
    PAYMENT: 'תשלום',
    MAINTENANCE: 'תחזוקה',
    TICKET: 'קריאה',
    ANNOUNCEMENT: 'הודעה',
    REMINDER: 'תזכורת',
    EMERGENCY: 'חירום',
  };

  return labels[type?.toUpperCase()] || humanizeEnum(type);
}

export function getDataQualitySummaryLabel(key: string): string {
  const labels: Record<string, string> = {
    residentPhones: 'טלפונים כפולים לדיירים',
    supplierContacts: 'אנשי קשר כפולים לספקים',
    unitNumbers: 'מספרי יחידות כפולים',
    buildingsMissingFields: 'בניינים עם חוסרים',
    unitsMissingFields: 'יחידות עם חוסרים',
    suppliersMissingFields: 'ספקים עם חוסרים',
    contractsMissingFields: 'חוזים עם חוסרים',
    inactiveBuildings: 'בניינים לא פעילים',
    inactiveUnits: 'יחידות לא פעילות',
    buildingsWithoutUnits: 'בניינים ללא יחידות',
    unitsWithoutResidents: 'יחידות ללא דיירים',
    invalidDocumentLinks: 'קישורי מסמכים לא תקינים',
  };

  return labels[key] || humanizeEnum(key);
}

export function getDashboardWidgetGroupLabel(group: string): string {
  const labels: Record<string, string> = {
    overview: 'סקירה',
    operations: 'תפעול',
    risk: 'סיכונים',
    system: 'מערכת',
  };

  return labels[group] || humanizeEnum(group);
}

export function getAuditActionLabel(action: string): string {
  const labels: Record<string, string> = {
    IMPERSONATION_STARTED: 'התחזות החלה',
    IMPERSONATION_ENDED: 'התחזות הסתיימה',
    LOGIN: 'כניסה למערכת',
    LOGOUT: 'יציאה מהמערכת',
    PASSWORD_RESET: 'איפוס סיסמה',
    USER_UPDATED: 'פרטי משתמש עודכנו',
  };

  return labels[action?.toUpperCase()] || humanizeEnum(action);
}

export function getTicketStatusTone(status: string): 'neutral' | 'active' | 'success' | 'warning' | 'danger' {
  switch (status?.toUpperCase()) {
    case 'RESOLVED':
    case 'COMPLETED':
    case 'PAID':
      return 'success';
    case 'IN_PROGRESS':
    case 'ASSIGNED':
      return 'active';
    case 'OVERDUE':
    case 'FAILED':
    case 'CANCELED':
      return 'danger';
    case 'OPEN':
    case 'UNPAID':
    case 'PENDING':
    default:
      return 'warning';
  }
}

export function getResidentRequestStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    SUBMITTED: 'התקבלה',
    IN_REVIEW: 'בטיפול',
    COMPLETED: 'הושלמה',
    CLOSED: 'נסגרה',
  };
  return labels[status?.toUpperCase()] || getStatusLabel(status, 'he') || humanizeEnum(status);
}

export function getResidentRequestStatusTone(status: string): 'neutral' | 'active' | 'success' | 'warning' | 'danger' {
  switch (status?.toUpperCase()) {
    case 'COMPLETED':
      return 'success';
    case 'CLOSED':
      return 'neutral';
    case 'IN_REVIEW':
      return 'active';
    case 'SUBMITTED':
    default:
      return 'warning';
  }
}

export function getRequestTypeLabel(requestType: string): string {
  const labels: Record<string, string> = {
    MOVING: 'הודעת מעבר',
    PARKING: 'בקשת חניה',
    DOCUMENT: 'בקשת מסמך',
    CONTACT_UPDATE: 'עדכון פרטי קשר',
    GENERAL: 'בקשה כללית',
  };
  return labels[requestType?.toUpperCase()] || humanizeEnum(requestType);
}

export function getVoteTypeLabel(voteType: string): string {
  const labels: Record<string, string> = {
    YES_NO: 'כן / לא',
    MULTIPLE_CHOICE: 'בחירה מרובה',
    RATING: 'דירוג',
  };
  return labels[voteType?.toUpperCase()] || humanizeEnum(voteType);
}

export function getMaintenanceCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    GENERAL: 'כללי',
    ELECTRICAL: 'חשמל',
    PLUMBING: 'אינסטלציה',
    HVAC: 'מיזוג ואוורור',
    SAFETY: 'בטיחות',
  };
  return labels[category?.toUpperCase()] || humanizeEnum(category);
}

export function getMaintenanceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    PREVENTIVE: 'מונעת',
    CORRECTIVE: 'מתקנת',
    INSPECTION: 'בדיקה',
  };
  return labels[type?.toUpperCase()] || humanizeEnum(type);
}

export function getMaintenanceFrequencyLabel(frequency: string): string {
  const labels: Record<string, string> = {
    DAILY: 'יומי',
    WEEKLY: 'שבועי',
    MONTHLY: 'חודשי',
    QUARTERLY: 'רבעוני',
    ANNUAL: 'שנתי',
  };
  return labels[frequency?.toUpperCase()] || humanizeEnum(frequency);
}

export function getPriorityTone(priority: string): 'neutral' | 'active' | 'success' | 'warning' | 'danger' {
  switch (priority?.toUpperCase()) {
    case 'CRITICAL':
    case 'URGENT':
    case 'HIGH':
      return 'danger';
    case 'MEDIUM':
      return 'warning';
    case 'LOW':
      return 'success';
    default:
      return 'neutral';
  }
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
