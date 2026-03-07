import { FormEvent, useState } from 'react';
import { LifeBuoy, Mail, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { toast } from '../components/ui/use-toast';

export default function SupportPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'GENERAL',
    urgency: 'MEDIUM',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setSubmitting(true);
      const response = await fetch('/api/v1/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      setForm({
        name: '',
        email: '',
        subject: '',
        category: 'GENERAL',
        urgency: 'MEDIUM',
        message: '',
      });
      toast({ title: 'הפנייה נשלחה', description: 'צוות התמיכה קיבל את הבקשה שלך.' });
    } catch {
      toast({
        title: 'שליחת הפנייה נכשלה',
        description: 'לא ניתן לשלוח את הטופס כעת.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LifeBuoy className="h-5 w-5" />
              מרכז תמיכה
            </CardTitle>
            <CardDescription>שליחת פנייה ישירות למנהלי המערכת עם קטגוריה ודחיפות.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">שם מלא</Label>
                  <Input id="name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">אימייל</Label>
                  <Input id="email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">נושא</Label>
                <Input id="subject" value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} required />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>קטגוריה</Label>
                  <Select value={form.category} onValueChange={(value) => setForm((current) => ({ ...current, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GENERAL">שאלה כללית</SelectItem>
                      <SelectItem value="BILLING">חיוב ותשלומים</SelectItem>
                      <SelectItem value="ACCESS">הרשאות וגישה</SelectItem>
                      <SelectItem value="BUG">תקלה במערכת</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>דחיפות</Label>
                  <Select value={form.urgency} onValueChange={(value) => setForm((current) => ({ ...current, urgency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">נמוכה</SelectItem>
                      <SelectItem value="MEDIUM">בינונית</SelectItem>
                      <SelectItem value="HIGH">גבוהה</SelectItem>
                      <SelectItem value="URGENT">דחופה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">פירוט</Label>
                <Textarea
                  id="message"
                  rows={6}
                  value={form.message}
                  onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                  required
                />
              </div>
              <Button type="submit" disabled={submitting}>
                <Send className="me-2 h-4 w-4" />
                שלח פנייה
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              זמינות צוות
            </CardTitle>
            <CardDescription>מה קורה אחרי שליחת הטופס.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>פניות נשמרות כהתראות למנהלי המערכת כדי שלא ילכו לאיבוד גם אם תיבת מייל חיצונית לא זמינה.</p>
            <p>בקשות דחופות נשלחות עם סימון `URGENT` ונראות מיד במסכי הניהול.</p>
            <p>לנושאי הרשאות, ציין במפורש את כתובת האימייל והתפקיד המבוקש.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
