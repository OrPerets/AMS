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
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
            className={`group overflow-hidden rounded-[26px] border-t-[3px] border-subtle-border ${card.accent} shadow-[0_20px_50px_-36px_rgba(15,23,42,0.25)] transition-shadow hover:shadow-[0_25px_60px_-32px_rgba(15,23,42,0.35)]`}
          >
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-5 py-5">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="mt-2 text-3xl font-black text-foreground">{value}</p>
                </div>
                <div className={`rounded-2xl ${card.iconBg} p-3 transition-transform group-hover:scale-105`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="border-t border-subtle-border bg-muted/35 px-5 py-3 text-sm text-muted-foreground">
                {kpiDescriptions[card.key]}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
