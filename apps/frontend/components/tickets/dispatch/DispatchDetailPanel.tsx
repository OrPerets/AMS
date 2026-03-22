import { useRef, type TouchEvent } from 'react';
import Link from 'next/link';
import { Camera, Eye, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import type { DispatchTicket } from './types';
import { DetailMetric, SlaBadge, TicketSeverityBadge, TicketStatusBadge } from './presentation';
import { formatDate } from '../../../lib/utils';
import { triggerHaptic } from '../../../lib/mobile';

export function DispatchDetailPanel({
  ticket,
  canNavigatePrevious = false,
  canNavigateNext = false,
  onNavigatePrevious,
  onNavigateNext,
}: {
  ticket: DispatchTicket | null;
  canNavigatePrevious?: boolean;
  canNavigateNext?: boolean;
  onNavigatePrevious?: () => void;
  onNavigateNext?: () => void;
}) {
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef(0);
  const swipeLockedRef = useRef(false);

  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
    touchDeltaXRef.current = 0;
    swipeLockedRef.current = false;
  };

  const handleTouchMove = (event: TouchEvent<HTMLElement>) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) {
      return;
    }

    const deltaX = event.touches[0].clientX - touchStartXRef.current;
    const deltaY = event.touches[0].clientY - touchStartYRef.current;

    if (!swipeLockedRef.current) {
      if (Math.abs(deltaY) > Math.abs(deltaX) || Math.abs(deltaX) < 18) {
        return;
      }

      swipeLockedRef.current = true;
    }

    touchDeltaXRef.current = deltaX;
  };

  const handleTouchEnd = () => {
    if (!swipeLockedRef.current) {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      touchDeltaXRef.current = 0;
      return;
    }

    if (Math.abs(touchDeltaXRef.current) < 72) {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      touchDeltaXRef.current = 0;
      swipeLockedRef.current = false;
      return;
    }

    if (touchDeltaXRef.current < 0 && canNavigateNext) {
      onNavigateNext?.();
      triggerHaptic('light');
    } else if (touchDeltaXRef.current > 0 && canNavigatePrevious) {
      onNavigatePrevious?.();
      triggerHaptic('light');
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchDeltaXRef.current = 0;
    swipeLockedRef.current = false;
  };

  return (
    <Card
      className="rounded-[28px] border-slate-200"
      style={{ touchAction: 'pan-y' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>פרטי קריאה</CardTitle>
            <CardDescription>תמונות, ציר זמן, SLA ותיעוד מלא של מצב הקריאה שנבחרה.</CardDescription>
          </div>
          {ticket ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/tickets/${ticket.id}`}>
                <Eye className="me-2 h-4 w-4" />
                עמוד מלא
              </Link>
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent>
        {ticket ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-3 text-xs font-medium text-slate-500 lg:hidden">
              החלק ימינה או שמאלה כדי לעבור לקריאה הקודמת או הבאה בלי לחזור לרשימה.
            </div>
            <section className="rounded-[22px] border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/60 p-4 sm:rounded-[26px] sm:p-5">
              <div className="flex flex-col gap-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">#{ticket.id}</span>
                    <TicketSeverityBadge severity={ticket.severity} />
                    <TicketStatusBadge status={ticket.status} />
                    <SlaBadge state={ticket.slaState} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black leading-tight text-slate-950 sm:text-2xl">{ticket.title}</h2>
                    <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-slate-600">{ticket.description}</p>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <DetailMetric label="בניין" value={ticket.building.name} />
                  <DetailMetric label="יחידה" value={ticket.unit.number} />
                  <DetailMetric label="קטגוריה" value={ticket.category} />
                  <DetailMetric label="מטפל" value={ticket.assignedTo?.email || 'לא הוקצה'} />
                  <DetailMetric label="נפתח" value={formatDate(ticket.createdAt)} />
                  <DetailMetric label="SLA" value={ticket.slaDue ? formatDate(ticket.slaDue) : 'לא הוגדר'} />
                </div>
              </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
              <Card className="rounded-[24px] border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">תמונות וראיות</CardTitle>
                  <CardDescription>גישה מהירה לקבצים שצורפו לקריאה.</CardDescription>
                </CardHeader>
                <CardContent>
                  {ticket.photos.length ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {ticket.photos.map((photo, index) => (
                        <a
                          key={`${photo}-${index}`}
                          href={photo}
                          target="_blank"
                          rel="noreferrer"
                          className="group relative block overflow-hidden rounded-[18px] border border-slate-200 bg-slate-50"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo} alt={`Ticket photo ${index + 1}`} className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                            <Eye className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[18px] border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                      <Camera className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                      <p className="text-sm text-slate-500">אין תמונות מצורפות לקריאה זו.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[24px] border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">ציר זמן ועדכונים</CardTitle>
                  <CardDescription>תיעוד מלא של התקדמות הקריאה, הערות ותקשורת.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative space-y-0">
                    {ticket.comments.length > 1 ? <div className="absolute bottom-4 start-5 top-4 w-px bg-slate-200" /> : null}
                    {ticket.comments.length ? (
                      ticket.comments.map((comment) => (
                        <div key={comment.id} className="relative pb-4 ps-12 last:pb-0">
                          <div className="absolute start-3 top-4 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-slate-300">
                            <span className="h-2 w-2 rounded-full bg-slate-500" />
                          </div>
                          <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[11px]">
                                  {comment.role || 'USER'}
                                </Badge>
                                <span className="text-sm font-medium text-slate-800">{comment.author}</span>
                              </div>
                              <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleString('he-IL')}</span>
                            </div>
                            <p className="mt-2.5 whitespace-pre-wrap text-sm leading-7 text-slate-600">{comment.content}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[18px] border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                        <MessageSquare className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                        <p className="text-sm text-slate-500">אין עדכונים עדיין. הוסף את הראשון מפאנל הפעולות.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        ) : (
          <div className="rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Eye className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-lg font-bold text-slate-950">בחר קריאה מהרשימה</p>
            <p className="mt-2 text-sm text-slate-500">כאן יוצגו פרטים, פעולות ועדכונים בזמן אמת על הקריאה שבחרת.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
