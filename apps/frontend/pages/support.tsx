import { FormEvent, useState } from 'react';
import { LifeBuoy, Mail, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { toast } from '../components/ui/use-toast';
import { useLocale } from '../lib/providers';

export default function SupportPage() {
  const { t } = useLocale();
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
      toast({ title: t('support.sentTitle'), description: t('support.sentDescription') });
    } catch {
      toast({
        title: t('support.failedTitle'),
        description: t('support.failedDescription'),
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
              {t('support.title')}
            </CardTitle>
            <CardDescription>{t('support.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('support.name')}</Label>
                  <Input id="name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('support.email')}</Label>
                  <Input id="email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">{t('support.subject')}</Label>
                <Input id="subject" value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} required />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('support.category')}</Label>
                  <Select value={form.category} onValueChange={(value) => setForm((current) => ({ ...current, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GENERAL">{t('support.category.general')}</SelectItem>
                      <SelectItem value="BILLING">{t('support.category.billing')}</SelectItem>
                      <SelectItem value="ACCESS">{t('support.category.access')}</SelectItem>
                      <SelectItem value="BUG">{t('support.category.bug')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('support.urgency')}</Label>
                  <Select value={form.urgency} onValueChange={(value) => setForm((current) => ({ ...current, urgency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">{t('support.urgency.low')}</SelectItem>
                      <SelectItem value="MEDIUM">{t('support.urgency.medium')}</SelectItem>
                      <SelectItem value="HIGH">{t('support.urgency.high')}</SelectItem>
                      <SelectItem value="URGENT">{t('support.urgency.urgent')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">{t('support.message')}</Label>
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
                {submitting ? t('support.submitting') : t('support.submit')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {t('support.teamAvailability')}
            </CardTitle>
            <CardDescription>{t('support.teamAvailabilityDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>{t('support.detail.one')}</p>
            <p>{t('support.detail.two')}</p>
            <p>{t('support.detail.three')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
