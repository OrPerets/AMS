import Link from 'next/link';
import { ArrowUpRight, BellRing, Brush, Clock3, CreditCard, LayoutTemplate, ShieldCheck, TimerReset } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { PageHero } from '../../components/ui/page-hero';
import { SectionHeader } from '../../components/ui/section-header';
import { ADMIN_DASHBOARD_WIDGETS, DASHBOARD_WIDGET_GROUP_ORDER } from '../../components/admin/dashboard/widget-registry';
import { getDashboardWidgetGroupLabel, getUserRoleLabel } from '../../lib/utils';

const configurationSections = [
  {
    id: 'branding',
    title: 'מיתוג',
    icon: Brush,
    status: 'תשתית מוכנה',
    summary: 'מאגד את נכסי המותג, זהות שולח, וצבעי המערכת למבנה שניתן להפוך בהמשך להגדרות דייר אמיתיות.',
    bullets: ['צבעי המותג החדשים כבר חלים בדשבורד.', 'השלב הבא: העלאת לוגו/שם מותג ברמת דייר.', 'יש לשמור על טוקנים, לא צבעים קשיחים.'],
    href: '/settings',
  },
  {
    id: 'business-hours',
    title: 'שעות פעילות',
    icon: Clock3,
    status: 'בתכנון',
    summary: 'מייצר בית ברור למדיניות זמינות, חלונות תמיכה, והחרגות סוף שבוע/חג.',
    bullets: ['שעות הפעילות ישפיעו בהמשך על SLA וחיווי סיכון.', 'המסך מגדיר בעלים ברור למדיניות תפעול.', 'מומלץ לשמור חלונות נפרדים לדיירים, ספקים וחירום.'],
    href: '/admin/dashboard',
  },
  {
    id: 'sla',
    title: 'מדיניות SLA',
    icon: TimerReset,
    status: 'בתכנון',
    summary: 'ממפה סוגי קריאות, זמני תגובה והסלמות כדי שהדשבורד והדיספאץ׳ יישענו על מקור אחד.',
    bullets: ['חריגות SLA כבר מוצגות בדשבורד.', 'השלב הבא: טבלאות יעד לפי חומרה/שעות.', 'יש לקשר בעתיד לתורים, הסלמות והתראות.'],
    href: '/tickets',
  },
  {
    id: 'payment-terms',
    title: 'תנאי תשלום',
    icon: CreditCard,
    status: 'בתכנון',
    summary: 'מרכז את כללי חיוב, חלונות גבייה, ואכיפת איחורים תחת בעלות אדמינית אחת.',
    bullets: ['הדשבורד כבר מציג חוב, פיגורים וחייבים מובילים.', 'השלב הבא: יישור מול תנאי תשלום ופעולות גבייה.', 'רצוי להצמיד תבניות תזכורת לערוצי התראה.'],
    href: '/payments',
  },
  {
    id: 'notification-templates',
    title: 'תבניות התראה',
    icon: BellRing,
    status: 'כלי פעיל',
    summary: 'מחבר בין מחולל ההתראות הקיים לבין ספריית תבניות ומדיניות שפה/ערוץ.',
    bullets: ['כבר יש מסך שליחת התראות לאדמין.', 'השלב הבא: ניהול ספריית תבניות ו-preview לפי ערוץ.', 'צריך להגדיר אילו תבניות קשורות ל-SLA, גבייה וחירום.'],
    href: '/admin/notifications',
  },
] as const;

const permissionMatrix = [
  { role: 'MASTER', finance: 'view, export, approve, impersonate', operations: 'view, manage', documents: 'view, share, delete-request', admin: 'view, export, security' },
  { role: 'ADMIN', finance: 'view, export, approve', operations: 'view, manage', documents: 'view, share, delete-request', admin: 'view, export, security' },
  { role: 'PM', finance: 'view, export', operations: 'view, manage', documents: 'view, share', admin: 'view' },
  { role: 'ACCOUNTANT', finance: 'view, export, approve', operations: 'view', documents: 'view', admin: 'view' },
  { role: 'TECH', finance: 'none', operations: 'view, manage-assigned', documents: 'view-assigned', admin: 'none' },
  { role: 'RESIDENT', finance: 'view-own, download-own', operations: 'view-own, create-request', documents: 'view-public, view-shared', admin: 'none' },
];

function translatePermissionSummary(value: string) {
  const labels: Record<string, string> = {
    view: 'צפייה',
    export: 'ייצוא',
    approve: 'אישור',
    impersonate: 'התחזות',
    manage: 'ניהול',
    share: 'שיתוף',
    security: 'אבטחה',
    none: 'ללא',
    'delete-request': 'בקשת מחיקה',
    'manage-assigned': 'ניהול משויך',
    'view-assigned': 'צפייה משויכת',
    'view-own': 'צפייה אישית',
    'download-own': 'הורדה אישית',
    'create-request': 'פתיחת בקשה',
    'view-public': 'צפייה ציבורית',
    'view-shared': 'צפייה משותפת',
  };

  return value
    .split(',')
    .map((part) => labels[part.trim()] || part.trim())
    .join(' • ');
}

export default function AdminConfigurationPage() {
  return (
    <div className="space-y-8">
      <PageHero
        kicker="מרכז שליטה אדמיני"
        eyebrow={<Badge variant="outline">תצורה</Badge>}
        title="מרכז הגדרות ותצורה"
        description="כלי התצורה המרכזיים במקום אחד: מדיניות, תבניות והרשאות."
        aside={
          <div className="space-y-3">
            <div className="rounded-[22px] border border-primary/12 bg-white/78 p-4 text-right shadow-[0_16px_34px_rgba(44,28,9,0.06)]">
              <div className="text-xs font-semibold tracking-[0.12em] text-primary/72">שלב תצורה</div>
              <div className="mt-2 text-base font-semibold text-foreground">מדיניות, תבניות והרשאות במסך אחד</div>
            </div>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card variant="elevated">
          <CardContent className="space-y-6 p-6">
            <SectionHeader
              title="תחומי תצורה"
              subtitle="כל אזור כאן מגדיר בעלות ומסמן מה כבר קיים לעומת מה שעדיין מתוכנן לשלב הבא."
            />
            <div className="grid gap-4 md:grid-cols-2">
              {configurationSections.map((section) => {
                const Icon = section.icon;
                return (
                  <Card key={section.id} className="rounded-[24px] border-slate-200">
                    <CardHeader className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">{section.title}</CardTitle>
                            <CardDescription>{section.status}</CardDescription>
                          </div>
                        </div>
                        <Badge variant={section.status === 'כלי פעיל' || section.status === 'תשתית מוכנה' ? 'success' : 'outline'}>
                          {section.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm leading-6 text-muted-foreground">{section.summary}</p>
                      <div className="space-y-2">
                        {section.bullets.map((bullet) => (
                          <div key={bullet} className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground/80">
                            {bullet}
                          </div>
                        ))}
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href={section.href}>
                          פתח אזור קשור
                          <ArrowUpRight className="icon-directional ms-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card variant="elevated">
            <CardContent className="space-y-4 p-6">
              <SectionHeader
                title="צעדים אופרטיביים"
                subtitle="מסלולי המשך ישירים כדי לא להפוך את מרכז ההגדרות לדף תיעוד בלבד."
              />
              <div className="grid gap-3">
                <Button asChild>
                  <Link href="/admin/notifications">ניהול תבניות והתראות</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/admin/security">מטריצת הרשאות ואכיפה</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/admin/dashboard">חזרה לדשבורד הניהולי</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="space-y-4 p-6">
              <SectionHeader
                title="עקרונות תצורה"
                subtitle="הכללים שמונעים יצירת עוד מסכי אדמין מבודדים."
              />
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3">מדיניות תפעול, SLA ותבניות צריכות לחיות במסך ייעודי אחד עם בעלים ברור.</div>
                <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3">כל מצב שמוצג בדשבורד חייב להפנות למסך פעולה, לא רק להסביר את הבעיה.</div>
                <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3">שדות מותג ותצורה עתידיים צריכים לשבת על טוקנים וחוזים משותפים, לא על ערכים קשיחים ברכיבים.</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card variant="elevated">
        <CardContent className="space-y-6 p-6">
          <SectionHeader
            title="מטריצת הרשאות"
            subtitle="תצוגת role/action שמבהירה מהר מי רשאי לראות, לייצא, לאשר או לנהל בכל תחום."
            actions={<ShieldCheck className="h-5 w-5 text-primary" />}
          />
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3 text-sm">
              <thead>
                <tr className="text-right text-muted-foreground">
                  <th className="px-4 py-2">תפקיד</th>
                  <th className="px-4 py-2">פיננסים</th>
                  <th className="px-4 py-2">תפעול</th>
                  <th className="px-4 py-2">מסמכים</th>
                  <th className="px-4 py-2">אדמין</th>
                </tr>
              </thead>
              <tbody>
                {permissionMatrix.map((row) => (
                  <tr key={row.role} className="rounded-2xl bg-card shadow-sm">
                    <td className="rounded-s-2xl border border-border px-4 py-4 font-semibold text-foreground">{getUserRoleLabel(row.role)}</td>
                    <td className="border-y border-border px-4 py-4 text-muted-foreground">{translatePermissionSummary(row.finance)}</td>
                    <td className="border-y border-border px-4 py-4 text-muted-foreground">{translatePermissionSummary(row.operations)}</td>
                    <td className="border-y border-border px-4 py-4 text-muted-foreground">{translatePermissionSummary(row.documents)}</td>
                    <td className="rounded-e-2xl border border-border px-4 py-4 text-muted-foreground">{translatePermissionSummary(row.admin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardContent className="space-y-6 p-6">
          <SectionHeader
            title="ארכיטקטורת ווידג׳טים"
            subtitle="הדשבורד פוצל לחוזי ווידג׳טים ברורים כדי שאפשר יהיה בהמשך להוסיף hide/show/reorder בלי לשכתב את המסך."
            actions={<LayoutTemplate className="h-5 w-5 text-primary" />}
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {DASHBOARD_WIDGET_GROUP_ORDER.map((group) => (
              <div key={group} className="rounded-[24px] border border-border bg-muted/20 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{getDashboardWidgetGroupLabel(group)}</h3>
                  <Badge variant="outline">{ADMIN_DASHBOARD_WIDGETS.filter((widget) => widget.group === group).length}</Badge>
                </div>
                <div className="space-y-3">
                  {ADMIN_DASHBOARD_WIDGETS.filter((widget) => widget.group === group).map((widget) => (
                    <div key={widget.id} className="rounded-2xl border border-border bg-card px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{widget.title}</p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">{widget.description}</p>
                        </div>
                        <Badge variant={widget.canHide && widget.canReorder ? 'success' : 'secondary'}>
                          {widget.canHide && widget.canReorder ? 'מוכן' : 'קבוע'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
