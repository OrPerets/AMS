import { useState } from 'react';
import { authFetch } from '../../lib/auth';
import { toast } from '../../components/ui/use-toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useLocale } from '../../lib/providers';

export default function AdminNotifications() {
  const [target, setTarget] = useState<'user' | 'building' | 'all'>('user');
  const [targetId, setTargetId] = useState('');
  const [template, setTemplate] = useState('ANNOUNCEMENT');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const { t } = useLocale();

  const send = async () => {
    let url = '/api/v1/notifications';
    if (target === 'user') url += `/user/${targetId}`;
    else if (target === 'building') url += `/building/${targetId}`;
    else url += '/tenants';
    const body: any = { template, params: {} };
    if (template === 'ANNOUNCEMENT') {
      body.params = { title, message };
    }
    const res = await authFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      toast({ title: t('notification.sent') });
    } else {
      const text = await res.text();
      toast({ title: t('notification.error'), description: text });
    }
  };

  return (
    <div className="container max-w-xl p-4 space-y-4">
      <h1 className="text-2xl font-bold">{t('notification.title')}</h1>
      <div className="space-y-2">
        <Select value={target} onValueChange={(v) => setTarget(v as any)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">{t('notification.user')}</SelectItem>
            <SelectItem value="building">{t('notification.building')}</SelectItem>
            <SelectItem value="all">{t('notification.all')}</SelectItem>
          </SelectContent>
        </Select>
        {target !== 'all' && (
          <Input
            placeholder={t('notification.id')}
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
          />
        )}
        <Select value={template} onValueChange={setTemplate}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ANNOUNCEMENT">ANNOUNCEMENT</SelectItem>
            <SelectItem value="TICKET_STATUS">TICKET_STATUS</SelectItem>
          </SelectContent>
        </Select>
        {template === 'ANNOUNCEMENT' && (
          <>
            <Input
              placeholder={t('notification.titleField')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              placeholder={t('notification.messageField')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </>
        )}
        <Button onClick={send}>{t('notification.send')}</Button>
      </div>
    </div>
  );
}
