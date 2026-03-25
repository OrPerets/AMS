import { formatCurrency } from '../../lib/utils';
import type { ResidentPaymentTrustItem } from './resident-payment-trust-strip';

type ResidentTrendInput = {
  currentBalance: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  openTickets: number;
  unreadNotifications: number;
  latestLedgerAmount?: number | null;
  locale?: string;
};

type ResidentPaymentTrustInput = {
  primaryMethodLabel: string;
  autopayEnabled: boolean;
  hasOpenBalance: boolean;
};

export function buildResidentTrendState({
  currentBalance,
  unpaidInvoices,
  overdueInvoices,
  openTickets,
  unreadNotifications,
  latestLedgerAmount,
  locale,
}: ResidentTrendInput) {
  const latestAmount = Math.max(0, Math.round(latestLedgerAmount ?? currentBalance));
  const activityWeight = Math.max(1, openTickets + unreadNotifications + unpaidInvoices);
  const overdueWeight = overdueInvoices > 0 ? currentBalance || latestAmount || 1 : Math.max(0, Math.round(currentBalance * 0.38));
  const pulsePoints = [
    { label: 'חשבון', value: Math.max(0, Math.round(currentBalance || latestAmount || 1)), note: 'יתרה כרגע' },
    { label: 'חיובים', value: Math.max(0, Math.round(unpaidInvoices ? currentBalance || latestAmount || 1 : latestAmount * 0.62)), note: `${unpaidInvoices} פתוחים` },
    { label: 'פיגור', value: overdueWeight, note: overdueInvoices ? 'דורש טיפול' : 'ללא חריגה', emphasis: overdueInvoices > 0 },
    { label: 'קריאות', value: Math.max(40, openTickets * 180), note: `${openTickets} פתוחות` },
    { label: 'עדכונים', value: Math.max(30, unreadNotifications * 110), note: `${unreadNotifications} חדשים` },
    { label: 'אחרון', value: Math.max(0, latestAmount || Math.round(currentBalance * 0.92)), note: 'החיוב האחרון', emphasis: overdueInvoices === 0 },
  ];

  const insight =
    overdueInvoices > 0
      ? 'המסך מרוכז כרגע סביב החיוב שבפיגור. תשלום עכשיו יוריד את הלחץ ויחזיר את החשבון למסלול שקט יותר.'
      : openTickets > 0
        ? 'החשבון עצמו בשליטה יחסית, אבל יש פעילות שירות פתוחה. כדאי לשמור את התשלום והבקשות באותו מבט.'
        : unreadNotifications > 0
          ? 'אין משהו דחוף בחיובים, אבל יש עדכונים חדשים. המסך משאיר גם כסף וגם תקשורת באותו קו ראייה.'
          : 'המצב שקט. מרכז התשלומים נשאר מוכן לפעולה הבאה בלי להעמיס על שכבת הפתיחה.';

  return {
    title: 'דופק החשבון',
    subtitle: 'חיובים, שירות ועדכונים באותה תצוגה, בלי לקפוץ בין מסכים.',
    metricLabel: 'יתרה נוכחית',
    metricValue: formatCurrency(currentBalance, 'ILS', locale),
    tone: overdueInvoices > 0 ? 'warning' as const : activityWeight > 2 ? 'default' as const : 'success' as const,
    points: pulsePoints,
    insight,
    summaryItems: [
      { label: 'חיובים', value: unpaidInvoices },
      { label: 'קריאות', value: openTickets },
      { label: 'עדכונים', value: unreadNotifications },
    ],
  };
}

export function buildResidentPaymentTrustState({
  primaryMethodLabel,
  autopayEnabled,
  hasOpenBalance,
}: ResidentPaymentTrustInput): ResidentPaymentTrustItem[] {
  return [
    {
      id: 'primary-method',
      label: 'כרטיס פעיל',
      value: primaryMethodLabel,
      tone: primaryMethodLabel === 'הוסף כרטיס' ? 'warning' : 'default',
    },
    {
      id: 'autopay',
      label: 'חיוב אוטומטי',
      value: autopayEnabled ? 'פעיל' : 'ידני',
      tone: autopayEnabled ? 'success' : 'warning',
    },
    {
      id: 'secure-lane',
      label: 'מסלול התשלום',
      value: hasOpenBalance ? 'מוכן לסליקה' : 'מעקב וחשבוניות',
      tone: hasOpenBalance ? 'success' : 'default',
    },
  ];
}
