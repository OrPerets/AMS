import React, { useEffect, useState } from 'react';
import { 
  Send, 
  Search, 
  Filter, 
  MessageCircle, 
  Users,
  Building,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react';
import { authFetch } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Skeleton } from '../components/ui/skeleton';
import { useLocale } from '../lib/providers';
import { toast } from '../components/ui/use-toast';

interface Communication {
  id: number;
  title: string;
  content: string;
  type: 'ANNOUNCEMENT' | 'TICKET_UPDATE' | 'PAYMENT_REMINDER' | 'MAINTENANCE_NOTICE';
  status: 'DRAFT' | 'SENT' | 'SCHEDULED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  scheduledFor?: string;
  sentAt?: string;
  senderId: number;
  senderName: string;
  targetType: 'ALL' | 'BUILDING' | 'UNIT' | 'USER';
  targetId?: number;
  targetName?: string;
  readCount: number;
  totalRecipients: number;
}

export default function CommunicationsPage() {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCompose, setShowCompose] = useState(false);
  const { t } = useLocale();

  // Compose form state
  const [composeData, setComposeData] = useState({
    title: '',
    content: '',
    type: 'ANNOUNCEMENT',
    priority: 'MEDIUM',
    targetType: 'ALL',
    targetId: '',
    scheduledFor: ''
  });

  async function loadCommunications() {
    try {
      const query = new URLSearchParams();
      if (searchTerm) query.append('search', searchTerm);
      if (filterType !== 'all') query.append('type', filterType);
      if (filterStatus !== 'all') query.append('status', filterStatus);
      
      const res = await authFetch(`/api/v1/communications?${query.toString()}`);
      if (res.ok) {
        setCommunications(await res.json());
      } else {
        toast({
          title: "שגיאה בטעינת הודעות",
          description: "לא ניתן לטעון את רשימת ההודעות",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה בטעינת הודעות",
        description: "אירעה שגיאה בעת טעינת ההודעות",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCommunications();
  }, [searchTerm, filterType, filterStatus]);

  const handleSendMessage = async () => {
    try {
      const payload = {
        ...composeData,
        targetId: composeData.targetId ? parseInt(composeData.targetId) : undefined,
        scheduledFor: composeData.scheduledFor || undefined
      };

      const res = await authFetch('/api/v1/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast({
          title: "הודעה נשלחה",
          description: "ההודעה נשלחה בהצלחה",
        });
        setShowCompose(false);
        setComposeData({
          title: '',
          content: '',
          type: 'ANNOUNCEMENT',
          priority: 'MEDIUM',
          targetType: 'ALL',
          targetId: '',
          scheduledFor: ''
        });
        loadCommunications();
      } else {
        const error = await res.text();
        toast({
          title: "שגיאה בשליחת הודעה",
          description: error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה בשליחת הודעה",
        description: "אירעה שגיאה בעת שליחת ההודעה",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'destructive';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'SCHEDULED': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'DRAFT': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ANNOUNCEMENT': return 'הודעה כללית';
      case 'TICKET_UPDATE': return 'עדכון קריאה';
      case 'PAYMENT_REMINDER': return 'תזכורת תשלום';
      case 'MAINTENANCE_NOTICE': return 'הודעת תחזוקה';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
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
          <h1 className="text-3xl font-bold tracking-tight">מרכז תקשורת</h1>
          <p className="text-muted-foreground">
            ניהול הודעות ותקשורת עם דיירים
          </p>
        </div>
        
        <Button onClick={() => setShowCompose(true)}>
          <Plus className="me-2 h-4 w-4" />
          הודעה חדשה
        </Button>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <Card>
          <CardHeader>
            <CardTitle>הודעה חדשה</CardTitle>
            <CardDescription>
              שלח הודעה לדיירים או קבוצות ספציפיות
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">כותרת</label>
                <Input
                  value={composeData.title}
                  onChange={(e) => setComposeData({...composeData, title: e.target.value})}
                  placeholder="כותרת ההודעה"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">סוג הודעה</label>
                <Select value={composeData.type} onValueChange={(value) => setComposeData({...composeData, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANNOUNCEMENT">הודעה כללית</SelectItem>
                    <SelectItem value="TICKET_UPDATE">עדכון קריאה</SelectItem>
                    <SelectItem value="PAYMENT_REMINDER">תזכורת תשלום</SelectItem>
                    <SelectItem value="MAINTENANCE_NOTICE">הודעת תחזוקה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">תוכן ההודעה</label>
              <Textarea
                value={composeData.content}
                onChange={(e) => setComposeData({...composeData, content: e.target.value})}
                placeholder="תוכן ההודעה..."
                rows={4}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium">עדיפות</label>
                <Select value={composeData.priority} onValueChange={(value) => setComposeData({...composeData, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">נמוכה</SelectItem>
                    <SelectItem value="MEDIUM">בינונית</SelectItem>
                    <SelectItem value="HIGH">גבוהה</SelectItem>
                    <SelectItem value="URGENT">דחופה</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">יעד</label>
                <Select value={composeData.targetType} onValueChange={(value) => setComposeData({...composeData, targetType: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">כל הדיירים</SelectItem>
                    <SelectItem value="BUILDING">בניין ספציפי</SelectItem>
                    <SelectItem value="UNIT">יחידה ספציפית</SelectItem>
                    <SelectItem value="USER">משתמש ספציפי</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">תזמון (אופציונלי)</label>
                <Input
                  type="datetime-local"
                  value={composeData.scheduledFor}
                  onChange={(e) => setComposeData({...composeData, scheduledFor: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCompose(false)}>
                ביטול
              </Button>
              <Button onClick={handleSendMessage}>
                <Send className="me-2 h-4 w-4" />
                שלח הודעה
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                  placeholder="חיפוש הודעות..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="סוג הודעה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסוגים</SelectItem>
                <SelectItem value="ANNOUNCEMENT">הודעה כללית</SelectItem>
                <SelectItem value="TICKET_UPDATE">עדכון קריאה</SelectItem>
                <SelectItem value="PAYMENT_REMINDER">תזכורת תשלום</SelectItem>
                <SelectItem value="MAINTENANCE_NOTICE">הודעת תחזוקה</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                <SelectItem value="SENT">נשלח</SelectItem>
                <SelectItem value="SCHEDULED">מתוזמן</SelectItem>
                <SelectItem value="DRAFT">טיוטה</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Communications List */}
      <div className="space-y-4">
        {communications.map((comm) => (
          <Card key={comm.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{comm.title}</CardTitle>
                    <Badge variant={getPriorityColor(comm.priority)}>
                      {comm.priority}
                    </Badge>
                    <Badge variant="outline">
                      {getTypeLabel(comm.type)}
                    </Badge>
                    {getStatusIcon(comm.status)}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {comm.content}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{comm.readCount}/{comm.totalRecipients} נקראו</span>
                  </div>
                  
                  {comm.targetName && (
                    <div className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      <span>{comm.targetName}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {comm.sentAt 
                        ? new Date(comm.sentAt).toLocaleDateString('he-IL')
                        : comm.scheduledFor 
                          ? `מתוזמן ל-${new Date(comm.scheduledFor).toLocaleDateString('he-IL')}`
                          : new Date(comm.createdAt).toLocaleDateString('he-IL')
                      }
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    צפה
                  </Button>
                  {comm.status === 'DRAFT' && (
                    <Button variant="outline" size="sm">
                      ערוך
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {communications.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">אין הודעות</h3>
            <p className="text-muted-foreground text-center mb-4">
              לא נמצאו הודעות התואמות לקריטריונים שלך
            </p>
            <Button onClick={() => setShowCompose(true)}>
              <Plus className="me-2 h-4 w-4" />
              שלח הודעה ראשונה
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
