import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Building2,
  Mail,
  Phone,
  Wrench,
} from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { EmptyState } from '../../components/ui/empty-state';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { DetailPanelSkeleton } from '../../components/ui/page-states';
import { CompactStatusStrip } from '../../components/ui/compact-status-strip';
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
    return [
      'במקרה חירום מחוץ לשעות הפעילות מומלץ ליצור קשר עם נציג הבניין או לפתוח קריאה דחופה.',
      'מסמכי ועד, פרוטוקולים ועדכונים שוטפים זמינים באזור המסמכים.',
    ];
  }

  return notes
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
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
      setError('לא ניתן לטעון כרגע את פרטי הבניין. נסו שוב בעוד רגע.');
    } finally {
      setLoading(false);
    }
  }

  const primaryUnit = context?.units[0] ?? null;
  const primaryBuilding = primaryUnit?.building ?? null;
  const buildingGuidance = useMemo(() => getBuildingGuidance(primaryBuilding?.notes), [primaryBuilding?.notes]);

  if (loading) return <DetailPanelSkeleton />;
  if (error || !context) {
    return <InlineErrorPanel title="פרטי הבניין לא נטענו" description={error || 'לא נמצאו נתונים'} onRetry={() => void loadPage()} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-3 md:hidden">
        <CompactStatusStrip
          roleLabel={primaryBuilding?.name ? `דייר · ${primaryBuilding.name}` : 'דייר'}
          icon={<Building2 className="h-4 w-4" strokeWidth={1.75} />}
          metrics={[
            { id: 'units', label: 'יחידות', value: Number(primaryBuilding?.totalUnits || 0), tone: 'default' },
            { id: 'floors', label: 'קומות', value: Number(primaryBuilding?.floors || 0), tone: 'default' },
          ]}
        />

        <PrimaryActionCard
          eyebrow="איש קשר ראשי"
          title={primaryBuilding?.managerName || 'נציג הבניין יעודכן בקרוב'}
          description={primaryBuilding?.contactPhone || primaryBuilding?.contactEmail || 'אפשר לעבור לתמיכה או לפתוח קריאה חדשה ישירות מהנייד.'}
          ctaLabel={primaryBuilding?.contactPhone ? 'התקשר עכשיו' : 'פתח קריאה'}
          href={primaryBuilding?.contactPhone ? `tel:${primaryBuilding.contactPhone}` : '/create-call'}
          tone={primaryBuilding?.isActive === false ? 'warning' : 'default'}
        />
      </div>

      <div className="hidden md:block">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>הבניין שלי</CardTitle>
            <CardDescription>מסך ממוקד עם אנשי קשר, הנחיות חירום ושירותי הבניין.</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card variant="elevated">
          <CardContent className="space-y-4 p-6">
            <div className="rounded-[22px] border border-subtle-border bg-muted/20 p-4">
              <div className="font-semibold text-foreground">{primaryBuilding?.name || 'הבניין הראשי שלך'}</div>
              <div className="mt-1 text-sm leading-6 text-muted-foreground">{primaryBuilding?.address || 'כתובת תופיע כאן לאחר שיושלם שיוך ליחידה.'}</div>
              {primaryBuilding ? (
                <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {primaryBuilding.totalUnits ? <Badge variant="outline">{primaryBuilding.totalUnits} יחידות</Badge> : null}
                  {primaryBuilding.floors ? <Badge variant="outline">{primaryBuilding.floors} קומות</Badge> : null}
                  <Badge variant={primaryBuilding.isActive === false ? 'warning' : 'success'}>{primaryBuilding.isActive === false ? 'לא פעיל' : 'פעיל'}</Badge>
                  {primaryUnit ? <Badge variant="outline">דירה {primaryUnit.number}</Badge> : null}
                </div>
              ) : null}
            </div>

            <div className="rounded-[22px] border border-subtle-border bg-background p-4">
              <div className="text-sm font-semibold text-foreground">אנשי קשר</div>
              <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  {primaryBuilding?.managerName || 'מנהל/ת בניין יעודכן בקרוב'}
                </div>
                {primaryBuilding?.contactPhone ? (
                  <a href={`tel:${primaryBuilding.contactPhone}`} className="flex items-center gap-2 text-foreground hover:text-primary">
                    <Phone className="h-4 w-4 text-primary" />
                    {primaryBuilding.contactPhone}
                  </a>
                ) : null}
                {primaryBuilding?.contactEmail ? (
                  <a href={`mailto:${primaryBuilding.contactEmail}`} className="flex items-center gap-2 text-foreground hover:text-primary">
                    <Mail className="h-4 w-4 text-primary" />
                    {primaryBuilding.contactEmail}
                  </a>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                הנחיות וחירום
              </CardTitle>
              <CardDescription>מה חשוב לדעת לפני שפונים או מזמינים שירות.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {buildingGuidance.map((item, index) => (
                <div key={`${item}-${index}`} className="rounded-2xl border border-subtle-border/70 bg-muted/20 px-3 py-2 text-sm leading-6 text-muted-foreground">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                שירותים ומתקנים
              </CardTitle>
              <CardDescription>המתקנים והשירותים שרלוונטיים לבניין שלך.</CardDescription>
            </CardHeader>
            <CardContent>
              {primaryBuilding?.amenities?.length ? (
                <div className="flex flex-wrap gap-2">
                  {primaryBuilding.amenities.map((amenity) => (
                    <Badge key={amenity} variant="finance">{amenity}</Badge>
                  ))}
                </div>
              ) : (
                <EmptyState type="empty" size="sm" title="עדיין לא הוגדרו מתקנים" description="כאשר צוות הניהול יעדכן מתקנים ושירותים, הם יופיעו כאן." />
              )}
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>פעולות מהירות</CardTitle>
              <CardDescription>מעברים שימושיים בלי לחזור לדף ארוך.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <Button variant="outline" asChild>
                <Link href="/documents">כל המסמכים</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/notifications">מרכז ההתראות</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/support">פנייה לתמיכה</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
