import { useState } from 'react';
import Link from 'next/link';
import { FileText, Move, ParkingCircle, PhoneCall } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { toast } from '../../components/ui/use-toast';

const requestTypes = [
  { value: 'MOVING', label: 'הודעת מעבר', icon: Move, description: 'כניסה/יציאה, מעלית, תיאום שירותים.' },
  { value: 'PARKING', label: 'בקשת חניה', icon: ParkingCircle, description: 'שינוי הקצאה, אורח קבוע או בעיית חניה.' },
  { value: 'DOCUMENT', label: 'בקשת מסמך', icon: FileText, description: 'אישור ניהול תקין, חשבונית, פרוטוקול או מסמך בניין.' },
  { value: 'CONTACT_UPDATE', label: 'עדכון פרטי קשר', icon: PhoneCall, description: 'טלפון, אימייל או איש קשר נוסף.' },
  { value: 'GENERAL', label: 'בקשה כללית', icon: FileText, description: 'כל בקשה תפעולית אחרת שלא דורשת קריאת תחזוקה.' },
];

export default function ResidentRequestsPage() {
  const [form, setForm] = useState({
    requestType: 'MOVING',
    subject: '',
    message: '',
    requestedDate: '',
  });
  const activeType = requestTypes.find((item) => item.value === form.requestType)!;

  async function submitRequest() {
    try {
      const response = await authFetch('/api/v1/communications/resident-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error(await response.text());
      toast({ title: 'הבקשה נשלחה לצוות הניהול' });
      setForm({ requestType: 'MOVING', subject: '', message: '', requestedDate: '' });
    } catch (error) {
      console.error(error);
      toast({ title: 'שליחת הבקשה נכשלה', variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold">בקשות דייר</h1>
        <p className="text-sm text-muted-foreground">טפסים מובנים לניהול מול עמית אחזקות, בלי להסתבך בהודעות חופשיות.</p>
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
            <Textarea rows={8} placeholder="פרטי הבקשה" value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} />
            <Button onClick={submitRequest} disabled={!form.subject || !form.message}>שלח בקשה</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
