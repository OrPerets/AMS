import React, { useEffect, useState } from 'react';
import { 
  Upload, 
  Download, 
  Search, 
  Filter, 
  FileText, 
  Folder,
  Building,
  Calendar,
  User,
  MoreVertical
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Label } from '../components/ui/label'

interface Document {
  id: number;
  name: string; // align with backend
  category?: string;
  uploadedAt: string;
  uploadedBy?: { email?: string } | string;
  buildingId?: number;
  unitId?: number;
  assetId?: number;
  contractId?: number;
  expenseId?: number;
  url: string;
  fileSize?: number;
  mimeType?: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterBuilding, setFilterBuilding] = useState('all');
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('');
  const [name, setName] = useState('');
  const [shareOpen, setShareOpen] = useState<number | null>(null);
  const [shareUserId, setShareUserId] = useState('');
  const [sharePermission, setSharePermission] = useState<'VIEW'|'DOWNLOAD'|'EDIT'|'DELETE'>('VIEW');
  const [shareExpiresAt, setShareExpiresAt] = useState('');
  const { t } = useLocale();

  async function loadDocuments() {
    try {
      const query = new URLSearchParams();
      if (searchTerm) query.append('search', searchTerm);
      if (filterType !== 'all') query.append('type', filterType);
      if (filterBuilding !== 'all') query.append('buildingId', filterBuilding);
      const res = await authFetch(`/api/v1/documents?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      } else {
        toast({ title: 'שגיאה בטעינת מסמכים', description: 'לא ניתן לטעון את רשימת המסמכים', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'שגיאה בטעינת מסמכים', description: 'אירעה שגיאה בעת טעינת המסמכים', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, [searchTerm, filterType, filterBuilding]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '—';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  async function onUpload() {
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    if (category) form.append('category', category);
    if (name) form.append('name', name);
    const res = await authFetch('/api/v1/documents/upload', { method: 'POST', body: form });
    if (res.ok) {
      toast({ title: 'העלאה הצליחה' });
      setOpen(false);
      setFile(null);
      setCategory('');
      setName('');
      loadDocuments();
    } else {
      toast({ title: 'העלאה נכשלה', variant: 'destructive' });
    }
  }

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      default:
        return '📁';
    }
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
            <Skeleton key={i} className="h-32" />
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
          <h1 className="text-3xl font-bold tracking-tight">מסמכים</h1>
          <p className="text-muted-foreground">ניהול מסמכים ומשאבי מידע</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="me-2 h-4 w-4" /> העלה מסמך
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>העלה מסמך</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>שם</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם קובץ" />
              </div>
              <div>
                <Label>קטגוריה</Label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="למשל: חוזה, חשבונית" />
              </div>
              <div>
                <Label>קובץ</Label>
                <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={onUpload} disabled={!file}>העלה</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                  placeholder="חיפוש מסמכים..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="סוג מסמך" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסוגים</SelectItem>
                <SelectItem value="contract">חוזים</SelectItem>
                <SelectItem value="invoice">חשבוניות</SelectItem>
                <SelectItem value="report">דוחות</SelectItem>
                <SelectItem value="manual">מדריכים</SelectItem>
                <SelectItem value="other">אחר</SelectItem>
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

      {/* Documents Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => (
          <Card key={doc.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-medium line-clamp-1">{doc.name}</CardTitle>
                  <CardDescription className="text-xs">{doc.category ?? '—'} • {formatFileSize(doc.fileSize)}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>תאריך: {new Date(doc.uploadedAt).toLocaleDateString('he-IL')}</div>
              </div>
              <div className="flex gap-2 mt-4">
                <a href={doc.url} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm">צפה/הורד</Button>
                </a>
                <Button variant="secondary" size="sm" onClick={() => setShareOpen(doc.id)}>שתף</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={shareOpen !== null} onOpenChange={(o) => !o && setShareOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>שיתוף מסמך</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>מזהה משתמש</Label>
              <Input value={shareUserId} onChange={(e) => setShareUserId(e.target.value)} placeholder="לדוגמה: 12" />
            </div>
            <div>
              <Label>הרשאה</Label>
              <select className="border rounded px-2 py-1 w-full" value={sharePermission} onChange={(e) => setSharePermission(e.target.value as any)}>
                <option value="VIEW">צפייה</option>
                <option value="DOWNLOAD">הורדה</option>
                <option value="EDIT">עריכה</option>
                <option value="DELETE">מחיקה</option>
              </select>
            </div>
            <div>
              <Label>תאריך תפוגה (אופציונלי)</Label>
              <Input type="datetime-local" value={shareExpiresAt} onChange={(e) => setShareExpiresAt(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={async () => {
                if (!shareOpen) return;
                const res = await authFetch(`/api/v1/documents/${shareOpen}/share`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: Number(shareUserId), permission: sharePermission, expiresAt: shareExpiresAt || undefined })
                });
                if (res.ok) {
                  toast({ title: 'שיתוף נוצר' });
                  setShareOpen(null);
                  setShareUserId('');
                  setSharePermission('VIEW');
                  setShareExpiresAt('');
                } else {
                  toast({ title: 'שיתוף נכשל', variant: 'destructive' });
                }
              }}
              disabled={!shareUserId}
            >
              שתף
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {documents.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Folder className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">אין מסמכים</h3>
            <p className="text-muted-foreground text-center mb-4">
              לא נמצאו מסמכים התואמים לקריטריונים שלך
            </p>
            <Button>
              <Upload className="me-2 h-4 w-4" />
              העלה מסמך ראשון
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
