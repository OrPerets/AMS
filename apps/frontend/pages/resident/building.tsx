import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Building2, Mail, Phone, Wrench } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { CompactStatusStrip } from '../../components/ui/compact-status-strip';
import { EmptyState } from '../../components/ui/empty-state';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { DetailPanelSkeleton } from '../../components/ui/page-states';
import { PrimaryActionCard } from '../../components/ui/primary-action-card';

type AccountContext = {
  units: Array<{
    id: number;
    number: string;
    building: {
      id: number;
      name: string;
      address: string;
      amenities?: string[];
      managerName?: string | null;
      contactEmail?: string | null;
      contactPhone?: string | null;
      notes?: string | null;
      totalUnits?: number | null;
      floors?: number | null;
      isActive?: boolean;
    };
  }>;
};

function getBuildingGuidance(notes?: string | null) {
  if (!notes?.trim()) {
    return ['מוקד התמיכה זמין דרך צור קשר או פתיחת קריאה.', 'עדכונים ומסמכי ועד זמינים באזור המסמכים.'];
  }

  return notes
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2);
}

export default function ResidentBuildingPage() {
  const [context, setContext] = useState<AccountContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadPage();
  }, []);

  async function loadPage() {
    try {
      setLoading(true);
      setError(null);
      const response = await authFetch('/api/v1/users/account');
      if (!response.ok) {
        throw new Error(await response.text());
      }
      setContext(await response.json());
    } catch (nextError) {
      console.error(nextError);
      setError('לא ניתן לטעון כרגע את פרטי הבניין.');
    } finally {
      setLoading(false);
    }
  }

  const primaryUnit = context?.units[0] ?? null;
  const building = primaryUnit?.building ?? null;
  const guidance = useMemo(() => getBuildingGuidance(building?.notes), [building?.notes]);

  if (loading) return <DetailPanelSkeleton />;
  if (error || !context) {
    return <InlineErrorPanel title="פרטי הבניין לא נטענו" description={error || 'לא נמצאו נתונים'} onRetry={() => void loadPage()} />;
  }

  return (
    <div dir="rtl" className="space-y-4 pb-20 text-right sm:space-y-6 lg:pb-0">
      <CompactStatusStrip
        roleLabel={building?.name ? `${building.name} · דירה ${primaryUnit?.number}` : 'הבניין שלי'}
        icon={<Building2 className="h-4 w-4" strokeWidth={1.75} />}
        metrics={[
          { id: 'units', label: 'יחידות', value: Number(building?.totalUnits || 0), tone: 'default' },
          { id: 'floors', label: 'קומות', value: Number(building?.floors || 0), tone: 'default' },
        ]}
      />

      <PrimaryActionCard
        eyebrow="איש קשר"
        title={building?.managerName || 'צוות הבניין'}
        description={building?.contactPhone || 'פתח קריאה או צור קשר'}
        ctaLabel={building?.contactPhone ? 'התקשר' : 'פתח קריאה'}
        href={building?.contactPhone ? `tel:${building.contactPhone}` : '/create-call'}
        tone={building?.contactPhone ? 'default' : 'warning'}
        secondaryAction={
          <Button variant="outline" size="sm" asChild>
            <Link href="/support">צור קשר</Link>
          </Button>
        }
      />

      <Card variant="elevated" className="gold-sheen-surface rounded-[28px] border-0" data-accent-sheen="true">
        <CardContent className="space-y-4 p-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-foreground">המיקום שלך</div>
            <h1 className="mt-2 text-2xl font-black text-foreground">{building?.name || 'הבניין שלך'}</h1>
            <p className="mt-1 text-sm text-secondary-foreground">{building?.address || 'הכתובת תופיע כאן לאחר שיושלם השיוך ליחידה.'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MiniInfoCard label="דירה" value={primaryUnit?.number || '-'} />
            <MiniInfoCard label="סטטוס" value={building?.isActive === false ? 'לא פעיל' : 'פעיל'} />
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-3 md:grid-cols-2">
        <ContactTile
          icon={<Phone className="h-4 w-4 text-primary" strokeWidth={1.75} />}
          title="טלפון"
          value={building?.contactPhone || 'לא עודכן'}
          href={building?.contactPhone ? `tel:${building.contactPhone}` : undefined}
        />
        <ContactTile
          icon={<Mail className="h-4 w-4 text-primary" strokeWidth={1.75} />}
          title="אימייל"
          value={building?.contactEmail || 'לא עודכן'}
          href={building?.contactEmail ? `mailto:${building.contactEmail}` : undefined}
        />
      </section>

      <Card variant="muted" className="rounded-[24px] border-subtle-border/80">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" strokeWidth={1.75} />
            <h2 className="text-base font-semibold text-foreground">חשוב לדעת</h2>
          </div>
          <div className="space-y-2">
            {guidance.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-[18px] border border-subtle-border bg-background px-3 py-3 text-sm text-secondary-foreground">
                {item}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card variant="muted" className="rounded-[24px] border-subtle-border/80">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" strokeWidth={1.75} />
            <h2 className="text-base font-semibold text-foreground">קישורים</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <QuickLink href="/documents" label="מסמכים" />
            <QuickLink href="/create-call" label="קריאה חדשה" />
            <QuickLink href="/support" label="צור קשר" />
            <QuickLink href="/resident/account" label="חזרה לבית" />
          </div>
          <div className="flex flex-wrap gap-2">
            {building?.amenities?.length ? (
              building.amenities.slice(0, 6).map((amenity) => (
                <span key={amenity} className="rounded-full border border-primary/12 bg-[linear-gradient(180deg,rgba(255,248,233,0.98)_0%,rgba(248,234,199,0.94)_100%)] px-3 py-1 text-xs font-medium text-primary">
                  {amenity}
                </span>
              ))
            ) : (
              <EmptyState size="sm" type="empty" title="אין כרגע פירוט מתקנים" description="המתקנים יופיעו כאן." />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ContactTile({
  icon,
  title,
  value,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  href?: string;
}) {
  const content = (
    <Card variant="muted" className="rounded-[22px] border-subtle-border/80">
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center gap-2">
          {icon}
          <div className="text-sm font-semibold text-foreground">{title}</div>
        </div>
        <div className="text-sm text-secondary-foreground">{value}</div>
      </CardContent>
    </Card>
  );

  if (!href) return content;

  return (
    <a href={href} className="block transition hover:-translate-y-0.5">
      {content}
    </a>
  );
}

function MiniInfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[20px] border border-subtle-border bg-background px-3 py-3">
      <div className="text-xs font-medium text-secondary-foreground">{label}</div>
      <div className="mt-1 text-lg font-bold text-foreground">
        <bdi>{value}</bdi>
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="rounded-[18px] border border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,245,238,0.94)_100%)] px-3 py-3 text-center text-sm font-semibold text-foreground transition hover:border-primary/25">
      {label}
    </Link>
  );
}
