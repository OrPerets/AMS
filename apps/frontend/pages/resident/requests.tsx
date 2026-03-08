import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FileText, Move, ParkingCircle, PhoneCall } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { toast } from '../../components/ui/use-toast';
import { formatDate } from '../../lib/utils';
import { useLocale } from '../../lib/providers';

const requestTypes = [
  { value: 'MOVING', label: 'הודעת מעבר', icon: Move, description: 'כניסה/יציאה, מעלית, תיאום שירותים.' },
  { value: 'PARKING', label: 'בקשת חניה', icon: ParkingCircle, description: 'שינוי הקצאה, אורח קבוע או בעיית חניה.' },
  { value: 'DOCUMENT', label: 'בקשת מסמך', icon: FileText, description: 'אישור ניהול תקין, חשבונית, פרוטוקול או מסמך בניין.' },
  { value: 'CONTACT_UPDATE', label: 'עדכון פרטי קשר', icon: PhoneCall, description: 'טלפון, אימייל או איש קשר נוסף.' },
  { value: 'GENERAL', label: 'בקשה כללית', icon: FileText, description: 'כל בקשה תפעולית אחרת שלא דורשת קריאת תחזוקה.' },
] as const;

type RequestHistoryItem = {
  requestKey: string;
  subject: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  requestType: string;
  requestedDate?: string | null;
  status: 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED' | 'CLOSED';
  statusNotes?: string | null;
};

const emptyForm = {
  requestType: 'MOVING',
  subject: '',
  message: '',
  requestedDate: '',
  movingDirection: 'MOVE_IN',
  movingWindow: '',
  elevatorNeeded: 'YES',
  parkingRequestType: 'CHANGE_ASSIGNMENT',
  plateNumber: '',
  documentCategory: 'INVOICE',
  nextPhone: '',
  nextEmail: '',
  extraContact: '',
};

export default function ResidentRequestsPage() {
  const { locale } = useLocale();
  const [form, setForm] = useState(emptyForm);
  const [history, setHistory] = useState<RequestHistoryItem[]>([]);
  const [historyFilter, setHistoryFilter] = useState({ status: 'ALL', requestType: 'ALL' });
  const [loading, setLoading] = useState(true);
  const activeType = requestTypes.find((item) => item.value === form.requestType)!;

  useEffect(() => {
    void loadHistory();
  }, [historyFilter.status, historyFilter.requestType]);

  async function loadHistory() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (historyFilter.status !== 'ALL') params.set('status', historyFilter.status);
      if (historyFilter.requestType !== 'ALL') params.set('requestType', historyFilter.requestType);
      const response = await authFetch(`/api/v1/communications/resident-requests${params.toString() ? `?${params.toString()}` : ''}`);
      if (!response.ok) throw new Error(await response.text());
      setHistory(await response.json());
    } catch (error) {
      console.error(error);
      toast({ title: 'טעינת היסטוריית הבקשות נכשלה', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const metadata = useMemo(() => {
    switch (form.requestType) {
      case 'MOVING':
        return {
          movingDirection: form.movingDirection,
          movingWindow: form.movingWindow || null,
          elevatorNeeded: form.elevatorNeeded === 'YES',
        };
      case 'PARKING':
        return {
          parkingRequestType: form.parkingRequestType,
          plateNumber: form.plateNumber || null,
        };
      case 'DOCUMENT':
        return {
          documentCategory: form.documentCategory,
        };
      case 'CONTACT_UPDATE':
        return {
          nextPhone: form.nextPhone || null,
          nextEmail: form.nextEmail || null,
          extraContact: form.extraContact || null,
        };
      default:
        return {};
    }
  }, [form]);

  async function submitRequest() {
    try {
      const response = await authFetch('/api/v1/communications/resident-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: form.requestType,
          subject: form.subject,
          message: form.message,
          requestedDate: form.requestedDate || undefined,
          metadata,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      toast({ title: 'הבקשה נשלחה לצוות הניהול' });
      setForm(emptyForm);
      await loadHistory();
    } catch (error) {
      console.error(error);
      toast({ title: 'שליחת הבקשה נכשלה', variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold">בקשות דייר</h1>
        <p className="text-sm text-muted-foreground">טפסים מובנים לניהול מול עמית אחזקות, עם סטטוס ומעקב על כל בקשה.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle>בחר סוג בקשה</CardTitle>
            <CardDescription>לקריאת תחזוקה השתמשו במסלול הייעודי כדי לפתוח תקלה עם תמונות.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {requestTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  className={`w-full rounded-xl border p-4 text-right ${form.requestType === type.value ? 'border-primary bg-primary/5' : ''}`}
                  onClick={() => setForm((current) => ({ ...current, requestType: type.value }))}
                >
                  <div className="flex items-center gap-2 font-medium">
                    <Icon className="h-4 w-4" />
                    {type.label}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{type.description}</div>
                </button>
              );
            })}
            <Button asChild variant="outline" className="w-full">
              <Link href="/create-call">פתח קריאת תחזוקה</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{activeType.label}</CardTitle>
            <CardDescription>{activeType.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="נושא" value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} />
            <Input type="date" value={form.requestedDate} onChange={(event) => setForm((current) => ({ ...current, requestedDate: event.target.value }))} />

            {form.requestType === 'MOVING' && (
              <div className="grid gap-3 md:grid-cols-3">
                <select className="rounded-md border px-3 py-2 text-sm" value={form.movingDirection} onChange={(event) => setForm((current) => ({ ...current, movingDirection: event.target.value }))}>
                  <option value="MOVE_IN">כניסה</option>
                  <option value="MOVE_OUT">יציאה</option>
                </select>
                <Input placeholder="חלון מעבר" value={form.movingWindow} onChange={(event) => setForm((current) => ({ ...current, movingWindow: event.target.value }))} />
                <select className="rounded-md border px-3 py-2 text-sm" value={form.elevatorNeeded} onChange={(event) => setForm((current) => ({ ...current, elevatorNeeded: event.target.value }))}>
                  <option value="YES">נדרשת מעלית</option>
                  <option value="NO">ללא מעלית</option>
                </select>
              </div>
            )}

            {form.requestType === 'PARKING' && (
              <div className="grid gap-3 md:grid-cols-2">
                <select className="rounded-md border px-3 py-2 text-sm" value={form.parkingRequestType} onChange={(event) => setForm((current) => ({ ...current, parkingRequestType: event.target.value }))}>
                  <option value="CHANGE_ASSIGNMENT">שינוי הקצאה</option>
                  <option value="GUEST">אורח קבוע</option>
                  <option value="ISSUE">בעיה קיימת</option>
                </select>
                <Input placeholder="מספר רכב" value={form.plateNumber} onChange={(event) => setForm((current) => ({ ...current, plateNumber: event.target.value }))} />
              </div>
            )}

            {form.requestType === 'DOCUMENT' && (
              <select className="rounded-md border px-3 py-2 text-sm" value={form.documentCategory} onChange={(event) => setForm((current) => ({ ...current, documentCategory: event.target.value }))}>
                <option value="INVOICE">חשבונית / קבלה</option>
                <option value="PROTOCOL">פרוטוקול</option>
                <option value="REGULATION">תקנון</option>
                <option value="CERTIFICATE">אישור</option>
              </select>
            )}

            {form.requestType === 'CONTACT_UPDATE' && (
              <div className="grid gap-3 md:grid-cols-3">
                <Input placeholder="טלפון חדש" value={form.nextPhone} onChange={(event) => setForm((current) => ({ ...current, nextPhone: event.target.value }))} />
                <Input placeholder="אימייל חדש" value={form.nextEmail} onChange={(event) => setForm((current) => ({ ...current, nextEmail: event.target.value }))} />
                <Input placeholder="איש קשר נוסף" value={form.extraContact} onChange={(event) => setForm((current) => ({ ...current, extraContact: event.target.value }))} />
              </div>
            )}

            <Textarea rows={8} placeholder="פרטי הבקשה" value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} />
            <Button onClick={submitRequest} disabled={!form.subject || !form.message}>שלח בקשה</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>היסטוריית בקשות</CardTitle>
          <CardDescription>מעקב לפי סטטוס, סוג בקשה והערות טיפול.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <select className="rounded-md border px-3 py-2 text-sm" value={historyFilter.status} onChange={(event) => setHistoryFilter((current) => ({ ...current, status: event.target.value }))}>
              <option value="ALL">כל הסטטוסים</option>
              <option value="SUBMITTED">נשלח</option>
              <option value="IN_REVIEW">בטיפול</option>
              <option value="COMPLETED">הושלם</option>
              <option value="CLOSED">נסגר</option>
            </select>
            <select className="rounded-md border px-3 py-2 text-sm" value={historyFilter.requestType} onChange={(event) => setHistoryFilter((current) => ({ ...current, requestType: event.target.value }))}>
              <option value="ALL">כל סוגי הבקשות</option>
              {requestTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </div>
          {history.map((item) => (
            <div key={item.requestKey} className="rounded-xl border p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={item.status === 'COMPLETED' ? 'success' : item.status === 'CLOSED' ? 'secondary' : 'warning'}>{item.status}</Badge>
                    <Badge variant="outline">{item.requestType}</Badge>
                    <span className="font-medium">{item.subject.replace(/^[A-Z_]+:\s*/, '')}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{item.message}</div>
                  {item.statusNotes ? <div className="text-xs text-muted-foreground">הערת טיפול: {item.statusNotes}</div> : null}
                </div>
                <div className="text-xs text-muted-foreground">{formatDate(new Date(item.updatedAt || item.createdAt), locale)}</div>
              </div>
            </div>
          ))}
          {!loading && !history.length && <div className="py-8 text-center text-sm text-muted-foreground">אין בקשות להצגה במסנן הנוכחי.</div>}
        </CardContent>
      </Card>
    </div>
  );
}
