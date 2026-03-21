"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Bell,
  Building2,
  Command,
  CreditCard,
  FileText,
  Home,
  Search,
  Sparkles,
  Ticket,
  Wrench,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { authFetch, getCurrentUserId, getEffectiveRole } from '../../lib/auth';
import { cn } from '../../lib/utils';

type CommandItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: typeof Home;
  roles: string[];
  keywords: string[];
  tone?: 'static' | 'live';
};

const staticCommands: CommandItem[] = [
  {
    id: 'home',
    label: 'מרכז עבודה',
    description: 'סקירה מותאמת תפקיד עם פעולות מומלצות להיום.',
    href: '/home',
    icon: Home,
    roles: ['ADMIN', 'PM', 'TECH', 'RESIDENT', 'ACCOUNTANT', 'MASTER'],
    keywords: ['home', 'dashboard', 'overview', 'סקירה', 'בית'],
  },
  {
    id: 'tickets',
    label: 'לוח קריאות',
    description: 'מעבר מהיר ללוח העבודה הראשי של הקריאות.',
    href: '/tickets',
    icon: Ticket,
    roles: ['ADMIN', 'PM', 'TECH', 'RESIDENT', 'MASTER'],
    keywords: ['tickets', 'dispatch', 'triage', 'קריאות', 'מוקד'],
  },
  {
    id: 'resident-account',
    label: 'האזור האישי',
    description: 'תשלומים, מסמכים, עדכונים והתקדמות טיפול לדייר.',
    href: '/resident/account',
    icon: CreditCard,
    roles: ['RESIDENT'],
    keywords: ['resident', 'account', 'payments', 'אזור אישי', 'תשלומים'],
  },
  {
    id: 'tech-jobs',
    label: 'משימות שטח',
    description: 'מסך העבודה של הטכנאי עם המשימות הפעילות להיום.',
    href: '/tech/jobs',
    icon: Wrench,
    roles: ['TECH'],
    keywords: ['jobs', 'tech', 'field', 'משימות', 'טכנאי'],
  },
  {
    id: 'buildings',
    label: 'בניינים',
    description: 'גישה מהירה למבנים, יחידות ופרטי קשר.',
    href: '/buildings',
    icon: Building2,
    roles: ['ADMIN', 'PM', 'MASTER'],
    keywords: ['buildings', 'portfolio', 'assets', 'בניינים'],
  },
  {
    id: 'payments',
    label: 'פיננסים ותשלומים',
    description: 'חשבוניות, גבייה, דוחות והיסטוריית חיובים.',
    href: '/payments',
    icon: CreditCard,
    roles: ['ADMIN', 'PM', 'ACCOUNTANT', 'MASTER'],
    keywords: ['payments', 'finance', 'collections', 'תשלומים', 'חשבוניות'],
  },
  {
    id: 'reports',
    label: 'דוחות פיננסיים',
    description: 'מעבר ישיר לדוחות, ייצוא ובקרת ביצועים.',
    href: '/finance/reports',
    icon: FileText,
    roles: ['ADMIN', 'PM', 'ACCOUNTANT', 'MASTER'],
    keywords: ['reports', 'finance', 'analytics', 'דוחות'],
  },
  {
    id: 'notifications',
    label: 'מרכז התראות',
    description: 'התראות חכמות עם פעולות המשך ומצב חיבור חי.',
    href: '/notifications',
    icon: Bell,
    roles: ['ADMIN', 'PM', 'TECH', 'RESIDENT', 'ACCOUNTANT', 'MASTER'],
    keywords: ['notifications', 'alerts', 'התראות'],
  },
];

export function GlobalCommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [recentTickets, setRecentTickets] = useState<Array<{ id: number; title: string; buildingName: string }>>([]);
  const [recentBuildings, setRecentBuildings] = useState<Array<{ id: number; name: string }>>([]);
  const [recentNotifications, setRecentNotifications] = useState<Array<{ id: number; title: string; type?: string | null }>>([]);
  const [loading, setLoading] = useState(false);
  const role = getEffectiveRole() || 'RESIDENT';
  const currentUserId = getCurrentUserId();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onOpenChange(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onOpenChange]);

  useEffect(() => {
    onOpenChange(false);
    setQuery('');
  }, [router.asPath]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        const ticketsPromise =
          role === 'RESIDENT'
            ? Promise.resolve(null)
            : authFetch('/api/v1/tickets?view=dispatch&limit=12');
        const buildingsPromise =
          role === 'RESIDENT' || role === 'TECH'
            ? Promise.resolve(null)
            : authFetch('/api/v1/buildings');
        const notificationsPromise = currentUserId ? authFetch(`/api/v1/notifications/user/${currentUserId}`) : Promise.resolve(null);

        const [ticketsResponse, buildingsResponse, notificationsResponse] = await Promise.all([
          ticketsPromise,
          buildingsPromise,
          notificationsPromise,
        ]);

        if (!ignore && ticketsResponse?.ok) {
          const payload = await ticketsResponse.json();
          setRecentTickets(
            (payload.items ?? []).slice(0, 6).map((ticket: any) => ({
              id: ticket.id,
              title: ticket.title,
              buildingName: ticket.building?.name ?? 'ללא בניין',
            })),
          );
        }

        if (!ignore && buildingsResponse?.ok) {
          const payload = await buildingsResponse.json();
          setRecentBuildings((Array.isArray(payload) ? payload : []).slice(0, 6).map((building: any) => ({ id: building.id, name: building.name })));
        }

        if (!ignore && notificationsResponse?.ok) {
          const payload = await notificationsResponse.json();
          setRecentNotifications(
            (Array.isArray(payload) ? payload : []).slice(0, 5).map((notification: any) => ({
              id: notification.id,
              title: notification.title,
              type: notification.type,
            })),
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [currentUserId, open, role]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredStatic = useMemo(() => {
    return staticCommands
      .filter((item) => item.roles.includes(role))
      .filter((item) => {
        if (!normalizedQuery) return true;
        return `${item.label} ${item.description} ${item.keywords.join(' ')}`.toLowerCase().includes(normalizedQuery);
      });
  }, [normalizedQuery, role]);

  const liveResults = useMemo(() => {
    const results = [
      ...recentTickets.map((ticket) => ({
        id: `ticket-${ticket.id}`,
        label: `קריאה #${ticket.id}`,
        description: `${ticket.title} · ${ticket.buildingName}`,
        href: `/tickets/${ticket.id}`,
        icon: Ticket,
      })),
      ...recentBuildings.map((building) => ({
        id: `building-${building.id}`,
        label: building.name,
        description: 'מעבר ישיר לעמוד הבניין',
        href: `/buildings/${building.id}`,
        icon: Building2,
      })),
      ...recentNotifications.map((notification) => ({
        id: `notification-${notification.id}`,
        label: notification.title,
        description: notification.type || 'התראה אישית',
        href: '/notifications',
        icon: Bell,
      })),
    ];

    return results.filter((item) => {
      if (!normalizedQuery) return true;
      return `${item.label} ${item.description}`.toLowerCase().includes(normalizedQuery);
    });
  }, [normalizedQuery, recentBuildings, recentNotifications, recentTickets]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark-surface max-w-3xl overflow-hidden border-white/10 bg-slate-950/95 text-white shadow-modal backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Command className="h-5 w-5 text-primary" />
            שכבת פיקוד חוצת-מערכת
          </DialogTitle>
          <DialogDescription className="text-white/65">
            חפש מסך, קריאה, בניין או התראה בלי לזכור איפה הם בתפריט.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="לדוגמה: קריאה 104, בניין הרצל, דוחות, התראות"
              autoFocus
              className="h-12 rounded-2xl border-white/10 bg-white/6 ps-11 text-white placeholder:text-white/35"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <section className="space-y-3 rounded-[24px] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white">ניווט מהיר</div>
                <Badge variant="gold">Cmd/Ctrl + K</Badge>
              </div>
              <div className="space-y-2">
                {filteredStatic.map((item) => (
                  <PaletteLink
                    key={item.id}
                    href={item.href}
                    label={item.label}
                    description={item.description}
                    icon={item.icon}
                    onSelect={() => onOpenChange(false)}
                  />
                ))}
              </div>
            </section>

            <section className="space-y-3 rounded-[24px] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white">תוצאות חיות</div>
                <Badge variant="outline" className="border-white/10 bg-white/5 text-white/70">
                  {loading ? 'טוען' : 'עדכני'}
                </Badge>
              </div>
              <div className="space-y-2">
                {liveResults.length ? (
                  liveResults.map((item) => (
                    <PaletteLink
                      key={item.id}
                      href={item.href}
                      label={item.label}
                      description={item.description}
                      icon={item.icon}
                      onSelect={() => onOpenChange(false)}
                      tone="live"
                    />
                  ))
                ) : (
                  <div className="rounded-[20px] border border-dashed border-white/10 bg-white/4 p-5 text-sm leading-7 text-white/55">
                    <div className="flex items-center gap-2 font-medium text-white/85">
                      <Sparkles className="h-4 w-4 text-primary" />
                      אין התאמות כרגע
                    </div>
                    <div className="mt-2">
                      נסה לחפש לפי מספר קריאה, שם בניין או סוג מסך. כשהמערכת עמוסה, זו הדרך הקצרה ביותר להגיע לפעולה הבאה.
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PaletteLink({
  href,
  label,
  description,
  icon: Icon,
  onSelect,
  tone = 'static',
}: {
  href: string;
  label: string;
  description: string;
  icon: typeof Home;
  onSelect: () => void;
  tone?: 'static' | 'live';
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className={cn(
        'flex items-start gap-3 rounded-[20px] border p-3 text-start transition duration-200 hover:-translate-y-0.5 hover:border-primary/40',
        tone === 'live' ? 'border-white/10 bg-white/8 hover:bg-white/12' : 'border-white/8 bg-black/20 hover:bg-white/8',
      )}
    >
      <div className="mt-0.5 rounded-2xl bg-primary/15 p-2 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="space-y-1">
        <div className="font-medium text-white">{label}</div>
        <div className="text-sm leading-6 text-white/60">{description}</div>
      </div>
    </Link>
  );
}
