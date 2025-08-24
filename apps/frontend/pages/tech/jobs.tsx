// /Users/orperetz/Documents/AMS/apps/frontend/pages/tech/jobs.tsx
import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Calendar,
  Wrench, 
  Camera, 
  MessageSquare,
  Phone,
  Star,
  Plus,
  RefreshCw,
  Navigation
} from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { cn, formatDate, formatCurrency } from '../../lib/utils';
import { useLocale } from '../../lib/providers';
import { toast } from '../../components/ui/use-toast';

interface WorkOrder {
  id: number;
  ticket: {
    id: number;
    unitId: number;
    buildingId?: number;
    title?: string;
    description?: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
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
  LOW: { label: 'נמוך', variant: 'outline' as const, color: 'text-muted-foreground' },
  MEDIUM: { label: 'בינוני', variant: 'info' as const, color: 'text-info' },
  HIGH: { label: 'גבוה', variant: 'warning' as const, color: 'text-warning' },
};

export default function Jobs() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { locale } = useLocale();

  const loadJobs = async () => {
      try {
        const res = await authFetch('/api/v1/work-orders/today?supplierId=1');
      if (res.ok) {
        const data = await res.json();
        const mapped = Array.isArray(data)
          ? data.map((o: any) => ({ ...o, status: o.ticket.status }))
          : [];
        setOrders(mapped);
      } else {
        // Mock data for demo
        setOrders([
          {
            id: 1,
            ticket: {
              id: 1001,
              unitId: 12,
              buildingId: 1,
              title: 'דליפת מים בחדר אמבטיה',
              description: 'דליפה מתמשכת מהברז הראשי בחדר האמבטיה הראשי',
              severity: 'HIGH',
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
              severity: 'HIGH',
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
              severity: 'MEDIUM',
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
    } catch (error) {
      toast({
        title: "שגיאה בטעינת משימות",
        description: "לא ניתן לטעון את רשימת המשימות",
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
      case 'HIGH':
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

  const assignedJobs = orders.filter(o => o.status === 'ASSIGNED');
  const inProgressJobs = orders.filter(o => o.status === 'IN_PROGRESS');
  const todayStats = {
    total: orders.length,
    assigned: assignedJobs.length,
    inProgress: inProgressJobs.length,
    urgent: orders.filter(o => o.ticket.severity === 'HIGH').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">משימות היום</h1>
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
              <Card
                key={order.id}
                className={cn(
                  "transition-all duration-200 hover:shadow-md",
                  order.status === 'IN_PROGRESS' && "ring-2 ring-info/20",
                  order.ticket.severity === 'HIGH' && "ring-2 ring-destructive/20"
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
                  {/* Description */}
                  {order.ticket.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {order.ticket.description}
                    </p>
                  )}

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{order.location?.building}</span>
                    {order.location?.floor && (
                      <span className="text-muted-foreground">• קומה {order.location.floor}</span>
                    )}
                  </div>

                  {/* Resident Info */}
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

                  {/* Time and Duration */}
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

                  {/* Cost Estimate */}
                  {order.costEstimate && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">הערכת עלות:</span>
                      <span className="font-medium">{formatCurrency(order.costEstimate)}</span>
                    </div>
                  )}

                  {/* Actions */}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
