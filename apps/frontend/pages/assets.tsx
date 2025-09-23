import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Box, 
  Building,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';
import { authFetch } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { useLocale } from '../lib/providers';
import { toast } from '../components/ui/use-toast';

interface Asset {
  id: number;
  name: string;
  type: 'HVAC' | 'ELEVATOR' | 'PLUMBING' | 'ELECTRICAL' | 'SECURITY' | 'OTHER';
  status: 'ACTIVE' | 'MAINTENANCE' | 'OUT_OF_ORDER' | 'RETIRED';
  location: string;
  buildingId: number;
  buildingName: string;
  unitId?: number;
  unitNumber?: string;
  purchaseDate: string;
  warrantyExpiry?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  value: number;
  supplier?: string;
  model?: string;
  serialNumber?: string;
  description?: string;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBuilding, setFilterBuilding] = useState('all');
  const { t } = useLocale();

  async function loadAssets() {
    try {
      const query = new URLSearchParams();
      if (searchTerm) query.append('search', searchTerm);
      if (filterType !== 'all') query.append('type', filterType);
      if (filterStatus !== 'all') query.append('status', filterStatus);
      if (filterBuilding !== 'all') query.append('buildingId', filterBuilding);
      
      const res = await authFetch(`/api/v1/assets?${query.toString()}`);
      if (res.ok) {
        setAssets(await res.json());
      } else {
        toast({
          title: "שגיאה בטעינת נכסים",
          description: "לא ניתן לטעון את רשימת הנכסים",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה בטעינת נכסים",
        description: "אירעה שגיאה בעת טעינת הנכסים",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssets();
  }, [searchTerm, filterType, filterStatus, filterBuilding]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'MAINTENANCE': return 'warning';
      case 'OUT_OF_ORDER': return 'destructive';
      case 'RETIRED': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'MAINTENANCE': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'OUT_OF_ORDER': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'RETIRED': return <Box className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'HVAC': return 'מיזוג אוויר';
      case 'ELEVATOR': return 'מעלית';
      case 'PLUMBING': return 'אינסטלציה';
      case 'ELECTRICAL': return 'חשמל';
      case 'SECURITY': return 'אבטחה';
      case 'OTHER': return 'אחר';
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'פעיל';
      case 'MAINTENANCE': return 'בתחזוקה';
      case 'OUT_OF_ORDER': return 'מקולקל';
      case 'RETIRED': return 'לא פעיל';
      default: return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount);
  };

  const isMaintenanceDue = (nextMaintenance?: string) => {
    if (!nextMaintenance) return false;
    const nextDate = new Date(nextMaintenance);
    const today = new Date();
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30; // Due within 30 days
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
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
          <h1 className="text-3xl font-bold tracking-tight">ציוד ונכסים</h1>
          <p className="text-muted-foreground">
            ניהול ציוד ונכסים בבניינים
          </p>
        </div>
        
        <Button>
          <Plus className="me-2 h-4 w-4" />
          הוסף נכס
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>סינון וחיפוש</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="חיפוש נכסים..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="סוג נכס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסוגים</SelectItem>
                <SelectItem value="HVAC">מיזוג אוויר</SelectItem>
                <SelectItem value="ELEVATOR">מעלית</SelectItem>
                <SelectItem value="PLUMBING">אינסטלציה</SelectItem>
                <SelectItem value="ELECTRICAL">חשמל</SelectItem>
                <SelectItem value="SECURITY">אבטחה</SelectItem>
                <SelectItem value="OTHER">אחר</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                <SelectItem value="ACTIVE">פעיל</SelectItem>
                <SelectItem value="MAINTENANCE">בתחזוקה</SelectItem>
                <SelectItem value="OUT_OF_ORDER">מקולקל</SelectItem>
                <SelectItem value="RETIRED">לא פעיל</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterBuilding} onValueChange={setFilterBuilding}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="בניין" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הבניינים</SelectItem>
                <SelectItem value="1">בניין 1</SelectItem>
                <SelectItem value="2">בניין 2</SelectItem>
                <SelectItem value="3">בניין 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assets Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset) => (
          <Card key={asset.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Box className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-sm font-medium line-clamp-1">
                      {asset.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {getTypeLabel(asset.type)}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(asset.status)}
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <Badge variant={getStatusColor(asset.status)}>
                    {getStatusLabel(asset.status)}
                  </Badge>
                  {isMaintenanceDue(asset.nextMaintenance) && (
                    <Badge variant="warning">
                      תחזוקה קרובה
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-1 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Building className="h-3 w-3" />
                    <span>{asset.buildingName}</span>
                    {asset.unitNumber && <span>יחידה {asset.unitNumber}</span>}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3" />
                    <span>{formatCurrency(asset.value)}</span>
                  </div>
                  
                  {asset.nextMaintenance && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>תחזוקה הבאה: {new Date(asset.nextMaintenance).toLocaleDateString('he-IL')}</span>
                    </div>
                  )}
                  
                  {asset.supplier && (
                    <div className="text-xs">
                      ספק: {asset.supplier}
                    </div>
                  )}
                  
                  {asset.model && (
                    <div className="text-xs">
                      דגם: {asset.model}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="me-2 h-3 w-3" />
                  ערוך
                </Button>
                <Button variant="outline" size="sm">
                  צפה
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {assets.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Box className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">אין נכסים</h3>
            <p className="text-muted-foreground text-center mb-4">
              לא נמצאו נכסים התואמים לקריטריונים שלך
            </p>
            <Button>
              <Plus className="me-2 h-4 w-4" />
              הוסף נכס ראשון
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
