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
import { authFetch, getCurrentUserId } from '../lib/auth';
import { DataTable } from '../components/ui/data-table';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { FormField, FormLabel } from '../components/ui/form-field';
import { Input } from '../components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Skeleton, SkeletonCard, SkeletonTable } from '../components/ui/skeleton';
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
import { useRouter } from 'next/router';

interface Ticket {
  id: number;
  unitId: number;
  buildingId?: number;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
  severity: 'NORMAL' | 'HIGH' | 'URGENT';
  title?: string;
  description?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  hasPhotos?: boolean;
  residentName?: string;
  category?: string;
  photos?: string[];
  comments?: Array<{ id: number; content: string; createdAt: string }>;
  unit?: {
    building?: {
      id: number;
      name: string;
    };
  };
  assignedTo?: {
    id: number;
    email: string;
    role: string;
  };
}

const severityConfig = {
  NORMAL: { label: 'רגילה', variant: 'info' as const },
  HIGH: { label: 'דחופה', variant: 'warning' as const },
  URGENT: { label: 'בהולה', variant: 'destructive' as const },
};

const statusConfig = {
  OPEN: { label: 'פתוח', variant: 'open' as const },
  ASSIGNED: { label: 'הוקצה', variant: 'assigned' as const },
  IN_PROGRESS: { label: 'בתהליך', variant: 'in-progress' as const },
  RESOLVED: { label: 'נפתרה', variant: 'resolved' as const },
};

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const { locale } = useLocale();
  const router = useRouter();

  const mapTicket = (ticket: any): Ticket => {
    const descriptionComment = Array.isArray(ticket.comments)
      ? ticket.comments.find((comment: any) => typeof comment?.content === 'string' && comment.content.trim().length > 0)
      : undefined;

    return {
      id: ticket.id,
      unitId: ticket.unitId,
      buildingId: ticket.unit?.building?.id,
      status: ticket.status,
      severity: ticket.severity,
      title: descriptionComment?.content?.slice(0, 50) || `קריאה #${ticket.id}`,
      description: descriptionComment?.content,
      assignedToName: ticket.assignedTo?.email,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      dueDate: ticket.slaDue,
      hasPhotos: Array.isArray(ticket.photos) && ticket.photos.length > 0,
      photos: ticket.photos ?? [],
      residentName: ticket.unit?.building?.name,
      category: ticket.unit?.building?.name,
      comments: ticket.comments ?? [],
      unit: ticket.unit,
    };
  };

  const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const res = await authFetch('/api/v1/tickets', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'קריאה נוצרה', description: 'הקריאה נוצרה בהצלחה' });
      e.currentTarget.reset();
      loadTickets();
    } catch (error: any) {
      toast({ title: 'שגיאה ביצירת קריאה', description: error?.message || 'נסו שוב', variant: 'destructive' });
    }
  };

  const loadTickets = async () => {
    try {
      const res = await authFetch('/api/v1/tickets');
      if (res.ok) {
        const data = await res.json();
        setTickets(Array.isArray(data) ? data.map(mapTicket) : []);
      } else {
        // Mock data for demo
        setTickets([
          {
            id: 1001,
            unitId: 12,
            buildingId: 1,
            status: 'OPEN',
            severity: 'URGENT',
            title: 'דליפת מים בחדר אמבטיה',
            description: 'דליפה מתמשכת מהברז הראשי',
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
            severity: 'HIGH',
            title: 'תיקון מעלית',
            description: 'המעלית תקועה בקומה השנייה',
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
            status: 'RESOLVED',
            severity: 'NORMAL',
            title: 'החלפת נורה בחדר מדרגות',
            description: 'נורה שרופה בקומה 3',
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
      const severityMatch = severityFilter === 'all' || ticket.severity === severityFilter;
      return statusMatch && severityMatch;
    });
  }, [tickets, statusFilter, severityFilter]);

  const handleViewTicket = (ticket: Ticket) => {
    router.push(`/tickets/${ticket.id}`);
  };

  const handleAssignTicket = async (ticket: Ticket) => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      toast({ title: 'לא נמצא משתמש מחובר', variant: 'destructive' });
      return;
    }
    try {
      await authFetch(`/api/v1/tickets/${ticket.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeId: currentUserId }),
      });
      toast({ title: 'הקריאה הוקצתה' });
      loadTickets();
    } catch (error: any) {
      toast({ title: 'שגיאה בהקצאה', description: error?.message || 'נסו שוב', variant: 'destructive' });
    }
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
      accessorKey: "severity",
      header: "חומרה",
      cell: ({ row }) => {
        const rawSeverity = row.getValue("severity");
        const severity = rawSeverity as keyof typeof severityConfig;
        const config = severityConfig[severity] ?? { label: String(rawSeverity ?? 'לא ידוע'), variant: 'outline' as const };
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
        {/* Header skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" variant="shimmer" />
            <Skeleton className="h-5 w-72" variant="shimmer" />
          </div>
          <Skeleton className="h-10 w-40" variant="shimmer" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

        {/* Filters skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-12" variant="shimmer" />
          <Skeleton className="h-10 w-32" variant="shimmer" />
          <Skeleton className="h-10 w-32" variant="shimmer" />
        </div>

        {/* Table skeleton */}
        <Card>
          <CardContent className="p-0">
            <SkeletonTable rows={8} columns={7} />
          </CardContent>
        </Card>
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
        <Card className="p-4 bg-muted/30">
          <form onSubmit={handleCreateTicket} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <FormField
              label="בניין"
              required
            >
              <Input
                name="unitId"
                type="number"
                placeholder="הכנס מספר יחידה"
                inputSize="default"
                required
              />
            </FormField>
            
            <FormField
              label="רמת חומרה"
              required
            >
              <select name="severity" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option value="NORMAL">רגילה</option>
                <option value="HIGH">דחופה</option>
                <option value="URGENT">בהולה</option>
              </select>
            </FormField>
            
            <FormField
              label="פתיחת קריאה"
              description="תאר בקצרה את הבעיה שצריכה טיפול"
            >
              <Input
                name="description"
                placeholder="תיאור הקריאה"
                className="md:col-span-2"
              />
            </FormField>
            
            <FormField
              label="צירוף תמונות"
              description="ניתן לצרף תמונות של הבעיה"
            >
              <Input
                name="photos"
                type="file"
                multiple
                accept="image/*"
                className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </FormField>
            
            <Button type="submit" className="w-full">
              <Plus className="me-2 h-4 w-4" />
              צור קריאה
            </Button>
          </form>
        </Card>
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
              {tickets.filter(t => t.status === 'RESOLVED').length}
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
            <SelectItem value="ASSIGNED">הוקצה</SelectItem>
            <SelectItem value="IN_PROGRESS">בתהליך</SelectItem>
            <SelectItem value="RESOLVED">נפתרה</SelectItem>
          </SelectContent>
        </Select>

        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="חומרה" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל החומרות</SelectItem>
            <SelectItem value="NORMAL">רגילה</SelectItem>
            <SelectItem value="HIGH">דחופה</SelectItem>
            <SelectItem value="URGENT">בהולה</SelectItem>
          </SelectContent>
        </Select>

        {(statusFilter !== 'all' || severityFilter !== 'all') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStatusFilter('all');
              setSeverityFilter('all');
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
