// /Users/orperetz/Documents/AMS/apps/frontend/pages/tech/jobs.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Calendar,
  Wrench, 
  Camera, 
  Phone,
  Plus,
  RefreshCw,
  Navigation,
  Leaf,
  ShieldCheck,
  ClipboardList,
} from 'lucide-react';
import { authFetch, getCurrentUserId } from '../../lib/auth';
import { Button } from '../../components/ui/button';
import { CompactStatusStrip } from '../../components/ui/compact-status-strip';
import { PrimaryActionCard } from '../../components/ui/primary-action-card';
import { MobilePriorityInbox } from '../../components/ui/mobile-priority-inbox';
import { MobileActionHub } from '../../components/ui/mobile-action-hub';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { MobileSwipeActionCard } from '../../components/ui/mobile-swipe-action-card';
import { Skeleton } from '../../components/ui/skeleton';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { cn, formatDate, formatCurrency } from '../../lib/utils';
import { useLocale } from '../../lib/providers';
import { getRouteTransitionTokensByKey } from '../../lib/route-transition-contract';
import { toast } from '../../components/ui/use-toast';
import { MOTION_DISTANCE, MOTION_DURATION, MOTION_EASE } from '../../lib/motion-tokens';

interface WorkOrder {
  id: number;
  ticket: {
    id: number;
    unitId: number;
    buildingId?: number;
    title?: string;
    description?: string;
    severity: 'NORMAL' | 'HIGH' | 'URGENT';
    status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
    residentName?: string;
    residentPhone?: string;
    category?: string;
  };
  costEstimate: number | null;
  estimatedDuration?: number; // in minutes
  assignedAt?: string;
  dueTime?: string;
  location?: {
    building: string;
    address: string;
    floor?: number;
  };
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
}

const severityConfig = {
  NORMAL: { label: 'רגילה', variant: 'outline' as const, color: 'text-muted-foreground' },
  HIGH: { label: 'דחופה', variant: 'warning' as const, color: 'text-warning' },
  URGENT: { label: 'בהולה', variant: 'destructive' as const, color: 'text-destructive' },
};

export default function Jobs() {
  const router = useRouter();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [updatedOrderIds, setUpdatedOrderIds] = useState<Set<number>>(new Set());
  const { locale } = useLocale();
  const reducedMotion = useReducedMotion();
  const transitionTokens = getRouteTransitionTokensByKey('jobs');
  const containerLayoutId = reducedMotion ? undefined : transitionTokens.container;
  const headerLayoutId = reducedMotion ? undefined : transitionTokens.header;
  const iconLayoutId = reducedMotion ? undefined : transitionTokens.icon;
  const badgeLayoutId = reducedMotion ? undefined : transitionTokens.badge;
  const titleLayoutId = reducedMotion ? undefined : transitionTokens.title;
  const lastOrderSignaturesRef = useRef<Map<number, string>>(new Map());
  const rowHighlightTimeoutRef = useRef<number | null>(null);

  const commitOrders = (nextOrders: WorkOrder[]) => {
    const nextSignatures = new Map<number, string>();
    const changedIds: number[] = [];
    nextOrders.forEach((order) => {
      const signature = [
        order.status,
        order.ticket.status,
        order.ticket.severity,
        order.ticket.title ?? '',
        order.dueTime ?? '',
        order.assignedAt ?? '',
        order.costEstimate ?? '',
      ].join('|');
      nextSignatures.set(order.id, signature);
      const previousSignature = lastOrderSignaturesRef.current.get(order.id);
      if (previousSignature && previousSignature !== signature) {
        changedIds.push(order.id);
      }
    });
    lastOrderSignaturesRef.current = nextSignatures;
    setOrders(nextOrders);
    setLastSyncedAt(Date.now());
    if (rowHighlightTimeoutRef.current) {
      window.clearTimeout(rowHighlightTimeoutRef.current);
    }
    setUpdatedOrderIds(new Set(changedIds));
    rowHighlightTimeoutRef.current = window.setTimeout(() => setUpdatedOrderIds(new Set()), 2200);
  };

  const loadJobs = async () => {
      setError(null);
      if (!orders.length) {
        setLoading(true);
      }

      try {
        const currentUserId = getCurrentUserId();
        // Work orders are assigned to technicians via the ticket assignee, not a fixed supplier id.
        const res = await authFetch('/api/v1/work-orders');
      if (res.ok) {
        const data = await res.json();
        const mapped = Array.isArray(data)
          ? data
              .filter((o: any) => {
                if (!currentUserId) return true;
                return o?.ticket?.assignedToId === currentUserId;
              })
              .map((o: any) => ({ ...o, status: o.ticket.status }))
          : [];
        commitOrders(mapped);
      } else {
        // Mock data for demo
        commitOrders([
          {
            id: 1,
            ticket: {
              id: 1001,
              unitId: 12,
              buildingId: 1,
              title: 'דליפת מים בחדר אמבטיה',
              description: 'דליפה מתמשכת מהברז הראשי בחדר האמבטיה הראשי',
              severity: 'URGENT',
              status: 'ASSIGNED',
              residentName: 'דניאל לוי',
              residentPhone: '050-1234567',
              category: 'אינסטלציה'
            },
            costEstimate: 250,
            estimatedDuration: 90,
            assignedAt: '2024-01-15T08:00:00Z',
            dueTime: '2024-01-15T12:00:00Z',
            location: {
              building: 'רחוב הרצל 15',
              address: 'תל אביב',
              floor: 3
            },
            status: 'ASSIGNED'
          },
          {
            id: 2,
            ticket: {
              id: 1002,
              unitId: 25,
              buildingId: 1,
              title: 'תיקון מעלית',
              description: 'המעלית תקועה בקומה השנייה ולא מגיבה',
              severity: 'URGENT',
              status: 'IN_PROGRESS',
              residentName: 'משה דוד',
              residentPhone: '052-9876543',
              category: 'מעלית'
            },
            costEstimate: null,
            estimatedDuration: 120,
            assignedAt: '2024-01-15T09:30:00Z',
            dueTime: '2024-01-15T14:00:00Z',
            location: {
              building: 'רחוב בן גוריון 22',
              address: 'תל אביב',
              floor: 2
            },
            status: 'IN_PROGRESS'
          },
          {
            id: 3,
            ticket: {
              id: 1004,
              unitId: 8,
              buildingId: 2,
              title: 'תיקון דלת כניסה',
              description: 'המנעול לא פועל כראוי',
              severity: 'HIGH',
              status: 'ASSIGNED',
              residentName: 'שרה אברהם',
              residentPhone: '054-5555444',
              category: 'נגרות'
            },
            costEstimate: 180,
            estimatedDuration: 60,
            assignedAt: '2024-01-15T10:15:00Z',
            dueTime: '2024-01-15T16:00:00Z',
            location: {
              building: 'רחוב דיזנגוף 45',
              address: 'תל אביב',
              floor: 1
            },
            status: 'ASSIGNED'
          }
        ]);
      }
    } catch (error: any) {
      const message = error?.message || "לא ניתן לטעון את רשימת המשימות";
      setError(message);
      toast({
        title: "שגיאה בטעינת משימות",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    return () => {
      if (rowHighlightTimeoutRef.current) {
        window.clearTimeout(rowHighlightTimeoutRef.current);
      }
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadJobs();
  };

  const markInProgress = async (orderId: number) => {
    try {
      await authFetch(`/api/v1/work-orders/${orderId}/start`, { method: 'PATCH' });
      setOrders(prev => prev.map(order =>
        order.id === orderId
          ? { ...order, status: 'IN_PROGRESS' as const, ticket: { ...order.ticket, status: 'IN_PROGRESS' as const } }
          : order
      ));
      toast({ title: "משימה הוחלה", description: "המשימה סומנה כבתהליך", variant: "success" });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את סטטוס המשימה",
        variant: "destructive",
      });
    }
  };

  const markCompleted = async (orderId: number) => {
    try {
      await authFetch(`/api/v1/work-orders/${orderId}/complete`, { method: 'PATCH' });
      setOrders(prev => prev.filter(order => order.id !== orderId));
      toast({ title: "משימה הושלמה!", description: "המשימה סומנה כהושלמה בהצלחה", variant: "success" });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לסמן את המשימה כהושלמה",
        variant: "destructive",
      });
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'URGENT':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Wrench className="h-4 w-4" />;
    }
  };

  const getTimeRemaining = (dueTime?: string) => {
    if (!dueTime) return null;
    
    const due = new Date(dueTime);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffMs < 0) return 'פג תוקף';
    if (diffHours === 0) return `${diffMinutes} דקות`;
    return `${diffHours}:${diffMinutes.toString().padStart(2, '0')} שעות`;
  };

  const assignedJobs = orders.filter(o => o.status === 'ASSIGNED');
  const inProgressJobs = orders.filter(o => o.status === 'IN_PROGRESS');
  const todayStats = {
    total: orders.length,
    assigned: assignedJobs.length,
    inProgress: inProgressJobs.length,
    urgent: orders.filter(o => o.ticket.severity === 'URGENT').length
  };
  const nextJob = useMemo(() => orders.slice().sort((left, right) => {
    const leftRank = left.ticket.severity === 'URGENT' ? 3 : left.ticket.severity === 'HIGH' ? 2 : 1;
    const rightRank = right.ticket.severity === 'URGENT' ? 3 : right.ticket.severity === 'HIGH' ? 2 : 1;
    return rightRank - leftRank;
  })[0], [orders]);
  const queueItems = useMemo(() => orders.slice(0, 4).map((order) => ({
    id: `job-${order.id}`,
    status: order.ticket.severity === 'URGENT' ? 'דחוף' : order.ticket.severity === 'HIGH' ? 'גבוה' : 'רגיל',
    tone: order.ticket.severity === 'URGENT' ? 'danger' as const : order.ticket.severity === 'HIGH' ? 'warning' as const : 'active' as const,
    title: `#${order.ticket.id} ${order.ticket.title || 'משימת שטח'}`,
    reason: `${order.location?.building || 'בניין'}${order.location?.floor ? ` · קומה ${order.location.floor}` : ''} · ${getTimeRemaining(order.dueTime) || 'ללא SLA'}`,
    meta: order.status === 'IN_PROGRESS' ? 'בתהליך' : 'מוכן להתחלה',
    href: `/work-orders/${order.id}`,
    ctaLabel: 'פתח',
  })), [orders]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !orders.length) {
    return (
      <InlineErrorPanel
        title="משימות היום לא נטענו"
        description={error}
        onRetry={() => void loadJobs()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <InlineErrorPanel
          className="mb-2"
          title="חלק מהנתונים לא נטענו"
          description={error}
          onRetry={() => void loadJobs()}
        />
      ) : null}
      <motion.div
        layoutId={containerLayoutId}
        initial={reducedMotion ? undefined : { borderRadius: 24 }}
        animate={reducedMotion ? undefined : { borderRadius: 24 }}
        className="space-y-3 md:hidden"
      >
        <motion.div layoutId={headerLayoutId} className="flex items-center justify-between rounded-2xl border border-subtle-border bg-background/76 px-3 py-2">
          <motion.span
            layoutId={iconLayoutId}
            initial={reducedMotion ? { opacity: 0.94 } : false}
            animate={reducedMotion ? { opacity: 1 } : undefined}
            transition={reducedMotion ? { duration: 0.2, ease: 'easeOut' } : undefined}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-primary/16 bg-primary/10 text-primary"
          >
            <Wrench className="h-4 w-4" strokeWidth={1.85} />
          </motion.span>
          <motion.span
            layoutId={badgeLayoutId}
            initial={reducedMotion ? { opacity: 0.92 } : false}
            animate={reducedMotion ? { opacity: 1 } : undefined}
            transition={reducedMotion ? { duration: 0.2, ease: 'easeOut' } : undefined}
            className="rounded-full border border-primary/16 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
          >
            {todayStats.total} משימות
          </motion.span>
        </motion.div>
        <CompactStatusStrip
          roleLabel="טכנאי"
          lastSyncedAt={lastSyncedAt}
          metrics={[
            { id: 'jobs', label: 'משימות', value: todayStats.total, tone: todayStats.total > 0 ? 'warning' : 'success' },
            { id: 'urgent', label: 'דחוף', value: todayStats.urgent, tone: todayStats.urgent > 0 ? 'danger' : 'success' },
          ]}
        />

        <PrimaryActionCard
          eyebrow="Next Job"
          title={
            <motion.span
              layoutId={titleLayoutId}
              initial={reducedMotion ? { opacity: 0.94 } : false}
              animate={reducedMotion ? { opacity: 1 } : undefined}
              transition={reducedMotion ? { duration: 0.2, ease: 'easeOut' } : undefined}
              className="inline-block"
            >
              משימות היום
            </motion.span>
          }
          description={
            nextJob
              ? `${nextJob.ticket.title || 'משימה לשטח'} · ${nextJob.location?.building || 'בניין'}${nextJob.location?.floor ? ` · קומה ${nextJob.location.floor}` : ''} · ${getTimeRemaining(nextJob.dueTime) || 'ללא SLA'}`
              : 'תור העבודות פתוח עבורך. אפשר לעדכן סטטוס, לעבור לגינון או לרענן שוב בהמשך.'
          }
          ctaLabel="התחל טיפול"
          href={nextJob ? `/work-orders/${nextJob.id}` : '/tech/jobs'}
          tone={todayStats.urgent > 0 ? 'danger' : 'warning'}
          density="compact"
          supportingContent={
            <div className="grid grid-cols-3 gap-2">
              <TechPulseTile label="ETA" value={nextJob ? (getTimeRemaining(nextJob.dueTime) || 'בתור') : 'חופשי'} tone={todayStats.urgent > 0 ? 'warning' : 'default'} />
              <TechPulseTile label="Kit" value={nextJob?.ticket.category || 'כללי'} tone="default" />
              <TechPulseTile label="Next" value={nextJob ? 'יציאה לשטח' : 'המתן לשיוך'} tone={nextJob ? 'success' : 'default'} />
            </div>
          }
          secondaryAction={
            <Button asChild size="sm" variant="outline" className="w-full justify-between">
              <Link href="/tickets?mine=true">עדכן סטטוס</Link>
            </Button>
          }
        />

        <motion.div
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: MOTION_DISTANCE.xs }}
          animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ delay: reducedMotion ? 0 : 0.14, duration: MOTION_DURATION.moderate, ease: MOTION_EASE.emphasized }}
          className="space-y-3"
        >
          {todayStats.urgent > 0 ? (
            <TechAlertRail
              urgentCount={todayStats.urgent}
              overdueCount={orders.filter((order) => getTimeRemaining(order.dueTime) === 'פג תוקף').length}
            />
          ) : null}

          <MobilePriorityInbox
            title="תור העבודות להיום"
            subtitle="המשימה הבאה מופיעה ראשונה כדי להיכנס ישר לעבודה."
            items={queueItems}
            emptyTitle="אין משימות שטח להיום"
            emptyDescription="יום שקט. אפשר לעבור לתוכנית הגינון או לרענן שוב בהמשך."
            compact
            maxItems={2}
          />

          <GlassRouteReadinessCard
            nextJob={nextJob}
            todayStats={todayStats}
          />

          <MobileActionHub
            mobileHomeEffect
            title="כלי שטח"
            subtitle="פעולה מהירה בלי לאבד את התור."
            density="compact"
            items={[
            {
              id: 'jobs',
              label: 'עבודות',
              description: 'התור הפעיל שלי',
              icon: Wrench,
              href: '/tech/jobs',
              badge: todayStats.total,
              accent: todayStats.total > 0 ? 'warning' : 'success',
              selected: true,
            },
            {
              id: 'supervision',
              label: 'דוח פיקוח',
              description: 'בקרה וסיכום שטח',
              icon: ShieldCheck,
              href: '/supervision-report',
              accent: todayStats.urgent > 0 ? 'warning' : 'primary',
            },
            {
              id: 'gardens',
              label: 'גינון',
              description: 'תכנון וביצוע חודשי',
              icon: Leaf,
              href: '/gardens',
              accent: 'neutral',
            },
            {
              id: 'status',
              label: 'עדכון סטטוס',
              description: 'קריאות שלי בלבד',
              icon: ClipboardList,
              href: '/tickets?mine=true',
              accent: 'info',
            },
            ]}
          />
        </motion.div>
      </motion.div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">כלי שטח</h1>
          <p className="text-muted-foreground">
            ניהול וביצוע משימות טכנאי
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
          <Button>
            <Plus className="me-2 h-4 w-4" />
            דווח בעיה
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה״כ משימות</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ממתינות לביצוע</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.assigned}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">בביצוע</CardTitle>
            <RefreshCw className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">דחופות</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.urgent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle className="h-16 w-16 text-success mb-4" />
            <h3 className="text-lg font-semibold mb-2">כל המשימות הושלמו!</h3>
            <p className="text-muted-foreground text-center">
              אין משימות חדשות ליום זה. עבודה מצוינת!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => {
            const severity = severityConfig[order.ticket.severity];
            const timeRemaining = getTimeRemaining(order.dueTime);
            const isOverdue = timeRemaining === 'פג תוקף';

            return (
              <MobileSwipeActionCard
                key={order.id}
                actions={[
                  {
                    id: `job-open-${order.id}`,
                    label: 'פתח משימה',
                    tone: 'primary',
                    side: 'start',
                    onCommit: () => void router.push(`/work-orders/${order.id}`),
                  },
                  {
                    id: `job-advance-${order.id}`,
                    label: order.status === 'ASSIGNED' ? 'התחל עבודה' : 'סיים משימה',
                    tone: order.status === 'ASSIGNED' ? 'warning' : 'success',
                    side: 'end',
                    onCommit: () => (order.status === 'ASSIGNED' ? markInProgress(order.id) : markCompleted(order.id)),
                  },
                ]}
                className="rounded-[inherit]"
              >
                <Card
                  className={cn(
                    "transition-all duration-200 hover:shadow-md",
                    order.status === 'IN_PROGRESS' && "ring-2 ring-info/20",
                    order.ticket.severity === 'URGENT' && "ring-2 ring-destructive/20",
                    updatedOrderIds.has(order.id) && (reducedMotion ? "ring-2 ring-primary/25" : "ring-2 ring-primary/25 animate-[pulse_1.2s_ease-out_1]")
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={severity.variant} className="text-xs">
                            {getSeverityIcon(order.ticket.severity)}
                            <span className="ms-1">{severity.label}</span>
                          </Badge>
                          {updatedOrderIds.has(order.id) && (
                            <Badge variant="outline" className="text-[10px] text-primary">
                              עודכן
                            </Badge>
                          )}
                          {order.status === 'IN_PROGRESS' && (
                            <Badge variant="info" className="text-xs">בביצוע</Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg leading-tight">
                          {order.ticket.title || 'משימה ללא כותרת'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          קריאה #{order.ticket.id} • יחידה {order.ticket.unitId}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {order.ticket.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {order.ticket.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{order.location?.building}</span>
                      {order.location?.floor && (
                        <span className="text-muted-foreground">• קומה {order.location.floor}</span>
                      )}
                    </div>

                    {order.ticket.residentName && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span>{order.ticket.residentName}</span>
                          {order.ticket.residentPhone && (
                            <Button variant="ghost" size="sm" className="h-6 px-2">
                              <Phone className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{order.estimatedDuration ? `${order.estimatedDuration} דקות` : 'לא צוין'}</span>
                      </div>
                      {timeRemaining && (
                        <div className={cn(
                          "flex items-center gap-1",
                          isOverdue ? "text-destructive" : "text-muted-foreground"
                        )}>
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">{timeRemaining}</span>
                        </div>
                      )}
                    </div>

                    {order.costEstimate && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">הערכת עלות:</span>
                        <span className="font-medium">{formatCurrency(order.costEstimate)}</span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      {order.status === 'ASSIGNED' ? (
                        <Button
                          onClick={() => markInProgress(order.id)}
                          className="flex-1"
                          size="sm"
                        >
                          התחל עבודה
                        </Button>
                      ) : (
                        <Button
                          onClick={() => markCompleted(order.id)}
                          variant="success"
                          className="flex-1"
                          size="sm"
                        >
                          <CheckCircle className="me-1 h-4 w-4" />
                          סיים משימה
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Navigation className="h-4 w-4" />
                      </Button>

                      <Button variant="outline" size="sm">
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </MobileSwipeActionCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TechAlertRail({
  urgentCount,
  overdueCount,
}: {
  urgentCount: number;
  overdueCount: number;
}) {
  return (
    <div className="rounded-[20px] border border-destructive/18 bg-[linear-gradient(180deg,rgba(255,244,242,0.98)_0%,rgba(255,255,255,0.94)_100%)] px-3.5 py-3 shadow-[0_12px_28px_rgba(170,43,28,0.08)]">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1 text-right">
          <div className="text-sm font-semibold text-foreground">מוקד חריגות אחד למסך</div>
          <div className="mt-0.5 text-[12px] leading-5 text-secondary-foreground">
            {urgentCount} משימות דחופות{overdueCount ? ` · ${overdueCount} חרגו מזמן היעד` : ''}. פתח את הפריט הראשון והמשך משם.
          </div>
        </div>
      </div>
    </div>
  );
}

function TechPulseTile({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'warning' | 'success';
}) {
  return (
    <div
      className={cn(
        'rounded-[16px] border px-2.5 py-2 text-right',
        tone === 'warning'
          ? 'border-warning/18 bg-warning/8'
          : tone === 'success'
            ? 'border-success/18 bg-success/8'
            : 'border-subtle-border bg-background/72',
      )}
    >
      <div className="text-[10px] font-semibold text-secondary-foreground">{label}</div>
      <div className="mt-1 truncate text-[12px] font-semibold text-foreground">{value}</div>
    </div>
  );
}

function GlassRouteReadinessCard({
  nextJob,
  todayStats,
}: {
  nextJob: WorkOrder | undefined;
  todayStats: { total: number; assigned: number; inProgress: number; urgent: number };
}) {
  return (
    <Card className="rounded-[22px] border border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(248,244,236,0.92)_100%)] shadow-[0_14px_30px_rgba(44,28,9,0.06)]">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 text-right">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary-foreground">Route readiness</div>
            <div className="mt-1 text-[16px] font-semibold text-foreground">
              {nextJob ? nextJob.location?.building || 'היעד הבא מוכן' : 'אין יציאה מיידית לשטח'}
            </div>
            <div className="mt-1 text-[12px] leading-5 text-secondary-foreground">
              {nextJob
                ? `${nextJob.ticket.category || 'משימת שירות'} · ${nextJob.estimatedDuration ? `${nextJob.estimatedDuration} דקות` : 'משך לא צוין'}`
                : 'אפשר לעדכן סטטוס, לרענן שוב או לעבור למסלולים משלימים.'}
            </div>
          </div>
          <span className="rounded-full border border-primary/14 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
            {todayStats.inProgress ? `${todayStats.inProgress} בביצוע` : `${todayStats.assigned} ממתינות`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
