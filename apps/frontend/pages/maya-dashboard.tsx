import React, { useEffect, useState } from 'react';
import { 
  Ticket, 
  AlertTriangle, 
  Clock, 
  Bell,
  RefreshCw,
  Building,
  User,
  Phone,
  MessageSquare,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react';
import { authFetch, getAccessToken } from '../lib/auth';
import { websocketService } from '../lib/websocket';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { useLocale } from '../lib/providers';
import { cn, formatNumber } from '../lib/utils';
import { toast } from '../components/ui/use-toast';

interface Ticket {
  id: number;
  unitId: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  slaDue?: string;
  assignedTo?: {
    id: number;
    email: string;
  };
  unit: {
    number: string;
    building: {
      name: string;
    };
  };
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  read: boolean;
}

interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedToday: number;
  slaBreaches: number;
}

export default function MayaDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedToday: 0,
    slaBreaches: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { t } = useLocale();

  // Real-time polling interval
  const POLL_INTERVAL = 3000; // 3 seconds

  const loadDashboardData = async () => {
    try {
      const [ticketsRes, notificationsRes] = await Promise.all([
        authFetch('/api/v1/tickets'),
        authFetch('/api/v1/notifications/user/1') // TODO: Get actual Maya's user ID
      ]);

      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json();
        setTickets(ticketsData);
        
        // Calculate stats
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const stats = {
          totalTickets: ticketsData.length,
          openTickets: ticketsData.filter((t: Ticket) => t.status === 'OPEN').length,
          inProgressTickets: ticketsData.filter((t: Ticket) => t.status === 'IN_PROGRESS').length,
          resolvedToday: ticketsData.filter((t: Ticket) => {
            const ticketDate = new Date(t.createdAt);
            return t.status === 'RESOLVED' && ticketDate >= today;
          }).length,
          slaBreaches: ticketsData.filter((t: Ticket) => {
            if (!t.slaDue) return false;
            return new Date(t.slaDue) < now && t.status !== 'RESOLVED';
          }).length
        };
        
        setStats(stats);
      }

      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        setNotifications(notificationsData.slice(0, 10)); // Show latest 10
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "שגיאה בטעינת נתונים",
        description: "לא ניתן לטעון את נתוני הדשבורד",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'secondary';
      default: return 'secondary';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'גבוה';
      case 'MEDIUM': return 'בינוני';
      case 'LOW': return 'נמוך';
      default: return severity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'destructive';
      case 'ASSIGNED': return 'warning';
      case 'IN_PROGRESS': return 'default';
      case 'RESOLVED': return 'success';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN': return 'פתוח';
      case 'ASSIGNED': return 'מוקצה';
      case 'IN_PROGRESS': return 'בתהליך';
      case 'RESOLVED': return 'הושלם';
      default: return status;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime())) / (1000 * 60);
    
    if (diffInMinutes < 1) return 'עכשיו';
    if (diffInMinutes < 60) return `לפני ${Math.floor(diffInMinutes)} דקות`;
    if (diffInMinutes < 1440) return `לפני ${Math.floor(diffInMinutes / 60)} שעות`;
    return `לפני ${Math.floor(diffInMinutes / 1440)} ימים`;
  };

  useEffect(() => {
    loadDashboardData();
    
    // Connect to WebSocket for real-time updates
    const token = getAccessToken();
    if (token) {
      websocketService.connect(token);
      
      // Listen for new tickets
      websocketService.on('new_ticket', (data: any) => {
        toast({
          title: "קריאה חדשה!",
          description: `קריאה מספר ${data.ticket.id} נפתחה בבניין ${data.ticket.unit.building.name}`,
          variant: "default",
        });
        loadDashboardData(); // Refresh data
      });
      
      // Listen for ticket updates
      websocketService.on('ticket_updated', (data: any) => {
        toast({
          title: "עדכון קריאה",
          description: `קריאה מספר ${data.ticket.id} עודכנה`,
          variant: "default",
        });
        loadDashboardData(); // Refresh data
      });
      
      // Listen for notifications
      websocketService.on('new_notification', (data: any) => {
        toast({
          title: data.notification.title,
          description: data.notification.message,
          variant: "default",
        });
        loadDashboardData(); // Refresh data
      });
    }
    
    // Fallback polling in case WebSocket fails
    const interval = setInterval(loadDashboardData, POLL_INTERVAL * 10); // Less frequent polling
    
    return () => {
      clearInterval(interval);
      websocketService.off('new_ticket', () => {});
      websocketService.off('ticket_updated', () => {});
      websocketService.off('new_notification', () => {});
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">לוח קריאות - מאיה</h1>
          <p className="text-muted-foreground">
            מעקב בזמן אמת אחר קריאות שירות והתראות
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-muted-foreground">
              עודכן לאחרונה: {lastUpdate.toLocaleTimeString('he-IL')}
            </span>
          </div>
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
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה״כ קריאות</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
            <p className="text-xs text-muted-foreground">
              קריאות פעילות
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">קריאות פתוחות</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.openTickets}</div>
            <p className="text-xs text-muted-foreground">
              ממתינות לטיפול
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">בטיפול</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.inProgressTickets}</div>
            <p className="text-xs text-muted-foreground">
              בתהליך טיפול
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הושלמו היום</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.resolvedToday}</div>
            <p className="text-xs text-muted-foreground">
              הושלמו היום
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הפרות SLA</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.slaBreaches}</div>
            <p className="text-xs text-muted-foreground">
              דורשות תשומת לב
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Tickets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              קריאות אחרונות
            </CardTitle>
            <CardDescription>
              עדכונים בזמן אמת על קריאות שירות
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {tickets.slice(0, 10).map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">#{ticket.id}</span>
                        <Badge variant={getSeverityColor(ticket.severity)} className="text-xs">
                          {getSeverityLabel(ticket.severity)}
                        </Badge>
                        <Badge variant={getStatusColor(ticket.status)} className="text-xs">
                          {getStatusLabel(ticket.status)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {ticket.unit.building.name} - יחידה {ticket.unit.number}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      {formatTimeAgo(ticket.createdAt)}
                    </div>
                    {ticket.assignedTo && (
                      <div className="text-xs text-muted-foreground">
                        {ticket.assignedTo.email}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {tickets.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  אין קריאות פעילות
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              התראות
            </CardTitle>
            <CardDescription>
              עדכונים חשובים מהמערכת
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div key={notification.id} className={`flex items-start gap-3 p-3 border rounded-lg ${!notification.read ? 'bg-blue-50 border-blue-200' : 'hover:bg-muted/50'} transition-colors`}>
                  <div className={`h-2 w-2 rounded-full mt-2 ${!notification.read ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  אין התראות חדשות
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SLA Breaches Alert */}
      {stats.slaBreaches > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              התראות SLA
            </CardTitle>
            <CardDescription>
              יש {stats.slaBreaches} קריאות שעברו את זמן ה-SLA שלהן
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tickets.filter(ticket => {
                if (!ticket.slaDue) return false;
                return new Date(ticket.slaDue) < new Date() && ticket.status !== 'RESOLVED';
              }).slice(0, 5).map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-2 bg-destructive/10 rounded">
                  <span className="font-medium">קריאה #{ticket.id}</span>
                  <span className="text-sm text-muted-foreground">
                    {ticket.unit.building.name} - יחידה {ticket.unit.number}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
