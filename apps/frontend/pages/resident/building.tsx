import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AlertTriangle, Building2, Mail, Phone, Wrench } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { CompactStatusStrip } from '../../components/ui/compact-status-strip';
import { EmptyState } from '../../components/ui/empty-state';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { DetailPanelSkeleton } from '../../components/ui/page-states';

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
  const router = useRouter();
  const [context, setContext] = useState<AccountContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadBuilding();
  }, []);

  async function loadBuilding() {
    try {
      setLoading(true);
      setError(null);
      const response = await authFetch('/api/v1/users/account');
      if (!response.ok) throw new Error(await response.text());
      setContext(await response.json());
    } catch (nextError) {
      console.error(nextError);
      setError('לא ניתן לטעון כרגע את פרטי הבניין. נסו שוב בעוד רגע.');
    } finally {
      setLoading(false);
    }
  }

  const primaryUnit = context?.units[0] ?? null;
  const building = primaryUnit?.building ?? null;
  const guidance = useMemo(() => getBuildingGuidance(building?.notes), [building?.notes]);

  if (loading) return <DetailPanelSkeleton />;
  if (error || !context) {
    return <InlineErrorPanel title="מסך הבניין לא נטען" description={error || 'לא נמצאו נתוני בניין'} onRetry={() => void loadBuilding()} />;
  }

  return (
    <div className="space-y-4 pb-16 sm:space-y-6 lg:pb-0">
      <CompactStatusStrip
        roleLabel={building?.name ? `דייר · ${building.name}` : 'דייר'}
        icon={<Building2 className="h-4 w-4" strokeWidth={1.75} />}
        metrics={[
          { id: 'units', label: 'יחידות', value: building?.totalUnits ?? 0, tone: 'default' },
          { id: 'floors', label: 'קומות', value: building?.floors ?? 0, tone: 'default' },
        ]}
      />

      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            הבניין שלי
          </CardTitle>
          <CardDescription>מידע מרוכז על הכתובת, אנשי הקשר והשירותים הזמינים לדייר.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-[24px] border border-subtle-border bg-muted/25 p-4">
            <div className="text-lg font-semibold text-foreground">{building?.name || 'הבניין הראשי שלך'}</div>
            <div className="mt-1 text-sm leading-6 text-muted-foreground">{building?.address || 'כתובת תופיע כאן לאחר שיושלם שיוך ליחידה.'}</div>
            {primaryUnit ? <div className="mt-2 text-sm text-foreground">דירה {primaryUnit.number}</div> : null}
            {building ? (
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
                {building.totalUnits ? <Badge variant="outline">{building.totalUnits} יחידות</Badge> : null}
                {building.floors ? <Badge variant="outline">{building.floors} קומות</Badge> : null}
                <Badge variant={building.isActive === false ? 'warning' : 'success'}>{building.isActive === false ? 'לא פעיל' : 'פעיל'}</Badge>
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">אנשי קשר</CardTitle>
                <CardDescription>ניהול, תמיכה וערוצי קשר מהירים.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-foreground">
                  <Building2 className="h-4 w-4 text-primary" />
                  {building?.managerName || 'מנהל/ת בניין יעודכן בקרוב'}
                </div>
                {building?.contactPhone ? (
                  <a href={`tel:${building.contactPhone}`} className="flex items-center gap-2 text-foreground hover:text-primary">
                    <Phone className="h-4 w-4 text-primary" />
                    {building.contactPhone}
                  </a>
                ) : null}
                {building?.contactEmail ? (
                  <a href={`mailto:${building.contactEmail}`} className="flex items-center gap-2 text-foreground hover:text-primary">
                    <Mail className="h-4 w-4 text-primary" />
                    {building.contactEmail}
                  </a>
                ) : null}
                {!building?.contactPhone && !building?.contactEmail ? <div className="text-muted-foreground">פרטי קשר יעודכנו בקרוב.</div> : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  הנחיות וחירום
                </CardTitle>
                <CardDescription>מידע שכדאי שיהיה זמין גם מהנייד.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {guidance.map((item, index) => (
                  <div key={`${item}-${index}`} className="rounded-2xl border border-subtle-border/70 bg-muted/20 px-3 py-2 text-sm leading-6 text-muted-foreground">
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wrench className="h-4 w-4 text-primary" />
                שירותים ומתקנים
              </CardTitle>
              <CardDescription>מתקני הבניין ויעדים קשורים.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {building?.amenities?.length ? (
                  building.amenities.map((amenity) => (
                    <Badge key={amenity} variant="finance">
                      {amenity}
                    </Badge>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">עדיין לא הוגדרו מתקנים לבניין זה.</div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Button variant="outline" asChild>
                  <Link href="/documents">מסמכים</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/notifications">התראות</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/support">צור קשר</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {!building ? (
            <EmptyState
              type="empty"
              size="sm"
              title="עדיין לא הוגדר בניין ראשי"
              description="כשתושלם השיוך ליחידה שלך, פרטי הבניין יופיעו כאן."
              action={{ label: 'חזור לבית', onClick: () => router.push('/resident/account') }}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
