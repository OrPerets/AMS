import Link from 'next/link';
import { Settings2, ShieldCheck } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { getAuditActionLabel, getUserRoleLabel } from '../../../lib/utils';
import { DashboardResponse } from './types';
import { MetricPill, MiniStat } from './primitives';

export function RiskAndSystemGrid({
  data,
  formatCurrency,
  formatDate,
}: {
  data: DashboardResponse;
  formatCurrency: (amount: number) => string;
  formatDate: (value: string | Date) => string;
}) {
  return (
    <section className="grid gap-4 sm:gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <Card className="rounded-xl sm:rounded-[24px] border-subtle-border">
        <CardHeader>
          <CardTitle>דירוג בריאות בניינים</CardTitle>
          <CardDescription>
            ציון הסיכון משלב עומס קריאות, דחיפות, חובות, ציות ותחזוקה. הוא נועד להסביר קדימות, לא להחליף שיקול דעת ניהולי.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.buildingRiskList.map((building, index) => {
            const riskClamped = Math.min(100, Math.max(0, building.riskScore));
            const riskColor = riskClamped > 70 ? 'bg-rose-500' : riskClamped > 40 ? 'bg-amber-500' : 'bg-emerald-500';
            const rankStyle =
              index === 0
                ? 'bg-rose-600 text-white'
                : index === 1
                  ? 'bg-amber-500 text-white'
                  : index === 2
                    ? 'bg-amber-300 text-amber-900'
                    : 'bg-muted text-muted-foreground';
            return (
              <div key={building.buildingId} className="rounded-xl sm:rounded-[22px] border border-subtle-border bg-muted/25 p-3 sm:p-4 transition-colors hover:bg-muted/40">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold ${rankStyle}`}>{index + 1}</div>
                      <div>
                        <p className="font-semibold text-foreground">{building.buildingName}</p>
                        <p className="text-sm text-muted-foreground">{building.address}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>ציון סיכון</span>
                        <span className="font-semibold">{building.riskScore}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full ${riskColor}`} style={{ width: `${riskClamped}%` }} />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <Badge variant={building.urgentTickets > 0 ? 'destructive' : 'secondary'}>{building.urgentTickets} דחופות</Badge>
                      <Badge variant={building.overdueInvoices > 0 ? 'warning' : 'outline'}>{building.overdueInvoices} בפיגור</Badge>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <MiniStat label="קריאות" value={building.openTickets} />
                    <MiniStat label="חוב" value={formatCurrency(building.unpaidAmount)} />
                    <MiniStat label="תחזוקה" value={building.upcomingMaintenance} />
                    <MiniStat label="ציות" value={building.complianceExpiries} />
                    <MiniStat label="פעילות אחרונה" value={building.lastManagerActivity ? formatDate(building.lastManagerActivity) : 'ללא'} />
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="space-y-4 sm:space-y-6">
        <Card className="rounded-xl sm:rounded-[24px] border-subtle-border">
          <CardHeader>
            <CardTitle>מצב גבייה</CardTitle>
            <CardDescription>תמונת מצב מרוכזת של חובות ודיירים עם יתרות גבוהות.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <MetricPill label="יתרת חוב" value={formatCurrency(data.collectionsSummary.unpaidBalance)} />
              <MetricPill label="באיחור" value={data.collectionsSummary.overdueInvoices} warning={data.collectionsSummary.overdueInvoices > 0} />
              <MetricPill label="ממתינות" value={data.collectionsSummary.pendingInvoices} />
            </div>
            <div className="space-y-3">
              {data.collectionsSummary.topDebtors.map((debtor, idx) => {
                const maxAmount = data.collectionsSummary.topDebtors[0]?.amount || 1;
                const pct = Math.round((debtor.amount / maxAmount) * 100);
                return (
                  <div key={debtor.residentId} className="rounded-2xl border border-subtle-border bg-card p-4 transition-colors hover:bg-muted/35">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">{idx + 1}</span>
                        <div>
                          <p className="font-medium text-foreground">{debtor.residentName}</p>
                          <p className="text-sm text-muted-foreground">{debtor.overdueCount} פריטים בפיגור</p>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-foreground">{formatCurrency(debtor.amount)}</div>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary/65" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <Card className="rounded-xl sm:rounded-[24px] border-subtle-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-success" />
                בריאות מערכת
              </CardTitle>
              <CardDescription>זמינות, תקינות API, תור, ושימוש פעיל.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(data.systemAdmin.health).map(([key, value]) => (
                <div key={key} className="rounded-2xl border border-subtle-border bg-card px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-foreground">{value.label}</span>
                    <Badge variant={value.status === 'critical' ? 'destructive' : value.status === 'warning' ? 'warning' : 'success'}>
                      {value.value}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-xl sm:rounded-[24px] border-subtle-border">
            <CardHeader>
              <CardTitle>הרשאות והפצה</CardTitle>
              <CardDescription>פילוח תפקידים וכניסה מהירה למרכז ההגדרות.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {Object.entries(data.systemAdmin.roleCounts).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between rounded-2xl border border-subtle-border bg-card px-4 py-3">
                    <span className="font-medium text-foreground">{getUserRoleLabel(role)}</span>
                    <span className="text-sm font-semibold text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-dashed border-strong-border bg-muted/25 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">מרכז הגדרות ותצורת דייר</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      כעת אפשר לנהל תבניות, SLA, שעות פעילות ומפת הרשאות ממסך אחד במקום לרדוף אחרי דפים נפרדים.
                    </p>
                  </div>
                  <Settings2 className="h-5 w-5 text-primary" />
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button asChild size="sm">
                    <Link href="/admin/configuration">פתח מרכז הגדרות</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/admin/security">מטריצת הרשאות</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-xl sm:rounded-[24px] border-subtle-border">
          <CardHeader>
            <CardTitle>משתמשים אחרונים</CardTitle>
            <CardDescription>הקשר מהיר על גידול משתמשים ופעולות רגישות.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              {data.systemAdmin.users.map((user) => (
                <div key={user.id} className="rounded-2xl border border-subtle-border bg-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-foreground">{user.email}</p>
                    <Badge variant="outline">{getUserRoleLabel(user.role)}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    סביבת לקוח {user.tenantId} • {user.phone || 'ללא טלפון'}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {data.systemAdmin.recentImpersonationEvents.map((event) => (
                <div key={event.id} className="rounded-2xl border border-subtle-border bg-card p-4">
                  <p className="font-medium text-foreground">
                    {getAuditActionLabel(event.action)} {event.targetRole ? `← ${getUserRoleLabel(event.targetRole)}` : ''}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{event.reason || 'ללא סיבה מתועדת'}</p>
                  <p className="mt-2 text-xs text-tertiary">{formatDate(event.createdAt)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
