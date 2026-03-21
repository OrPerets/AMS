import Link from 'next/link';
import { Bell, Wrench } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { getNotificationTypeLabel, getPriorityLabel } from '../../../lib/utils';
import { DashboardResponse } from './types';
import { LoadBadge, MetricPill } from './primitives';

export function OperationalGrid({
  data,
  formatDate,
}: {
  data: DashboardResponse;
  formatDate: (value: string | Date) => string;
}) {
  return (
    <section className="grid gap-4 sm:gap-6 xl:grid-cols-2">
      <Card className="rounded-xl sm:rounded-[24px] border-subtle-border">
        <CardHeader>
          <CardTitle>עומס קריאות לפי בניין</CardTitle>
          <CardDescription>מבט מבצעי חי על לחץ, דחיפות וחריגות SLA. המדד נשאר בזמן אמת גם כשחלון הזמן משתנה.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.ticketTrends.buildingLoad.map((item) => {
            const totalTickets = item.openTickets + item.inProgressTickets + item.urgentTickets;
            return (
              <div key={item.buildingId} className="rounded-2xl border border-subtle-border bg-muted/25 p-4 transition-colors hover:bg-muted/40">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">{item.buildingName}</p>
                    <p className="text-sm text-muted-foreground">{item.openTickets} קריאות פתוחות במצטבר</p>
                  </div>
                  <Badge variant={item.urgentTickets > 0 ? 'destructive' : 'secondary'}>{item.urgentTickets} דחופות</Badge>
                </div>

                {totalTickets > 0 ? (
                  <div className="mb-3">
                    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                      {item.urgentTickets > 0 ? <div className="bg-rose-500" style={{ width: `${(item.urgentTickets / totalTickets) * 100}%` }} /> : null}
                      {item.inProgressTickets > 0 ? <div className="bg-amber-400" style={{ width: `${(item.inProgressTickets / totalTickets) * 100}%` }} /> : null}
                      {item.openTickets > 0 ? <div className="bg-primary/65" style={{ width: `${(item.openTickets / totalTickets) * 100}%` }} /> : null}
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-3 md:grid-cols-3">
                  <MetricPill label="בטיפול" value={item.inProgressTickets} />
                  <MetricPill label="חריגות SLA" value={item.slaBreaches} warning={item.slaBreaches > 0} />
                  <MetricPill label="פתוחות" value={item.openTickets} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <Card className="rounded-xl sm:rounded-[24px] border-subtle-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                עומס טכנאים
              </CardTitle>
              <CardDescription>חלוקת העומס מבוססת על קריאות פתוחות, דחופות וחשופות ל-SLA.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.systemAdmin.techWorkload.map((tech) => (
                <div key={tech.techId} className="rounded-2xl border border-subtle-border bg-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{tech.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {tech.assignedOpenTickets} פתוחות · {tech.urgentOpenTickets} דחופות · {tech.slaBreaches} חורגות SLA
                      </p>
                    </div>
                    <LoadBadge tone={tech.loadBand}>
                      {tech.loadBand === 'critical' ? 'לחץ גבוה' : tech.loadBand === 'busy' ? 'עמוס' : 'מאוזן'}
                    </LoadBadge>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`${tech.loadBand === 'critical' ? 'bg-rose-500' : tech.loadBand === 'busy' ? 'bg-amber-500' : 'bg-emerald-500'} h-full rounded-full`}
                      style={{ width: `${Math.min(100, tech.assignedOpenTickets * 14 + tech.urgentOpenTickets * 12 + tech.slaBreaches * 10)}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-xl sm:rounded-[24px] border-subtle-border">
            <CardHeader>
              <CardTitle>צווארי בקבוק</CardTitle>
              <CardDescription>הנקודות שמאטות טיפול, אישור או גבייה כרגע.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.systemAdmin.bottlenecks.map((item) => (
                <Link key={item.id} href={item.href} className="block rounded-2xl border border-subtle-border bg-card p-4 transition-colors hover:bg-muted/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{item.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Badge variant={item.tone === 'danger' ? 'destructive' : item.tone === 'warning' ? 'warning' : 'secondary'}>
                      {item.count}
                    </Badge>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="rounded-xl sm:rounded-[24px] border-subtle-border">
            <CardHeader>
              <CardTitle>תחזוקה בחלון הנבחר</CardTitle>
              <CardDescription>מועדים קרובים, מטפלים משויכים ופריטים שחרגו עד סוף החלון שנבחר.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <MetricPill label="באיחור" value={data.maintenanceSummary.overdue} warning={data.maintenanceSummary.overdue > 0} />
                <MetricPill label="היום" value={data.maintenanceSummary.dueToday} />
                <MetricPill label="בחלון" value={data.maintenanceSummary.dueInRange} />
              </div>
              <div className="space-y-3">
                {data.maintenanceSummary.upcoming.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-subtle-border bg-card p-4 transition-colors hover:bg-muted/35">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.buildingName}</p>
                      </div>
                      <Badge variant={item.priority === 'CRITICAL' || item.priority === 'HIGH' ? 'warning' : 'outline'}>
                        {getPriorityLabel(item.priority)}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{item.nextOccurrence ? formatDate(item.nextOccurrence) : 'ללא מועד'}</span>
                      <span className="text-border">•</span>
                      <span>{item.assignedTo || 'ללא שיוך'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl sm:rounded-[24px] border-subtle-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                אירועים ועדכונים
              </CardTitle>
              <CardDescription>רק התראות שנכנסו בתוך החלון שנבחר, כדי שהמסנן יהיה עקבי לעיני האדמין.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentNotifications.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border border-subtle-border bg-card p-4 transition-colors hover:bg-muted/35 ${!item.read ? 'border-s-[3px] border-s-info' : ''}`}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className={`font-semibold ${!item.read ? 'text-foreground' : 'text-muted-foreground'}`}>{item.title}</p>
                    <Badge variant={!item.read ? 'default' : 'outline'}>{getNotificationTypeLabel(item.type || 'SYSTEM')}</Badge>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{item.message}</p>
                  <p className="mt-2 text-xs text-tertiary">
                    {item.buildingName ? `${item.buildingName} • ` : ''}
                    {formatDate(item.createdAt)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
