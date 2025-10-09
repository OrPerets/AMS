// /Users/orperetz/Documents/AMS/apps/frontend/pages/payments.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Download,
  Eye,
  RefreshCw,
  Filter,
  Plus,
  Receipt,
  Building,
  User
} from 'lucide-react';
import { authFetch } from '../lib/auth';
import { DataTable } from '../components/ui/data-table';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Input } from '../components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { cn, formatDate, formatCurrency } from '../lib/utils';
import { useLocale } from '../lib/providers';
import { toast } from '../components/ui/use-toast';

interface Invoice {
  id: number;
  amount: number;
  unitId: number;
  buildingId?: number;
  residentName?: string;
  description?: string;
  dueDate: string;
  issueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  type: 'MAINTENANCE' | 'UTILITIES' | 'MANAGEMENT' | 'PARKING' | 'OTHER';
  paymentMethod?: 'CASH' | 'CREDIT_CARD' | 'BANK_TRANSFER' | 'CHECK';
  paidAt?: string;
  receiptNumber?: string;
  category?: string;
}

const statusConfig = {
  PENDING: { label: 'ממתין לתשלום', variant: 'warning' as const },
  PAID: { label: 'שולם', variant: 'success' as const },
  OVERDUE: { label: 'איחור בתשלום', variant: 'destructive' as const },
  CANCELLED: { label: 'בוטל', variant: 'outline' as const },
};

const typeConfig = {
  MAINTENANCE: { label: 'אחזקה', icon: '🔧' },
  UTILITIES: { label: 'שירותים', icon: '💡' },
  MANAGEMENT: { label: 'ניהול', icon: '🏢' },
  PARKING: { label: 'חניה', icon: '🚗' },
  OTHER: { label: 'אחר', icon: '📋' },
};

export default function Payments() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [newInvoice, setNewInvoice] = useState<{ residentId: string; items: { description: string; quantity: string; unitPrice: string }[] }>({ residentId: '', items: [{ description: '', quantity: '1', unitPrice: '' }] });
  const [recurring, setRecurring] = useState<{ residentId: string; recurrence: string; items: { description: string; quantity: string; unitPrice: string }[] }>({ residentId: '', recurrence: 'monthly', items: [{ description: '', quantity: '1', unitPrice: '' }] });
  const { locale } = useLocale();

  const loadInvoices = async () => {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
      });

      // Race between the API call and timeout
      const res = await Promise.race([
        authFetch('/api/v1/invoices/unpaid'),
        timeoutPromise
      ]) as Response;

      if (res.ok) {
        const data = await res.json();
        setInvoices(Array.isArray(data) ? data : []);
      } else if (res.status === 503) {
        // Backend server is unavailable, show mock data
        console.log('Backend server unavailable, showing mock data');
        setInvoices([
          {
            id: 2001,
            amount: 850,
            unitId: 12,
            buildingId: 1,
            residentName: 'דניאל לוי',
            description: 'דמי אחזקה חודשי',
            dueDate: '2024-01-31T23:59:59Z',
            issueDate: '2024-01-01T00:00:00Z',
            status: 'PENDING',
            type: 'MAINTENANCE',
            category: 'דמי אחזקה'
          },
          {
            id: 2002,
            amount: 320,
            unitId: 25,
            buildingId: 1,
            residentName: 'משה דוד',
            description: 'חשבון חשמל',
            dueDate: '2024-01-15T23:59:59Z',
            issueDate: '2024-01-01T00:00:00Z',
            status: 'OVERDUE',
            type: 'UTILITIES',
            category: 'חשמל'
          },
          {
            id: 2003,
            amount: 1200,
            unitId: 8,
            buildingId: 2,
            residentName: 'שרה אברהם',
            description: 'דמי ניהול רבעוני',
            dueDate: '2024-02-15T23:59:59Z',
            issueDate: '2024-01-01T00:00:00Z',
            status: 'PENDING',
            type: 'MANAGEMENT',
            category: 'דמי ניהול'
          },
          {
            id: 2004,
            amount: 450,
            unitId: 15,
            buildingId: 1,
            residentName: 'יוסי רוזן',
            description: 'אגרת חניה חודשית',
            dueDate: '2024-01-31T23:59:59Z',
            issueDate: '2024-01-01T00:00:00Z',
            status: 'PAID',
            type: 'PARKING',
            category: 'חניה',
            paymentMethod: 'CREDIT_CARD',
            paidAt: '2024-01-20T14:30:00Z',
            receiptNumber: 'REC-2024-001'
          }
        ]);
        
        toast({
          title: "מצב אופליין",
          description: "השרת לא זמין כרגע. מוצגים נתונים לדוגמה.",
          variant: "default",
        });
      } else {
        // Mock data for demo when API fails
        setInvoices([
          {
            id: 2001,
            amount: 850,
            unitId: 12,
            buildingId: 1,
            residentName: 'דניאל לוי',
            description: 'דמי אחזקה חודשי',
            dueDate: '2024-01-31T23:59:59Z',
            issueDate: '2024-01-01T00:00:00Z',
            status: 'PENDING',
            type: 'MAINTENANCE',
            category: 'דמי אחזקה'
          },
          {
            id: 2002,
            amount: 320,
            unitId: 25,
            buildingId: 1,
            residentName: 'משה דוד',
            description: 'חשבון חשמל',
            dueDate: '2024-01-15T23:59:59Z',
            issueDate: '2024-01-01T00:00:00Z',
            status: 'OVERDUE',
            type: 'UTILITIES',
            category: 'חשמל'
          },
          {
            id: 2003,
            amount: 1200,
            unitId: 8,
            buildingId: 2,
            residentName: 'שרה אברהם',
            description: 'דמי ניהול רבעוני',
            dueDate: '2024-02-15T23:59:59Z',
            issueDate: '2024-01-01T00:00:00Z',
            status: 'PENDING',
            type: 'MANAGEMENT',
            category: 'דמי ניהול'
          },
          {
            id: 2004,
            amount: 450,
            unitId: 15,
            buildingId: 1,
            residentName: 'יוסי רוזן',
            description: 'אגרת חניה חודשית',
            dueDate: '2024-01-31T23:59:59Z',
            issueDate: '2024-01-01T00:00:00Z',
            status: 'PAID',
            type: 'PARKING',
            category: 'חניה',
            paymentMethod: 'CREDIT_CARD',
            paidAt: '2024-01-20T14:30:00Z',
            receiptNumber: 'REC-2024-001'
          }
        ]);
        
        toast({
          title: "מצב דמו",
          description: "השרת לא זמין כרגע. מוצגים נתונים לדוגמה.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      
      // Show mock data even on error
      setInvoices([
        {
          id: 2001,
          amount: 850,
          unitId: 12,
          buildingId: 1,
          residentName: 'דניאל לוי',
          description: 'דמי אחזקה חודשי',
          dueDate: '2024-01-31T23:59:59Z',
          issueDate: '2024-01-01T00:00:00Z',
          status: 'PENDING',
          type: 'MAINTENANCE',
          category: 'דמי אחזקה'
        },
        {
          id: 2002,
          amount: 320,
          unitId: 25,
          buildingId: 1,
          residentName: 'משה דוד',
          description: 'חשבון חשמל',
          dueDate: '2024-01-15T23:59:59Z',
          issueDate: '2024-01-01T00:00:00Z',
          status: 'OVERDUE',
          type: 'UTILITIES',
          category: 'חשמל'
        },
        {
          id: 2003,
          amount: 1200,
          unitId: 8,
          buildingId: 2,
          residentName: 'שרה אברהם',
          description: 'דמי ניהול רבעוני',
          dueDate: '2024-02-15T23:59:59Z',
          issueDate: '2024-01-01T00:00:00Z',
          status: 'PENDING',
          type: 'MANAGEMENT',
          category: 'דמי ניהול'
        },
        {
          id: 2004,
          amount: 450,
          unitId: 15,
          buildingId: 1,
          residentName: 'יוסי רוזן',
          description: 'אגרת חניה חודשית',
          dueDate: '2024-01-31T23:59:59Z',
          issueDate: '2024-01-01T00:00:00Z',
          status: 'PAID',
          type: 'PARKING',
          category: 'חניה',
          paymentMethod: 'CREDIT_CARD',
          paidAt: '2024-01-20T14:30:00Z',
          receiptNumber: 'REC-2024-001'
        }
      ]);

      const errorMessage = error instanceof Error && error.message === 'Request timeout' 
        ? "הבקשה ארכה יותר מדי זמן. נסה שוב מאוחר יותר."
        : "לא ניתן לטעון את החשבוניות. נסה שוב מאוחר יותר.";

      toast({
        title: "שגיאה בטעינת תשלומים",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInvoices();
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const statusMatch = statusFilter === 'all' || invoice.status === statusFilter;
      const typeMatch = typeFilter === 'all' || invoice.type === typeFilter;
      return statusMatch && typeMatch;
    });
  }, [invoices, statusFilter, typeFilter]);

  const handlePayNow = async (invoice: Invoice) => {
    try {
      const res = await authFetch(`/api/v1/invoices/${invoice.id}/pay`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'תשלום הושלם', description: `חשבונית #${invoice.id} שולמה בהצלחה` });
      loadInvoices();
      window.open(`/api/v1/invoices/${invoice.id}/receipt`, '_blank');
    } catch (e: any) {
      toast({ title: 'שגיאה בתשלום', description: e?.message || 'נסו שוב', variant: 'destructive' });
    }
  };

  const handleViewReceipt = (invoice: Invoice) => {
    window.open(`/api/v1/invoices/${invoice.id}/receipt`, '_blank');
  };

  const addInvoiceItem = () => setNewInvoice({ ...newInvoice, items: [...newInvoice.items, { description: '', quantity: '1', unitPrice: '' }] });
  const addRecurringItem = () => setRecurring({ ...recurring, items: [...recurring.items, { description: '', quantity: '1', unitPrice: '' }] });

  const computeTotal = (items: { quantity: string; unitPrice: string }[]) => items.reduce((s, it) => s + (Number(it.quantity || 0) * Number(it.unitPrice || 0)), 0);

  const submitInvoice = async () => {
    const payload = {
      residentId: Number(newInvoice.residentId),
      items: newInvoice.items.map(i => ({ description: i.description, quantity: Number(i.quantity || 1), unitPrice: Number(i.unitPrice || 0) })),
    };
    const res = await authFetch('/api/v1/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      toast({ title: 'חשבונית נוצרה' });
      loadInvoices();
      setNewInvoice({ residentId: '', items: [{ description: '', quantity: '1', unitPrice: '' }] });
    } else {
      toast({ title: 'יצירת חשבונית נכשלה', variant: 'destructive' });
    }
  };

  const submitRecurring = async () => {
    const payload = {
      residentId: Number(recurring.residentId),
      recurrence: recurring.recurrence,
      items: recurring.items.map(i => ({ description: i.description, quantity: Number(i.quantity || 1), unitPrice: Number(i.unitPrice || 0) })),
    };
    const res = await authFetch('/api/v1/recurring-invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      toast({ title: 'חשבונית מחזורית נשמרה' });
      setRecurring({ residentId: '', recurrence: 'monthly', items: [{ description: '', quantity: '1', unitPrice: '' }] });
    } else {
      toast({ title: 'שמירת מחזורית נכשלה', variant: 'destructive' });
    }
  };

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: "id",
      header: "מס׳ חשבונית",
      cell: ({ row }) => (
        <div className="font-medium">#{row.getValue("id")}</div>
      ),
    },
    {
      accessorKey: "description",
      header: "תיאור",
      cell: ({ row }) => {
        const invoice = row.original;
        const typeInfo = typeConfig[invoice.type];
        return (
          <div className="max-w-[200px]">
            <div className="font-medium truncate">
              {invoice.description || 'ללא תיאור'}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {typeInfo.icon} {typeInfo.label} • יחידה {invoice.unitId}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "residentName",
      header: "דייר",
      cell: ({ row }) => {
        const residentName = row.getValue("residentName") as string;
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{residentName || 'לא ידוע'}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: "סכום",
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number;
        return (
          <div className="font-medium">
            {formatCurrency(amount)}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "סטטוס",
      cell: ({ row }) => {
        const invoice = row.original;
        const status = row.getValue("status") as keyof typeof statusConfig;
        const config = statusConfig[status];
        const daysOverdue = getDaysOverdue(invoice.dueDate);
        
        return (
          <div className="space-y-1">
            <Badge variant={config.variant}>
              {config.label}
            </Badge>
            {status === 'OVERDUE' && daysOverdue > 0 && (
              <div className="text-xs text-destructive">
                איחור של {daysOverdue} ימים
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: "תאריך פירעון",
      cell: ({ row }) => {
        const date = new Date(row.getValue("dueDate"));
        const invoice = row.original;
        const isOverdue = invoice.status === 'OVERDUE';
        
        return (
          <div className={cn(
            "text-sm",
            isOverdue && "text-destructive font-medium"
          )}>
            {formatDate(date, locale)}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const invoice = row.original;

        if (invoice.status === 'PAID') {
          return (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleViewReceipt(invoice)}
            >
              <Receipt className="me-1 h-3 w-3" />
              קבלה
            </Button>
          );
        }

        if (invoice.status === 'CANCELLED') {
          return (
            <Badge variant="outline">
              בוטל
            </Badge>
          );
        }

        return (
          <Button 
            onClick={() => handlePayNow(invoice)}
            size="sm"
            className={cn(
              invoice.status === 'OVERDUE' && "bg-destructive hover:bg-destructive/90"
            )}
          >
            <CreditCard className="me-1 h-3 w-3" />
            שלם עכשיו
          </Button>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>טוען תשלומים...</span>
            </div>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = {
    total: invoices.length,
    pending: invoices.filter(i => i.status === 'PENDING').length,
    overdue: invoices.filter(i => i.status === 'OVERDUE').length,
    paid: invoices.filter(i => i.status === 'PAID').length,
    totalAmount: invoices.reduce((sum, i) => sum + i.amount, 0),
    pendingAmount: invoices.filter(i => i.status === 'PENDING').reduce((sum, i) => sum + i.amount, 0),
    overdueAmount: invoices.filter(i => i.status === 'OVERDUE').reduce((sum, i) => sum + i.amount, 0),
  };

  return (
    <div className="space-y-6 relative">
      {refreshing && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>מעדכן נתונים...</span>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">תשלומים</h1>
          <p className="text-muted-foreground">
            ניהול חשבוניות ותשלומים
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
          <Button variant="outline">
            <Download className="me-2 h-4 w-4" />
            יצוא Excel
          </Button>
          <Button>
            <Plus className="me-2 h-4 w-4" />
            חשבונית חדשה
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה״כ חשבוניות</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalAmount)} סה״כ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ממתינות לתשלום</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.pendingAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">באיחור</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.overdueAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">שולמו</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.paid}</div>
            <p className="text-xs text-muted-foreground">
              החודש הנוכחי
            </p>
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
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            <SelectItem value="PENDING">ממתין לתשלום</SelectItem>
            <SelectItem value="OVERDUE">באיחור</SelectItem>
            <SelectItem value="PAID">שולם</SelectItem>
            <SelectItem value="CANCELLED">בוטל</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="סוג" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסוגים</SelectItem>
            <SelectItem value="MAINTENANCE">אחזקה</SelectItem>
            <SelectItem value="UTILITIES">שירותים</SelectItem>
            <SelectItem value="MANAGEMENT">ניהול</SelectItem>
            <SelectItem value="PARKING">חניה</SelectItem>
            <SelectItem value="OTHER">אחר</SelectItem>
          </SelectContent>
        </Select>

        {(statusFilter !== 'all' || typeFilter !== 'all') && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setStatusFilter('all');
              setTypeFilter('all');
            }}
          >
            נקה סינונים
          </Button>
        )}
      </div>

      {/* Quick Actions for Overdue */}
      {stats.overdue > 0 && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              תשומת לב: {stats.overdue} חשבוניות באיחור
            </CardTitle>
            <CardDescription>
              יש {stats.overdue} חשבוניות שעברו את תאריך הפירעון בסכום כולל של {formatCurrency(stats.overdueAmount)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm">
                שלח תזכורות
              </Button>
              <Button variant="outline" size="sm">
                הצג רק איחורים
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredInvoices}
            searchPlaceholder="חיפוש חשבוניות..."
          />
        </CardContent>
      </Card>

      {/* Create Invoice */}
      <Card>
        <CardHeader>
          <CardTitle>חשבונית חדשה</CardTitle>
          <CardDescription>יצירת חשבונית עם שורות</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
            <label>מזהה דייר</label>
            <Input className="md:col-span-2" value={newInvoice.residentId} onChange={(e) => setNewInvoice({ ...newInvoice, residentId: e.target.value })} />
          </div>
          <div className="space-y-2">
            {newInvoice.items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-6 gap-2 items-center">
                <label className="col-span-1">תיאור</label>
                <Input className="col-span-2" value={it.description} onChange={(e) => {
                  const items = [...newInvoice.items]; items[idx] = { ...items[idx], description: e.target.value }; setNewInvoice({ ...newInvoice, items });
                }} />
                <label>כמות</label>
                <Input type="number" value={it.quantity} onChange={(e) => {
                  const items = [...newInvoice.items]; items[idx] = { ...items[idx], quantity: e.target.value }; setNewInvoice({ ...newInvoice, items });
                }} />
                <label>מחיר יח׳</label>
                <Input type="number" value={it.unitPrice} onChange={(e) => {
                  const items = [...newInvoice.items]; items[idx] = { ...items[idx], unitPrice: e.target.value }; setNewInvoice({ ...newInvoice, items });
                }} />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addInvoiceItem}>הוסף שורה</Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="ms-auto font-medium">סה"כ: {computeTotal(newInvoice.items).toLocaleString('he-IL', { style: 'currency', currency: 'ILS' })}</div>
            <Button onClick={submitInvoice} disabled={!newInvoice.residentId || newInvoice.items.length === 0}>צור חשבונית</Button>
          </div>
        </CardContent>
      </Card>

      {/* Recurring Invoice */}
      <Card>
        <CardHeader>
          <CardTitle>חשבונית מחזורית</CardTitle>
          <CardDescription>הגדרת חיוב חודשי/רבעוני</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
            <label>מזהה דייר</label>
            <Input className="md:col-span-2" value={recurring.residentId} onChange={(e) => setRecurring({ ...recurring, residentId: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
            <label>תדירות</label>
            <Input className="md:col-span-2" placeholder="monthly | quarterly | yearly" value={recurring.recurrence} onChange={(e) => setRecurring({ ...recurring, recurrence: e.target.value })} />
          </div>
          <div className="space-y-2">
            {recurring.items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-6 gap-2 items-center">
                <label className="col-span-1">תיאור</label>
                <Input className="col-span-2" value={it.description} onChange={(e) => {
                  const items = [...recurring.items]; items[idx] = { ...items[idx], description: e.target.value }; setRecurring({ ...recurring, items });
                }} />
                <label>כמות</label>
                <Input type="number" value={it.quantity} onChange={(e) => {
                  const items = [...recurring.items]; items[idx] = { ...items[idx], quantity: e.target.value }; setRecurring({ ...recurring, items });
                }} />
                <label>מחיר יח׳</label>
                <Input type="number" value={it.unitPrice} onChange={(e) => {
                  const items = [...recurring.items]; items[idx] = { ...items[idx], unitPrice: e.target.value }; setRecurring({ ...recurring, items });
                }} />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addRecurringItem}>הוסף שורה</Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="ms-auto font-medium">סה"כ: {computeTotal(recurring.items).toLocaleString('he-IL', { style: 'currency', currency: 'ILS' })}</div>
            <Button onClick={submitRecurring} disabled={!recurring.residentId || recurring.items.length === 0}>שמור מחזורית</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
