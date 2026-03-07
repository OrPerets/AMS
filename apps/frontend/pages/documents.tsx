import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileStack, FolderOpen, Lock, Search, Share2, ShieldCheck, Upload } from 'lucide-react';
import { authFetch, getCurrentUserId } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from '../components/ui/use-toast';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

type AccessLevel = 'PUBLIC' | 'PRIVATE' | 'RESTRICTED';
type SharePermission = 'VIEW' | 'DOWNLOAD' | 'EDIT' | 'DELETE';

interface UserRef {
  id: number;
  email: string;
}

interface DocumentVersion {
  id: number;
  name: string;
  url: string;
  version: number;
  uploadedAt: string;
  isLatest: boolean;
}

interface DocumentShare {
  id: number;
  userId: number;
  permission: SharePermission;
  expiresAt?: string | null;
  user?: UserRef | null;
}

interface DocumentItem {
  id: number;
  name: string;
  category?: string | null;
  description?: string | null;
  uploadedAt: string;
  uploadedBy?: UserRef | null;
  buildingId?: number | null;
  url: string;
  fileSize?: number | null;
  mimeType?: string | null;
  version: number;
  isLatest: boolean;
  accessLevel: AccessLevel;
  versions?: DocumentVersion[];
  sharedWith?: DocumentShare[];
}

const emptyUpload = {
  name: '',
  category: '',
  description: '',
  tags: '',
  accessLevel: 'PRIVATE' as AccessLevel,
};

export default function DocumentsPage() {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const [shares, setShares] = useState<DocumentShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accessFilter, setAccessFilter] = useState<'all' | AccessLevel>('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState(emptyUpload);
  const [shareUserId, setShareUserId] = useState('');
  const [sharePermission, setSharePermission] = useState<SharePermission>('VIEW');
  const [shareExpiresAt, setShareExpiresAt] = useState('');

  useEffect(() => {
    setCurrentUserId(getCurrentUserId());
  }, []);

  async function loadDocuments() {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (searchTerm) query.append('search', searchTerm);
      if (categoryFilter !== 'all') query.append('type', categoryFilter);
      const res = await authFetch(`/api/v1/documents${query.toString() ? `?${query.toString()}` : ''}`);
      if (!res.ok) throw new Error(await res.text());
      setDocuments(await res.json());
    } catch {
      toast({
        title: 'שגיאה בטעינת מסמכים',
        description: 'לא ניתן לטעון את רשימת המסמכים.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadDocumentDetails(documentId: number) {
    try {
      setDetailsLoading(true);
      const [documentRes, sharesRes] = await Promise.all([
        authFetch(`/api/v1/documents/${documentId}`),
        authFetch(`/api/v1/documents/${documentId}/shares`),
      ]);
      if (!documentRes.ok) throw new Error(await documentRes.text());
      const documentData = await documentRes.json();
      setSelectedDocument(documentData);
      setShares(sharesRes.ok ? await sharesRes.json() : []);
    } catch {
      toast({
        title: 'טעינת פרטי מסמך נכשלה',
        description: 'לא ניתן להציג כעת הרשאות וגרסאות למסמך זה.',
        variant: 'destructive',
      });
    } finally {
      setDetailsLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, [searchTerm, categoryFilter]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => {
      if (accessFilter !== 'all' && document.accessLevel !== accessFilter) {
        return false;
      }
      return true;
    });
  }, [accessFilter, documents]);

  const categories = useMemo(() => {
    return Array.from(new Set(documents.map((document) => document.category).filter(Boolean))) as string[];
  }, [documents]);

  const latestDocuments = useMemo(() => {
    return filteredDocuments.filter((document) => document.isLatest);
  }, [filteredDocuments]);

  function resetUploadState() {
    setUploadData(emptyUpload);
    setUploadFile(null);
  }

  async function handleUpload() {
    if (!uploadFile) return;
    try {
      const form = new FormData();
      form.append('file', uploadFile);
      form.append('name', uploadData.name || uploadFile.name);
      form.append('category', uploadData.category);
      form.append('description', uploadData.description);
      form.append('accessLevel', uploadData.accessLevel);
      if (currentUserId) form.append('uploadedById', String(currentUserId));
      if (uploadData.tags.trim()) {
        uploadData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
          .forEach((tag) => form.append('tags', tag));
      }
      const res = await authFetch('/api/v1/documents/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'המסמך הועלה בהצלחה' });
      setUploadOpen(false);
      resetUploadState();
      await loadDocuments();
    } catch {
      toast({
        title: 'העלאת המסמך נכשלה',
        description: 'בדוק את הקובץ ונסה שוב.',
        variant: 'destructive',
      });
    }
  }

  async function handleShare() {
    if (!selectedDocument || !shareUserId) return;
    try {
      const res = await authFetch(`/api/v1/documents/${selectedDocument.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: Number(shareUserId),
          permission: sharePermission,
          expiresAt: shareExpiresAt || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'הרשאת השיתוף נשמרה' });
      setShareOpen(false);
      setShareUserId('');
      setSharePermission('VIEW');
      setShareExpiresAt('');
      await loadDocumentDetails(selectedDocument.id);
    } catch {
      toast({
        title: 'שיתוף המסמך נכשל',
        description: 'לא ניתן לשמור הרשאה עבור המשתמש שנבחר.',
        variant: 'destructive',
      });
    }
  }

  async function handleVersionUpload() {
    if (!selectedDocument || !versionFile) return;
    try {
      const form = new FormData();
      form.append('file', versionFile);
      form.append('name', versionFile.name);
      form.append('category', selectedDocument.category ?? '');
      form.append('description', selectedDocument.description ?? '');
      form.append('accessLevel', selectedDocument.accessLevel);
      const res = await authFetch(`/api/v1/documents/${selectedDocument.id}/version/upload`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'נוצרה גרסה חדשה למסמך' });
      setVersionOpen(false);
      setVersionFile(null);
      await loadDocuments();
      await loadDocumentDetails(selectedDocument.id);
    } catch {
      toast({
        title: 'יצירת גרסה נכשלה',
        description: 'לא ניתן היה להעלות גרסה חדשה למסמך.',
        variant: 'destructive',
      });
    }
  }

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return 'לא ידוע';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
    return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${sizes[index]}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
          <Skeleton className="h-[520px]" />
          <Skeleton className="h-[520px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">מסמכים</h1>
          <p className="text-muted-foreground">חיפוש, העלאה, שיתוף, הורדה וניהול גרסאות למסמכי המערכת.</p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="me-2 h-4 w-4" />
              העלאת מסמך
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>העלאת מסמך חדש</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>שם</Label>
                <Input value={uploadData.name} onChange={(event) => setUploadData((current) => ({ ...current, name: event.target.value }))} />
              </div>
              <div>
                <Label>קטגוריה</Label>
                <Input value={uploadData.category} onChange={(event) => setUploadData((current) => ({ ...current, category: event.target.value }))} placeholder="חוזה, דוח, חשבונית" />
              </div>
              <div>
                <Label>תיאור</Label>
                <Textarea value={uploadData.description} onChange={(event) => setUploadData((current) => ({ ...current, description: event.target.value }))} rows={3} />
              </div>
              <div>
                <Label>תגיות</Label>
                <Input value={uploadData.tags} onChange={(event) => setUploadData((current) => ({ ...current, tags: event.target.value }))} placeholder="מופרד בפסיקים" />
              </div>
              <div>
                <Label>רמת גישה</Label>
                <Select value={uploadData.accessLevel} onValueChange={(value: AccessLevel) => setUploadData((current) => ({ ...current, accessLevel: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIVATE">פרטי</SelectItem>
                    <SelectItem value="RESTRICTED">מוגבל</SelectItem>
                    <SelectItem value="PUBLIC">ציבורי</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>קובץ</Label>
                <Input type="file" onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadOpen(false)}>
                ביטול
              </Button>
              <Button onClick={handleUpload} disabled={!uploadFile}>
                העלה
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>מסמכים אחרונים</CardDescription>
            <CardTitle>{latestDocuments.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">מסמכים בגרסה האחרונה בלבד</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>קטגוריות פעילות</CardDescription>
            <CardTitle>{categories.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">חיפוש וסינון לפי קטגוריה</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>גישה מוגבלת</CardDescription>
            <CardTitle>{documents.filter((document) => document.accessLevel !== 'PUBLIC').length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">מסמכים עם הרשאות פרטיות או מוגבלות</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>חיפוש וסינון</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="חיפוש בשם, תיאור או תגית" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="כל הקטגוריות" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הקטגוריות</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={accessFilter} onValueChange={(value: 'all' | AccessLevel) => setAccessFilter(value)}>
            <SelectTrigger>
              <SelectValue placeholder="כל רמות הגישה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל רמות הגישה</SelectItem>
              <SelectItem value="PRIVATE">פרטי</SelectItem>
              <SelectItem value="RESTRICTED">מוגבל</SelectItem>
              <SelectItem value="PUBLIC">ציבורי</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-4">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg">{document.name}</CardTitle>
                  <Badge variant="outline">{document.category || 'ללא קטגוריה'}</Badge>
                  <Badge>{document.accessLevel}</Badge>
                  {!document.isLatest && <Badge variant="secondary">גרסה ישנה</Badge>}
                </div>
                <CardDescription>{document.description || 'ללא תיאור נוסף למסמך זה.'}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-4">
                  <span>גרסה {document.version}</span>
                  <span>{formatFileSize(document.fileSize)}</span>
                  <span>{document.mimeType || 'סוג לא ידוע'}</span>
                  <span>{new Date(document.uploadedAt).toLocaleString('he-IL')}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={document.url} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm">
                      <Download className="me-2 h-4 w-4" />
                      הורדה
                    </Button>
                  </a>
                  <Button variant="secondary" size="sm" onClick={() => loadDocumentDetails(document.id)}>
                    פרטים
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredDocuments.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold">אין מסמכים להצגה</h3>
                <p className="text-muted-foreground">התאם את הסינון או העלה מסמך חדש.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>הרשאות וגרסאות</CardTitle>
            <CardDescription>פרטי הרשאה, שיתופים ושרשרת גרסאות למסמך שנבחר.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {detailsLoading && <Skeleton className="h-72 w-full" />}

            {!detailsLoading && !selectedDocument && (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                בחר מסמך כדי לצפות בהרשאות, רשימת שיתופים וגרסאות.
              </div>
            )}

            {!detailsLoading && selectedDocument && (
              <>
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold">{selectedDocument.name}</h3>
                    <Badge>{selectedDocument.accessLevel}</Badge>
                    <Badge variant="outline">גרסה {selectedDocument.version}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedDocument.description || 'ללא תיאור נוסף.'}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
                      <Share2 className="me-2 h-4 w-4" />
                      שתף הרשאה
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setVersionOpen(true)}>
                      <FileStack className="me-2 h-4 w-4" />
                      העלה גרסה חדשה
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <ShieldCheck className="h-4 w-4" />
                    שיתופים והרשאות
                  </div>
                  <div className="space-y-2">
                    {shares.length === 0 && (
                      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">אין שיתופים למסמך זה.</div>
                    )}
                    {shares.map((share) => (
                      <div key={share.id} className="rounded-lg border p-3 text-sm">
                        <div className="font-medium">{share.user?.email || `משתמש #${share.userId}`}</div>
                        <div className="text-muted-foreground">
                          {share.permission}
                          {share.expiresAt ? ` • עד ${new Date(share.expiresAt).toLocaleString('he-IL')}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Lock className="h-4 w-4" />
                    גרסאות המסמך
                  </div>
                  <div className="space-y-2">
                    {selectedDocument.versions && selectedDocument.versions.length > 0 ? (
                      selectedDocument.versions.map((version) => (
                        <div key={version.id} className="rounded-lg border p-3 text-sm">
                          <div className="font-medium">
                            גרסה {version.version} {version.isLatest ? '(נוכחית)' : ''}
                          </div>
                          <div className="text-muted-foreground">{new Date(version.uploadedAt).toLocaleString('he-IL')}</div>
                          <a href={version.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-primary underline-offset-4 hover:underline">
                            פתח קובץ גרסה
                          </a>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">אין גרסאות נוספות למסמך זה.</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>שיתוף מסמך</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>מזהה משתמש</Label>
              <Input value={shareUserId} onChange={(event) => setShareUserId(event.target.value)} placeholder="לדוגמה: 12" />
            </div>
            <div>
              <Label>הרשאה</Label>
              <Select value={sharePermission} onValueChange={(value: SharePermission) => setSharePermission(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIEW">צפייה</SelectItem>
                  <SelectItem value="DOWNLOAD">הורדה</SelectItem>
                  <SelectItem value="EDIT">עריכה</SelectItem>
                  <SelectItem value="DELETE">מחיקה</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>תאריך תפוגה</Label>
              <Input type="datetime-local" value={shareExpiresAt} onChange={(event) => setShareExpiresAt(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleShare} disabled={!shareUserId}>
              שמור הרשאה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={versionOpen} onOpenChange={setVersionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>העלאת גרסה חדשה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>מסמך</Label>
              <div className="text-sm text-muted-foreground">{selectedDocument?.name || 'לא נבחר מסמך'}</div>
            </div>
            <div>
              <Label>קובץ גרסה</Label>
              <Input type="file" onChange={(event) => setVersionFile(event.target.files?.[0] ?? null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVersionOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleVersionUpload} disabled={!versionFile || !selectedDocument}>
              העלה גרסה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
