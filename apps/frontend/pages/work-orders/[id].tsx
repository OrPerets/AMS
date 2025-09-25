import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ArrowLeft, ClipboardSignature, DollarSign, Factory, FileText, Timer, Edit, Check, X, Camera, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { authFetch } from "../../lib/auth";
import { toast } from "../../components/ui/use-toast";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  PENDING: "ממתין",
  APPROVED: "מאושר",
  IN_PROGRESS: "בתהליך",
  COMPLETED: "הושלם",
  INVOICED: "חויב",
};

interface WorkOrder {
  id: number;
  ticketId: number;
  supplierId: number;
  costEstimate?: number;
  laborCost?: number;
  materialCost?: number;
  equipmentCost?: number;
  tax?: number;
  totalCost?: number;
  costNotes?: string;
  status: 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'INVOICED';
  approvedById?: number;
  approvedAt?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  completedAt?: string;
  photos: string[];
  ticket: {
    id: number;
    unitId: number;
    severity: string;
    status: string;
  };
  supplier: {
    id: number;
    name: string;
    skills: string[];
    rating?: number;
  };
}

export default function WorkOrderDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingCosts, setEditingCosts] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [editingPhotos, setEditingPhotos] = useState(false);
  
  // Form states
  const [costForm, setCostForm] = useState({
    laborCost: '',
    materialCost: '',
    equipmentCost: '',
    tax: '',
    costNotes: ''
  });
  
  const [statusForm, setStatusForm] = useState({
    status: '',
    scheduledStart: '',
    scheduledEnd: '',
    completedAt: '',
    notes: ''
  });
  
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const loadWorkOrder = async () => {
    if (!id) return;
    try {
      const res = await authFetch(`/api/v1/work-orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setWorkOrder(data);
        setCostForm({
          laborCost: data.laborCost?.toString() || '',
          materialCost: data.materialCost?.toString() || '',
          equipmentCost: data.equipmentCost?.toString() || '',
          tax: data.tax?.toString() || '',
          costNotes: data.costNotes || ''
        });
        setStatusForm({
          status: data.status,
          scheduledStart: data.scheduledStart ? new Date(data.scheduledStart).toISOString().slice(0, 16) : '',
          scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd).toISOString().slice(0, 16) : '',
          completedAt: data.completedAt ? new Date(data.completedAt).toISOString().slice(0, 16) : '',
          notes: data.costNotes || ''
        });
      }
    } catch (error) {
      toast({ title: 'שגיאה בטעינת הזמנת העבודה', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkOrder();
  }, [id]);

  const updateCosts = async () => {
    try {
      const res = await authFetch(`/api/v1/work-orders/${id}/costs`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          laborCost: costForm.laborCost ? parseFloat(costForm.laborCost) : undefined,
          materialCost: costForm.materialCost ? parseFloat(costForm.materialCost) : undefined,
          equipmentCost: costForm.equipmentCost ? parseFloat(costForm.equipmentCost) : undefined,
          tax: costForm.tax ? parseFloat(costForm.tax) : undefined,
          costNotes: costForm.costNotes
        })
      });
      
      if (res.ok) {
        toast({ title: 'עלויות עודכנו בהצלחה' });
        setEditingCosts(false);
        loadWorkOrder();
      } else {
        throw new Error('Failed to update costs');
      }
    } catch (error) {
      toast({ title: 'שגיאה בעדכון עלויות', variant: 'destructive' });
    }
  };

  const updateStatus = async () => {
    try {
      const res = await authFetch(`/api/v1/work-orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusForm.status,
          scheduledStart: statusForm.scheduledStart || undefined,
          scheduledEnd: statusForm.scheduledEnd || undefined,
          completedAt: statusForm.completedAt || undefined,
          notes: statusForm.notes
        })
      });
      
      if (res.ok) {
        toast({ title: 'סטטוס עודכן בהצלחה' });
        setEditingStatus(false);
        loadWorkOrder();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast({ title: 'שגיאה בעדכון סטטוס', variant: 'destructive' });
    }
  };

  const updatePhotos = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    try {
      const formData = new FormData();
      Array.from(selectedFiles).forEach(file => {
        formData.append('photos', file);
      });
      
      const res = await authFetch(`/api/v1/work-orders/${id}/photos`, {
        method: 'PATCH',
        body: formData
      });
      
      if (res.ok) {
        toast({ title: 'תמונות עודכנו בהצלחה' });
        setEditingPhotos(false);
        setSelectedFiles(null);
        loadWorkOrder();
      } else {
        throw new Error('Failed to update photos');
      }
    } catch (error) {
      toast({ title: 'שגיאה בעדכון תמונות', variant: 'destructive' });
    }
  };

  const approveWorkOrder = async () => {
    try {
      const res = await authFetch(`/api/v1/work-orders/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvedById: 1 // This should come from the current user context
        })
      });
      
      if (res.ok) {
        toast({ title: 'הזמנת העבודה אושרה' });
        loadWorkOrder();
      } else {
        throw new Error('Failed to approve work order');
      }
    } catch (error) {
      toast({ title: 'שגיאה באישור הזמנת העבודה', variant: 'destructive' });
    }
  };

  if (loading) return <div>טוען...</div>;
  if (!workOrder) return <div>הזמנת עבודה לא נמצאה</div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">פרטי הזמנת עבודה</p>
          <h1 className="text-3xl font-bold text-foreground">#{workOrder.id}</h1>
        </div>
        <div className="flex gap-2">
          {workOrder.status === 'PENDING' && (
            <Button onClick={approveWorkOrder} className="bg-green-600 hover:bg-green-700">
              <Check className="h-4 w-4 mr-2" />
              אשר הזמנה
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/maintenance" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> חזרה לתחזוקה
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ספק מבצע</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-foreground">
            <Factory className="h-4 w-4" /> {workOrder.supplier.name}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              סטטוס
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingStatus(!editingStatus)}
              >
                <Edit className="h-3 w-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-foreground">
            <Badge variant="secondary" className="text-xs">
              {statusLabels[workOrder.status]}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">תאריך משוער</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-foreground">
            <Timer className="h-4 w-4" />
            {workOrder.scheduledStart ? format(new Date(workOrder.scheduledStart), "PPPP", { locale: he }) : "לא הוגדר"}
          </CardContent>
        </Card>
      </div>

      {/* Status Update Form */}
      {editingStatus && (
        <Card>
          <CardHeader>
            <CardTitle>עדכון סטטוס</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">סטטוס</label>
                <Select value={statusForm.status} onValueChange={(value) => setStatusForm(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">ממתין</SelectItem>
                    <SelectItem value="APPROVED">מאושר</SelectItem>
                    <SelectItem value="IN_PROGRESS">בתהליך</SelectItem>
                    <SelectItem value="COMPLETED">הושלם</SelectItem>
                    <SelectItem value="INVOICED">חויב</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">תאריך התחלה מתוכנן</label>
                <Input
                  type="datetime-local"
                  value={statusForm.scheduledStart}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, scheduledStart: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">תאריך סיום מתוכנן</label>
                <Input
                  type="datetime-local"
                  value={statusForm.scheduledEnd}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, scheduledEnd: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">תאריך השלמה</label>
                <Input
                  type="datetime-local"
                  value={statusForm.completedAt}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, completedAt: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">הערות</label>
              <Textarea
                value={statusForm.notes}
                onChange={(e) => setStatusForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={updateStatus}>
                <Check className="h-4 w-4 mr-2" />
                שמור
              </Button>
              <Button variant="outline" onClick={() => setEditingStatus(false)}>
                <X className="h-4 w-4 mr-2" />
                ביטול
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              מעקב עלויות
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingCosts(!editingCosts)}
            >
              <Edit className="h-3 w-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editingCosts ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">עלות עבודה</label>
                  <Input
                    type="number"
                    value={costForm.laborCost}
                    onChange={(e) => setCostForm(prev => ({ ...prev, laborCost: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">עלות חומרים</label>
                  <Input
                    type="number"
                    value={costForm.materialCost}
                    onChange={(e) => setCostForm(prev => ({ ...prev, materialCost: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">עלות ציוד</label>
                  <Input
                    type="number"
                    value={costForm.equipmentCost}
                    onChange={(e) => setCostForm(prev => ({ ...prev, equipmentCost: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">מס</label>
                  <Input
                    type="number"
                    value={costForm.tax}
                    onChange={(e) => setCostForm(prev => ({ ...prev, tax: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">הערות עלויות</label>
                <Textarea
                  value={costForm.costNotes}
                  onChange={(e) => setCostForm(prev => ({ ...prev, costNotes: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={updateCosts}>
                  <Check className="h-4 w-4 mr-2" />
                  שמור
                </Button>
                <Button variant="outline" onClick={() => setEditingCosts(false)}>
                  <X className="h-4 w-4 mr-2" />
                  ביטול
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                <p className="text-xs font-medium text-foreground">עלות משוערת</p>
                <p className="flex items-center gap-2 text-foreground">
                  <DollarSign className="h-4 w-4" /> ₪{workOrder.costEstimate?.toLocaleString("he-IL") || '0'}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                <p className="text-xs font-medium text-foreground">עלות עבודה</p>
                <p className="flex items-center gap-2 text-foreground">
                  <DollarSign className="h-4 w-4" /> ₪{workOrder.laborCost?.toLocaleString("he-IL") || '0'}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                <p className="text-xs font-medium text-foreground">עלות חומרים</p>
                <p className="flex items-center gap-2 text-foreground">
                  <DollarSign className="h-4 w-4" /> ₪{workOrder.materialCost?.toLocaleString("he-IL") || '0'}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                <p className="text-xs font-medium text-foreground">סה"כ עלות</p>
                <p className="flex items-center gap-2 text-foreground">
                  <DollarSign className="h-4 w-4" /> ₪{workOrder.totalCost?.toLocaleString("he-IL") || '0'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              תמונות ({workOrder.photos.length})
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingPhotos(!editingPhotos)}
            >
              <Upload className="h-3 w-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editingPhotos ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">בחר תמונות</label>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setSelectedFiles(e.target.files)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={updatePhotos} disabled={!selectedFiles || selectedFiles.length === 0}>
                  <Upload className="h-4 w-4 mr-2" />
                  העלה תמונות
                </Button>
                <Button variant="outline" onClick={() => setEditingPhotos(false)}>
                  <X className="h-4 w-4 mr-2" />
                  ביטול
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {workOrder.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Work order photo ${index + 1}`}
                  className="rounded-lg object-cover h-32 w-full"
                />
              ))}
              {workOrder.photos.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-full text-center py-8">
                  אין תמונות עדיין
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work Order Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ClipboardSignature className="h-5 w-5" /> פירוט עבודה
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="text-xs font-medium text-foreground">קריאת שירות</p>
            <p>#{workOrder.ticket.id} - יחידה {workOrder.ticket.unitId}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="text-xs font-medium text-foreground">הערות</p>
            <p>{workOrder.costNotes || 'אין הערות'}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="text-xs font-medium text-foreground">ספק</p>
            <p>{workOrder.supplier.name}</p>
            <p className="text-xs">מיומנויות: {workOrder.supplier.skills.join(', ')}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="text-xs font-medium text-foreground">סטטוס קריאה</p>
            <p>{workOrder.ticket.status}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
