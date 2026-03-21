import { AlertTriangle, Building2, CreditCard, FileWarning, Siren, Ticket } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { DashboardResponse } from './types';

const kpiCards = [
  { key: 'openTickets', title: 'קריאות פתוחות', icon: Ticket, accent: 'border-t-strong-border', iconBg: 'bg-accent text-accent-foreground' },
  { key: 'urgentTickets', title: 'דחופות', icon: Siren, accent: 'border-t-rose-500', iconBg: 'bg-rose-600' },
  { key: 'slaBreaches', title: 'חריגות SLA', icon: AlertTriangle, accent: 'border-t-amber-500', iconBg: 'bg-amber-600' },
  { key: 'unpaidBalance', title: 'יתרת חוב', icon: CreditCard, accent: 'border-t-strong-border', iconBg: 'bg-accent text-accent-foreground' },
  { key: 'overdueInvoices', title: 'חשבוניות בפיגור', icon: FileWarning, accent: 'border-t-amber-500', iconBg: 'bg-amber-600' },
  { key: 'vacantUnits', title: 'יחידות פנויות', icon: Building2, accent: 'border-t-strong-border', iconBg: 'bg-accent text-accent-foreground' },
] as const;

const kpiDescriptions: Record<string, string> = {
  urgentTickets: 'אירועים שדורשים תגובה מיידית או הסלמה.',
  slaBreaches: 'קריאות שעברו את חלון הטיפול שהוגדר.',
  openTickets: 'עומס הקריאות הנוכחי בכל הפורטפוליו.',
  unpaidBalance: 'סך החובות הפתוחים שעדיין לא נגבו.',
  overdueInvoices: 'חשבוניות שכבר עברו את מועד היעד.',
  vacantUnits: 'יחידות ללא דייר פעיל כרגע.',
};

export function KpiGrid({ data }: { data: DashboardResponse }) {
  return (
    <section className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-3">
      {kpiCards.map((card) => {
        const value =
          card.key === 'unpaidBalance'
            ? new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(
                data.portfolioKpis[card.key],
              )
            : String(data.portfolioKpis[card.key]);
        const Icon = card.icon;
        return (
          <Card
            key={card.key}
            className={`group overflow-hidden rounded-xl sm:rounded-[22px] border-t-[3px] border-subtle-border ${card.accent} shadow-elevation-2 transition-shadow hover:shadow-elevation-3`}
          >
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-3 py-3 sm:px-5 sm:py-5">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{card.title}</p>
                  <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-black text-foreground">{value}</p>
                </div>
                <div className={`shrink-0 rounded-xl sm:rounded-2xl ${card.iconBg} p-2 sm:p-3 transition-transform group-hover:scale-105`}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
              <div className="hidden sm:block border-t border-subtle-border bg-muted/35 px-5 py-3 text-sm text-muted-foreground">
                {kpiDescriptions[card.key]}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
