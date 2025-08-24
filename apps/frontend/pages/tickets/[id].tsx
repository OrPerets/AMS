import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { authFetch } from '../../lib/auth';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { getStatusLabel } from '../../lib/utils';
import { toast } from '../../components/ui/use-toast';

interface Ticket {
  id: number;
  unitId: number;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description?: string;
  photos: string[];
}

export default function TicketDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [ticket, setTicket] = useState<Ticket | null>(null);

  const load = async () => {
    if (!id) return;
    const res = await authFetch(`/api/v1/tickets/${id}`);
    if (res.ok) setTicket(await res.json());
  };

  useEffect(() => {
    load();
  }, [id]);

  const updateStatus = async (status: string) => {
    try {
      await authFetch(`/api/v1/tickets/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      toast({ title: 'סטטוס עודכן' });
      load();
    } catch (e: any) {
      toast({ title: 'שגיאה', description: e?.message || 'נסו שוב', variant: 'destructive' });
    }
  };

  const assignToMe = async () => {
    try {
      await authFetch(`/api/v1/tickets/${id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeId: 1 }),
      });
      toast({ title: 'הקריאה הוקצתה' });
      load();
    } catch (e: any) {
      toast({ title: 'שגיאה', description: e?.message || 'נסו שוב', variant: 'destructive' });
    }
  };

  if (!ticket) return <div>טוען...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">קריאה #{ticket.id}</h1>
      <p>{ticket.description}</p>
      <div>סטטוס נוכחי: {getStatusLabel(ticket.status)}</div>
      <div className="flex items-center gap-2">
        <Select value={ticket.status} onValueChange={updateStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OPEN">פתוח</SelectItem>
            <SelectItem value="ASSIGNED">הוקצה</SelectItem>
            <SelectItem value="IN_PROGRESS">בתהליך</SelectItem>
            <SelectItem value="RESOLVED">נפתרה</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={assignToMe}>הקצה לי</Button>
      </div>
      {ticket.photos?.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {ticket.photos.map((p) => (
            <img key={p} src={p} alt="photo" className="rounded" />
          ))}
        </div>
      )}
    </div>
  );
}
