// /Users/orperetz/Documents/AMS/apps/frontend/pages/tickets.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { 
  Plus, 
  Eye, 
  Edit, 
  Clock, 
  User, 
  MapPin, 
  Calendar,
  AlertCircle,
  Camera,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { authFetch } from '../lib/auth';
import { DataTable } from '../components/ui/data-table';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Skeleton } from '../components/ui/skeleton';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { cn, formatDate, getStatusColor, getStatusLabel } from '../lib/utils';
import { useLocale } from '../lib/providers';
import { toast } from '../components/ui/use-toast';

interface Ticket {
  id: number;
  unitId: number;
  buildingId?: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  title?: string;
  description?: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  hasPhotos?: boolean;
  residentName?: string;
  category?: string;
}

const priorityConfig = {
  LOW: { label: 'נמוך', variant: 'outline' as const },
  MEDIUM: { label: 'בינוני', variant: 'info' as const },
  HIGH: { label: 'גבוה', variant: 'warning' as const },
  URGENT: { label: 'דחוף', variant: 'destructive' as const },
};

const statusConfig = {
  OPEN: { label: 'פתוח', variant: 'open' as const },
  IN_PROGRESS: { label: 'בתהליך', variant: 'in-progress' as const },
  COMPLETED: { label: 'הושלם', variant: 'completed' as const },
  CLOSED: { label: 'סגור', variant: 'closed' as const },
};

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const { locale } = useLocale();

  const loadTickets = async () => {
    try {
      const res = await authFetch('/api/v1/tickets');
      if (res.ok) {
        const data = await res.json();
        setTickets(Array.isArray(data) ? data : []);
      } else {
        // Mock data for demo
        setTickets([
          {
            id: 1001,
            unitId: 12,
            buildingId: 1,
            status: 'OPEN',
            priority: 'HIGH',
            title: 'דליפת מים בחדר אמבטיה',
            description: 'דליפה מתמשכת מהברז הראשי',
            assignedTo: 'tech1',
            assignedToName: 'אבי כהן',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
            dueDate: '2024-01-17T18:00:00Z',
            hasPhotos: true,
            residentName: 'דניאל לוי',
            category: 'אינסטלציה'
          },
          {
            id: 1002,
            unitId: 25,
            buildingId: 1,
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            title: 'תיקון מעלית',
            description: 'המעלית תקועה בקומה השנייה',
            assignedTo: 'tech2',
            assignedToName: 'רינה שמש',
            createdAt: '2024-01-14T14:20:00Z',
            updatedAt: '2024-01-15T09:15:00Z',
            hasPhotos: false,
            residentName: 'משה דוד',
            category: 'מעלית'
          },
          {
            id: 1003,
            unitId: 8,
            buildingId: 2,
            status: 'COMPLETED',
            priority: 'LOW',
            title: 'החלפת נורה בחדר מדרגות',
            description: 'נורה שרופה בקומה 3',
            assignedTo: 'tech1',
            assignedToName: 'אבי כהן',
            createdAt: '2024-01-13T16:45:00Z',
            updatedAt: '2024-01-14T11:30:00Z',
            hasPhotos: false,
            residentName: 'שרה אברהם',
            category: 'חשמל'
          }
        ]);
      }
    } catch (error) {
      toast({
        title: "שגיאה בטעינת קריאות",
        description: "לא ניתן לטעון את רשימת הקריאות",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const statusMatch = statusFilter === 'all' || ticket.status === statusFilter;
      const priorityMatch = priorityFilter === 'all' || ticket.priority === priorityFilter;
      return statusMatch && priorityMatch;
    });
  }, [tickets, statusFilter, priorityFilter]);

  const handleViewTicket = (ticket: Ticket) => {
    toast({
      title: `קריאה #${ticket.id}`,
      description: ticket.title || "פתיחת פרטי הקריאה",
      variant: "info",
    });
  };

  const handleAssignTicket = (ticket: Ticket) => {
    toast({
      title: "הקצאת קריאה",
      description: `הקצאת קריאה #${ticket.id} לטכנאי`,
      variant: "info",
    });
  };

  const columns: ColumnDef<Ticket>[] = [
    {
      accessorKey: "id",
      header: "מס׳ קריאה",
      cell: ({ row }) => (
        <div className="font-medium">#{row.getValue("id")}</div>
      ),
    },
    {
      accessorKey: "title",
      header: "כותרת",
      cell: ({ row }) => {
        const ticket = row.original;
        return (
          <div className="max-w-[200px]">
            <div className="font-medium truncate">
              {ticket.title || 'ללא כותרת'}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              יחידה {ticket.unitId} • {ticket.category || 'כללי'}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "סטטוס",
      cell: ({ row }) => {
        const rawStatus = row.getValue("status");
        const status = rawStatus as keyof typeof statusConfig;
        const config = statusConfig[status] ?? { label: String(rawStatus ?? 'לא ידוע'), variant: 'default' as const };
        return (
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "priority",
      header: "עדיפות",
      cell: ({ row }) => {
        const rawPriority = row.getValue("priority");
        const priority = rawPriority as keyof typeof priorityConfig;
        const config = priorityConfig[priority] ?? { label: String(rawPriority ?? 'לא ידוע'), variant: 'outline' as const };
        return (
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "assignedToName",
      header: "טכנאי מוקצה",
      cell: ({ row }) => {
        const ticket = row.original;
        if (!ticket.assignedToName) {
          return (
            <Badge variant="outline">
              לא הוקצה
            </Badge>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-primary/10">
                {ticket.assignedToName.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{ticket.assignedToName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "נוצר",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return (
          <div className="text-sm">
            {formatDate(date, locale)}
          </div>
        );
      },
    },
    {
      accessorKey: "hasPhotos",
      header: "תמונות",
      cell: ({ row }) => {
        const hasPhotos = row.getValue("hasPhotos");
        return hasPhotos ? (
          <Camera className="h-4 w-4 text-primary" />
        ) : (
          <div className="h-4 w-4" />
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const ticket = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">פתח תפריט</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>פעולות</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleViewTicket(ticket)}>
                <Eye className="me-2 h-4 w-4" />
                צפה בפרטים
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAssignTicket(ticket)}>
                <User className="me-2 h-4 w-4" />
                הקצה לטכנאי
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Edit className="me-2 h-4 w-4" />
                ערוך קריאה
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">קריאות שירות</h1>
          <p className="text-muted-foreground">
            ניהול וטיפול בקריאות שירות במערכת
          </p>
        </div>
        <Button>
          <Plus className="me-2 h-4 w-4" />
          קריאה חדשה
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              קריאות פתוחות
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tickets.filter(t => t.status === 'OPEN').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              בתהליך
            </CardTitle>
            <Clock className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tickets.filter(t => t.status === 'IN_PROGRESS').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              הושלמו היום
            </CardTitle>
            <Clock className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tickets.filter(t => t.status === 'COMPLETED').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              סה״כ קריאות
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">סינון:</span>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            <SelectItem value="OPEN">פתוח</SelectItem>
            <SelectItem value="IN_PROGRESS">בתהליך</SelectItem>
            <SelectItem value="COMPLETED">הושלם</SelectItem>
            <SelectItem value="CLOSED">סגור</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="עדיפות" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל העדיפויות</SelectItem>
            <SelectItem value="LOW">נמוך</SelectItem>
            <SelectItem value="MEDIUM">בינוני</SelectItem>
            <SelectItem value="HIGH">גבוה</SelectItem>
            <SelectItem value="URGENT">דחוף</SelectItem>
          </SelectContent>
        </Select>

        {(statusFilter !== 'all' || priorityFilter !== 'all') && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setStatusFilter('all');
              setPriorityFilter('all');
            }}
          >
            נקה סינונים
          </Button>
        )}
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredTickets}
            searchPlaceholder="חיפוש קריאות..."
            onRowClick={handleViewTicket}
          />
        </CardContent>
      </Card>
    </div>
  );
}
