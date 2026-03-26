import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bell,
  Box,
  Building,
  CalendarClock,
  ClipboardList,
  CreditCard,
  FileText,
  Folder,
  Home,
  Leaf,
  MessageCircle,
  Settings,
  ShieldCheck,
  Ticket,
  Wallet,
  Wrench,
} from 'lucide-react';

export type AppRole = 'ADMIN' | 'PM' | 'TECH' | 'RESIDENT' | 'ACCOUNTANT' | 'MASTER';

export type NavigationItem = {
  id: string;
  title: string;
  href: string;
  icon: LucideIcon;
  hint?: string;
};

export type NavigationGroup = {
  id: string;
  title: string;
  items: NavigationItem[];
};

export type NavigationModel = {
  sidebarGroups: NavigationGroup[];
  mobilePrimary: NavigationItem[];
  mobileMoreGroups: NavigationGroup[];
};

export const MOBILE_PRIMARY_TAB_COUNT = 4;
export const MOBILE_MORE_MAX_GROUPS = 3;
export const MOBILE_MORE_MAX_ITEMS = 12;
export const RECENT_SHORTCUT_MAX_ITEMS = 4;
export const RECENT_SHORTCUT_EXPIRY_MS = 1000 * 60 * 60 * 24 * 7;

type Translator = (key: string, values?: Record<string, string | number>) => string;

const supervisionItem: NavigationItem = {
  id: 'supervision',
  title: 'דוח פיקוח',
  hint: 'בדיקות שטח',
  href: '/supervision-report',
  icon: ShieldCheck,
};

function normalizeRoleValue(role?: string | null): AppRole | null {
  if (!role) return null;

  switch (role.trim().toUpperCase()) {
    case 'ADMIN':
    case 'ADMINISTRATOR':
    case 'SYSTEM_ADMIN':
      return 'ADMIN';
    case 'PM':
    case 'MANAGER':
    case 'PROPERTY_MANAGER':
      return 'PM';
    case 'TECH':
    case 'TECHNICIAN':
    case 'WORKER':
      return 'TECH';
    case 'RESIDENT':
    case 'TENANT':
      return 'RESIDENT';
    case 'ACCOUNTANT':
    case 'ACCOUNTING':
      return 'ACCOUNTANT';
    case 'MASTER':
    case 'SUPER_ADMIN':
      return 'MASTER';
    default:
      return null;
  }
}

function dedupeItems(items: NavigationItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
}

function dedupeGroups(groups: NavigationGroup[]) {
  const groupMap = new Map<string, NavigationGroup>();

  for (const group of groups) {
    const existing = groupMap.get(group.id);
    if (!existing) {
      groupMap.set(group.id, { ...group, items: dedupeItems(group.items) });
      continue;
    }

    existing.items = dedupeItems([...existing.items, ...group.items]);
  }

  return Array.from(groupMap.values()).filter((group) => group.items.length > 0);
}

function adminModel(t: Translator): NavigationModel {
  return {
    sidebarGroups: [
      {
        id: 'dashboard',
        title: t('nav.group.dashboard'),
        items: [
          { id: 'home', title: t('nav.homeOverview'), href: '/home', icon: Home },
          { id: 'dashboard', title: t('nav.dashboard'), href: '/admin/dashboard', icon: BarChart3 },
        ],
      },
      {
        id: 'operations',
        title: t('nav.group.operations'),
        items: [
          { id: 'tickets', title: t('nav.tickets'), href: '/tickets', icon: Ticket },
          { id: 'maintenance', title: t('nav.maintenance'), href: '/maintenance', icon: CalendarClock },
          { id: 'communications', title: t('nav.communications'), href: '/communications', icon: MessageCircle },
          { id: 'announcements', title: t('nav.announcements'), href: '/communications/announcements', icon: Bell },
          { id: 'votes', title: t('nav.votes'), href: '/votes', icon: ClipboardList },
          { id: 'schedules', title: t('nav.schedules'), href: '/schedules', icon: ClipboardList },
          { id: 'gardens', title: 'ניהול גננים', href: '/gardens', icon: Leaf },
          supervisionItem,
        ],
      },
      {
        id: 'properties',
        title: t('nav.group.properties'),
        items: [
          { id: 'buildings', title: t('nav.buildings'), href: '/buildings', icon: Building },
          { id: 'assets', title: t('nav.assets'), href: '/assets', icon: Box },
          { id: 'documents', title: t('nav.documents'), href: '/documents', icon: Folder },
          { id: 'vendors', title: t('nav.vendors'), href: '/vendors', icon: MessageCircle },
          { id: 'contracts', title: t('nav.contracts'), href: '/contracts', icon: FileText },
        ],
      },
      {
        id: 'finance',
        title: t('nav.group.finance'),
        items: [
          { id: 'payments', title: t('nav.payments'), href: '/payments', icon: CreditCard },
          { id: 'budgets', title: t('nav.budgets'), href: '/finance/budgets', icon: Wallet },
          { id: 'reports', title: t('nav.financeReports'), href: '/finance/reports', icon: BarChart3 },
          { id: 'unpaid', title: t('nav.unpaidInvoices'), href: '/admin/unpaid-invoices', icon: FileText },
          { id: 'operations-calendar', title: t('nav.operationsCalendar'), href: '/operations/calendar', icon: CalendarClock },
        ],
      },
      {
        id: 'admin',
        title: t('nav.group.admin'),
        items: [
          { id: 'configuration', title: t('nav.configuration'), href: '/admin/configuration', icon: Settings },
          { id: 'admin-notifications', title: t('nav.notifications'), href: '/admin/notifications', icon: Bell },
          { id: 'activity', title: t('nav.activity'), href: '/admin/activity', icon: ShieldCheck },
          { id: 'approvals', title: t('nav.approvals'), href: '/admin/approvals', icon: ShieldCheck },
          { id: 'data-quality', title: t('nav.dataQuality'), href: '/admin/data-quality', icon: ShieldCheck },
          { id: 'security', title: t('nav.security'), href: '/admin/security', icon: ShieldCheck },
        ],
      },
    ],
    mobilePrimary: [
      { id: 'home', title: 'בית', hint: 'עבודה', href: '/home', icon: Home },
      { id: 'tickets', title: 'קריאות', hint: 'מוקד', href: '/tickets', icon: Ticket },
      { id: 'dashboard', title: 'בקרה', hint: 'KPI', href: '/admin/dashboard', icon: BarChart3 },
      { id: 'operations', title: 'פעולות', hint: 'יומן', href: '/operations/calendar', icon: CalendarClock },
    ],
    mobileMoreGroups: [
      {
        id: 'properties',
        title: 'ניהול נכסים',
        items: [
          { id: 'buildings', title: 'בניינים', hint: 'פורטפוליו', href: '/buildings', icon: Building },
          { id: 'assets', title: 'נכסים', hint: 'ציוד ומלאי', href: '/assets', icon: Box },
          { id: 'vendors', title: 'ספקים', hint: 'אנשי קשר', href: '/vendors', icon: MessageCircle },
          { id: 'contracts', title: 'חוזים', hint: 'הסכמים', href: '/contracts', icon: FileText },
        ],
      },
      {
        id: 'finance',
        title: 'כספים',
        items: [
          { id: 'payments', title: 'תשלומים', hint: 'גבייה', href: '/payments', icon: CreditCard },
          { id: 'budgets', title: 'תקציבים', hint: 'בקרה', href: '/finance/budgets', icon: Wallet },
          { id: 'reports', title: 'דוחות', hint: 'ניתוח', href: '/finance/reports', icon: BarChart3 },
        ],
      },
      {
        id: 'tools',
        title: 'מערכת',
        items: [
          { id: 'configuration', title: 'הגדרות', hint: 'תצורה', href: '/admin/configuration', icon: Settings },
          { id: 'security', title: 'אבטחה', hint: 'סיכונים', href: '/admin/security', icon: Bell },
          { id: 'approvals', title: 'אישורים', hint: 'ממתינים', href: '/admin/approvals', icon: ClipboardList },
          { id: 'documents', title: 'מסמכים', hint: 'מאגר', href: '/documents', icon: Folder },
          { id: 'notifications', title: 'התראות', hint: 'מרכז עדכונים', href: '/notifications', icon: Bell },
          supervisionItem,
        ],
      },
    ],
  };
}

function pmModel(t: Translator): NavigationModel {
  const model = adminModel(t);
  return {
    sidebarGroups: dedupeGroups([
      {
        id: 'dashboard',
        title: t('nav.group.dashboard'),
        items: [
          { id: 'home', title: t('nav.homeOverview'), href: '/home', icon: Home },
          { id: 'dashboard', title: t('nav.dashboard'), href: '/admin/dashboard', icon: BarChart3 },
          { id: 'maya', title: t('nav.mayaDashboard'), href: '/maya-dashboard', icon: Ticket },
        ],
      },
      {
        id: 'operations',
        title: t('nav.group.operations'),
        items: [
          { id: 'tickets', title: t('nav.tickets'), href: '/tickets', icon: Ticket },
          { id: 'maintenance', title: t('nav.maintenance'), href: '/maintenance', icon: CalendarClock },
          { id: 'communications', title: t('nav.communications'), href: '/communications', icon: MessageCircle },
          { id: 'announcements', title: t('nav.announcements'), href: '/communications/announcements', icon: Bell },
          { id: 'votes', title: t('nav.votes'), href: '/votes', icon: ClipboardList },
          { id: 'schedules', title: t('nav.schedules'), href: '/schedules', icon: ClipboardList },
          { id: 'gardens', title: 'ניהול גננים', href: '/gardens', icon: Leaf },
          supervisionItem,
        ],
      },
      {
        id: 'properties',
        title: t('nav.group.properties'),
        items: [
          { id: 'buildings', title: t('nav.buildings'), href: '/buildings', icon: Building },
          { id: 'assets', title: t('nav.assets'), href: '/assets', icon: Box },
          { id: 'documents', title: t('nav.documents'), href: '/documents', icon: Folder },
          { id: 'vendors', title: t('nav.vendors'), href: '/vendors', icon: MessageCircle },
          { id: 'contracts', title: t('nav.contracts'), href: '/contracts', icon: FileText },
        ],
      },
      {
        id: 'finance',
        title: t('nav.group.finance'),
        items: [
          { id: 'payments', title: t('nav.payments'), href: '/payments', icon: CreditCard },
          { id: 'budgets', title: t('nav.budgets'), href: '/finance/budgets', icon: Wallet },
          { id: 'reports', title: t('nav.financeReports'), href: '/finance/reports', icon: BarChart3 },
          { id: 'operations-calendar', title: t('nav.operationsCalendar'), href: '/operations/calendar', icon: CalendarClock },
        ],
      },
      {
        id: 'admin',
        title: t('nav.group.admin'),
        items: [
          { id: 'configuration', title: t('nav.configuration'), href: '/admin/configuration', icon: Settings },
          { id: 'admin-notifications', title: t('nav.notifications'), href: '/admin/notifications', icon: Bell },
          { id: 'activity', title: t('nav.activity'), href: '/admin/activity', icon: ShieldCheck },
          { id: 'approvals', title: t('nav.approvals'), href: '/admin/approvals', icon: ShieldCheck },
          { id: 'data-quality', title: t('nav.dataQuality'), href: '/admin/data-quality', icon: ShieldCheck },
        ],
      },
    ]),
    mobilePrimary: [
      { id: 'home', title: 'בית', hint: 'עבודה', href: '/home', icon: Home },
      { id: 'tickets', title: 'קריאות', hint: 'שיוך', href: '/tickets', icon: Ticket },
      { id: 'buildings', title: 'בניינים', hint: 'נכסים', href: '/buildings', icon: Building },
      { id: 'operations', title: 'לו"ז', hint: 'תפעול', href: '/operations/calendar', icon: CalendarClock },
    ],
    mobileMoreGroups: [
      {
        id: 'operations',
        title: 'תפעול',
        items: [
          { id: 'maintenance', title: 'תחזוקה', hint: 'ביצוע', href: '/maintenance', icon: CalendarClock },
          { id: 'communications', title: 'תקשורת', hint: 'ספקים ודיירים', href: '/communications', icon: MessageCircle },
          { id: 'gardens', title: 'גינון', hint: 'חודשי', href: '/gardens', icon: Leaf },
          { id: 'supervision', title: 'דוח פיקוח', hint: 'בקרה שבועית', href: '/supervision-report', icon: ShieldCheck },
          { id: 'schedules', title: 'סידורים', hint: 'יומנים', href: '/schedules', icon: ClipboardList },
        ],
      },
      {
        id: 'finance',
        title: 'כספים',
        items: [
          { id: 'payments', title: 'תשלומים', hint: 'גבייה', href: '/payments', icon: CreditCard },
          { id: 'budgets', title: 'תקציבים', hint: 'חריגות', href: '/finance/budgets', icon: Wallet },
          { id: 'reports', title: 'דוחות', hint: 'סיכומים', href: '/finance/reports', icon: BarChart3 },
        ],
      },
      {
        id: 'tools',
        title: 'כלים',
        items: [
          { id: 'documents', title: 'מסמכים', hint: 'גישה מהירה', href: '/documents', icon: Folder },
          { id: 'vendors', title: 'ספקים', hint: 'קשרים', href: '/vendors', icon: MessageCircle },
          { id: 'contracts', title: 'חוזים', hint: 'מסמכי ספק', href: '/contracts', icon: FileText },
          { id: 'notifications', title: 'התראות', hint: 'עדכונים', href: '/notifications', icon: Bell },
          { id: 'settings', title: 'הגדרות', hint: 'העדפות', href: '/settings', icon: Settings },
        ],
      },
    ],
  };
}

function techModel(t: Translator): NavigationModel {
  return {
    sidebarGroups: [
      {
        id: 'dashboard',
        title: t('nav.group.dashboard'),
        items: [
          { id: 'home', title: 'מרכז ניהול', href: '/home', icon: Home },
          { id: 'tech-jobs', title: t('nav.techJobs'), href: '/tech/jobs', icon: Wrench },
        ],
      },
      {
        id: 'operations',
        title: t('nav.group.operations'),
        items: [
          { id: 'tickets', title: t('nav.tickets'), href: '/tickets', icon: Ticket },
          { id: 'maintenance', title: t('nav.maintenance'), href: '/maintenance', icon: CalendarClock },
          { id: 'communications', title: t('nav.communications'), href: '/communications', icon: MessageCircle },
          { id: 'schedules', title: t('nav.schedules'), href: '/schedules', icon: ClipboardList },
          { id: 'gardens', title: 'ניהול גננים', href: '/gardens', icon: Leaf },
          { id: 'supervision', title: 'דוח פיקוח', href: '/supervision-report', icon: ShieldCheck },
        ],
      },
      {
        id: 'properties',
        title: t('nav.group.properties'),
        items: [
          { id: 'assets', title: t('nav.assets'), href: '/assets', icon: Box },
          { id: 'documents', title: t('nav.documents'), href: '/documents', icon: Folder },
        ],
      },
      {
        id: 'tools',
        title: 'כלים',
        items: [
          { id: 'notifications', title: t('nav.notifications'), href: '/notifications', icon: Bell },
          { id: 'settings', title: t('shell.settings'), href: '/settings', icon: Settings },
        ],
      },
    ],
    mobilePrimary: [
      { id: 'home', title: 'בית', hint: 'מרכז ניהול', href: '/home', icon: Home },
      { id: 'tech-jobs', title: 'עבודות', hint: 'תור', href: '/tech/jobs', icon: Wrench },
      { id: 'gardens', title: 'גינון', hint: 'חודש', href: '/gardens', icon: Leaf },
      { id: 'status', title: 'עדכון', hint: 'קריאות שלי', href: '/tickets?mine=true', icon: ClipboardList },
    ],
    mobileMoreGroups: [
      {
        id: 'field',
        title: 'שדה',
        items: [
          { id: 'supervision', title: 'פיקוח', hint: 'דוח חיצוני', href: '/supervision-report', icon: ShieldCheck },
          { id: 'maintenance', title: 'תחזוקה', hint: 'רשימות', href: '/maintenance', icon: CalendarClock },
          { id: 'schedules', title: 'יומנים', hint: 'ביצוע', href: '/schedules', icon: ClipboardList },
          { id: 'management', title: 'מרכז ניהול', hint: 'חזרה לבית', href: '/home', icon: Home },
        ],
      },
      {
        id: 'info',
        title: 'מידע',
        items: [
          { id: 'assets', title: 'נכסים', hint: 'ציוד', href: '/assets', icon: Box },
          { id: 'documents', title: 'מסמכים', hint: 'הנחיות', href: '/documents', icon: Folder },
          { id: 'communications', title: 'תקשורת', hint: 'עדכונים', href: '/communications', icon: MessageCircle },
        ],
      },
      {
        id: 'tools',
        title: 'כלים',
        items: [
          { id: 'notifications', title: 'התראות', hint: 'חדשות', href: '/notifications', icon: Bell },
          { id: 'settings', title: 'הגדרות', hint: 'אישי', href: '/settings', icon: Settings },
        ],
      },
    ],
  };
}

function residentModel(t: Translator): NavigationModel {
  return {
    sidebarGroups: [
      {
        id: 'quick-access',
        title: 'גישה מהירה',
        items: [
          { id: 'resident-home', title: 'בית הדייר', href: '/resident/account', icon: Home },
          { id: 'resident-requests', title: t('nav.residentRequests'), href: '/resident/requests', icon: ClipboardList },
          { id: 'resident-payments', title: 'תשלומים', href: '/payments/resident', icon: CreditCard },
          { id: 'resident-documents', title: t('nav.documents'), href: '/documents', icon: Folder },
        ],
      },
      {
        id: 'support',
        title: 'שירות ותמיכה',
        items: [
          { id: 'new-ticket', title: t('nav.newTicket'), href: '/create-call', icon: Ticket },
          { id: 'notifications', title: t('nav.notifications'), href: '/notifications', icon: Bell },
          { id: 'building', title: 'הבניין שלי', href: '/resident/building', icon: Building },
          { id: 'support-contact', title: 'צור קשר', href: '/support', icon: MessageCircle },
          { id: 'settings', title: t('shell.settings'), href: '/settings', icon: Settings },
        ],
      },
    ],
    mobilePrimary: [
      { id: 'resident-home', title: 'בית', hint: 'חשבון', href: '/resident/account', icon: Home },
      { id: 'resident-requests', title: 'בקשות', hint: 'מעקב', href: '/resident/requests', icon: ClipboardList },
      { id: 'resident-payments', title: 'תשלומים', hint: 'חיובים', href: '/payments/resident', icon: CreditCard },
      { id: 'new-ticket', title: 'קריאה', hint: 'פתיחה', href: '/create-call', icon: Ticket },
    ],
    mobileMoreGroups: [
      {
        id: 'account',
        title: 'חשבון',
        items: [
          { id: 'resident-documents', title: 'מסמכים', hint: 'ועד וקבצים', href: '/documents', icon: Folder },
          { id: 'building', title: 'הבניין שלי', hint: 'מידע ואנשי קשר', href: '/resident/building', icon: Building },
          { id: 'methods', title: 'שיטות תשלום', hint: 'כרטיסים', href: '/resident/payment-methods', icon: CreditCard },
        ],
      },
      {
        id: 'support',
        title: 'תמיכה',
        items: [
          { id: 'support-contact', title: 'צור קשר', hint: 'ניהול ותמיכה', href: '/support', icon: MessageCircle },
          { id: 'notifications', title: 'התראות', hint: 'הודעות חדשות', href: '/notifications', icon: Bell },
        ],
      },
      {
        id: 'settings',
        title: 'הגדרות',
        items: [{ id: 'settings', title: 'הגדרות', hint: 'העדפות', href: '/settings', icon: Settings }],
      },
    ],
  };
}

function accountantModel(): NavigationModel {
  return {
    sidebarGroups: [
      {
        id: 'dashboard',
        title: 'כספים',
        items: [
          { id: 'home', title: 'בית', href: '/home', icon: Home },
          { id: 'payments', title: 'תשלומים', href: '/payments', icon: CreditCard },
          { id: 'budgets', title: 'תקציבים', href: '/finance/budgets', icon: Wallet },
          { id: 'reports', title: 'דוחות פיננסיים', href: '/finance/reports', icon: BarChart3 },
        ],
      },
      {
        id: 'operations',
        title: 'תפעול',
        items: [
          { id: 'operations-calendar', title: 'יומן', href: '/operations/calendar', icon: CalendarClock },
          { id: 'tickets', title: 'קריאות', href: '/tickets', icon: Ticket },
          { id: 'vendors', title: 'ספקים', href: '/vendors', icon: MessageCircle },
          { id: 'contracts', title: 'חוזים', href: '/contracts', icon: FileText },
          supervisionItem,
        ],
      },
      {
        id: 'tools',
        title: 'כלים',
        items: [
          { id: 'documents', title: 'מסמכים', href: '/documents', icon: Folder },
          { id: 'notifications', title: 'התראות', href: '/notifications', icon: Bell },
          { id: 'settings', title: 'הגדרות', href: '/settings', icon: Settings },
        ],
      },
    ],
    mobilePrimary: [
      { id: 'home', title: 'בית', hint: 'סקירה', href: '/home', icon: Home },
      { id: 'payments', title: 'גבייה', hint: 'תשלומים', href: '/payments', icon: CreditCard },
      { id: 'budgets', title: 'תקציבים', hint: 'מעקב', href: '/finance/budgets', icon: Wallet },
      { id: 'reports', title: 'דוחות', hint: 'פיננסים', href: '/finance/reports', icon: BarChart3 },
    ],
    mobileMoreGroups: [
      {
        id: 'operations',
        title: 'תפעול',
        items: [
          { id: 'operations-calendar', title: 'יומן', hint: 'פירעונות', href: '/operations/calendar', icon: CalendarClock },
          { id: 'tickets', title: 'קריאות', hint: 'הקשר תפעולי', href: '/tickets', icon: Ticket },
          { id: 'vendors', title: 'ספקים', hint: 'תשלומים', href: '/vendors', icon: MessageCircle },
          { id: 'contracts', title: 'חוזים', hint: 'חידושים', href: '/contracts', icon: FileText },
        ],
      },
      {
        id: 'tools',
        title: 'כלים',
        items: [
          { id: 'documents', title: 'מסמכים', hint: 'מסמכי הנה"ח', href: '/documents', icon: Folder },
          supervisionItem,
          { id: 'notifications', title: 'התראות', hint: 'מרכז עדכונים', href: '/notifications', icon: Bell },
          { id: 'settings', title: 'הגדרות', hint: 'העדפות', href: '/settings', icon: Settings },
        ],
      },
    ],
  };
}

function combineModels(models: NavigationModel[]): NavigationModel {
  return {
    sidebarGroups: dedupeGroups(models.flatMap((model) => model.sidebarGroups)),
    mobilePrimary: dedupeItems(models.flatMap((model) => model.mobilePrimary)).slice(0, MOBILE_PRIMARY_TAB_COUNT),
    mobileMoreGroups: dedupeGroups(models.flatMap((model) => model.mobileMoreGroups)),
  };
}

function normalizeMobileNav(model: NavigationModel): NavigationModel {
  const primary = dedupeItems(model.mobilePrimary).slice(0, MOBILE_PRIMARY_TAB_COUNT);
  const primaryHrefs = new Set(primary.map((item) => item.href));
  const seen = new Set<string>();
  let remaining = MOBILE_MORE_MAX_ITEMS;
  const moreGroups: NavigationGroup[] = [];

  for (const group of model.mobileMoreGroups.slice(0, MOBILE_MORE_MAX_GROUPS)) {
    if (remaining <= 0) break;
    const items = group.items.filter((item) => {
      if (remaining <= 0) return false;
      if (primaryHrefs.has(item.href) || seen.has(item.href)) return false;
      seen.add(item.href);
      remaining -= 1;
      return true;
    });
    if (items.length) moreGroups.push({ ...group, items });
  }

  return {
    ...model,
    mobilePrimary: primary,
    mobileMoreGroups: moreGroups,
  };
}

type StoredRecentShortcut = {
  href: string;
  timestamp: number;
};

const recentShortcutStorageKey = 'amit-recent-shortcuts-v1';

function isBrowser() {
  return typeof window !== 'undefined';
}

function readRecentShortcuts(now = Date.now()): StoredRecentShortcut[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(recentShortcutStorageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredRecentShortcut[];
    return parsed
      .filter((entry) => entry?.href && typeof entry.timestamp === 'number' && now - entry.timestamp <= RECENT_SHORTCUT_EXPIRY_MS)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, RECENT_SHORTCUT_MAX_ITEMS);
  } catch {
    return [];
  }
}

function writeRecentShortcuts(shortcuts: StoredRecentShortcut[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(recentShortcutStorageKey, JSON.stringify(shortcuts.slice(0, RECENT_SHORTCUT_MAX_ITEMS)));
}

export function recordRecentShortcut(href: string, timestamp = Date.now()) {
  if (!href || !isBrowser()) return;
  const current = readRecentShortcuts(timestamp).filter((entry) => entry.href !== href);
  writeRecentShortcuts([{ href, timestamp }, ...current]);
}

export function getRecentShortcutHrefs(now = Date.now()) {
  return readRecentShortcuts(now).map((entry) => entry.href);
}

export function validateMobileLabelConsistency(model: NavigationModel): string[] {
  const issues: string[] = [];
  const titleByHref = new Map<string, string>();
  const allItems = [...model.mobilePrimary, ...model.mobileMoreGroups.flatMap((group) => group.items)];
  for (const item of allItems) {
    const existing = titleByHref.get(item.href);
    if (!existing) {
      titleByHref.set(item.href, item.title);
      continue;
    }
    if (existing !== item.title) {
      issues.push(`Inconsistent title for ${item.href}: "${existing}" vs "${item.title}"`);
    }
  }
  return issues;
}

export function isRoleAllowed(role: string | null | undefined, allowedRoles: AppRole[]) {
  const normalizedRole = normalizeRoleValue(role);
  if (!normalizedRole) return false;
  if (normalizedRole === 'MASTER') return true;
  return allowedRoles.includes(normalizedRole);
}

export function getNavigationModel(role: string | null | undefined, t: Translator): NavigationModel {
  const normalizedRole = normalizeRoleValue(role) || 'RESIDENT';

  switch (normalizedRole) {
    case 'ADMIN':
      return normalizeMobileNav(adminModel(t));
    case 'PM':
      return normalizeMobileNav(pmModel(t));
    case 'TECH':
      return normalizeMobileNav(techModel(t));
    case 'ACCOUNTANT':
      return normalizeMobileNav(accountantModel());
    case 'MASTER':
      return normalizeMobileNav(combineModels([adminModel(t), pmModel(t), techModel(t), residentModel(t), accountantModel()]));
    case 'RESIDENT':
    default:
      return normalizeMobileNav(residentModel(t));
  }
}
