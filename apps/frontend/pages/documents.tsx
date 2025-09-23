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

interface Document {
  id: number;
  title: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  buildingId?: number;
  buildingName?: string;
  unitId?: number;
  unitNumber?: string;
  assetId?: number;
  assetName?: string;
  contractId?: number;
  expenseId?: number;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterBuilding, setFilterBuilding] = useState('all');
  const { t } = useLocale();

  async function loadDocuments() {
    try {
      const query = new URLSearchParams();
      if (searchTerm) query.append('search', searchTerm);
      if (filterType !== 'all') query.append('type', filterType);
      if (filterBuilding !== 'all') query.append('buildingId', filterBuilding);
      
      const res = await authFetch(`/api/v1/documents?${query.toString()}`);
      if (res.ok) {
        setDocuments(await res.json());
      } else {
        toast({
          title: "שגיאה בטעינת מסמכים",
          description: "לא ניתן לטעון את רשימת המסמכים",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה בטעינת מסמכים",
        description: "אירעה שגיאה בעת טעינת המסמכים",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, [searchTerm, filterType, filterBuilding]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
          <p className="text-muted-foreground">
            ניהול מסמכים ומשאבי מידע
          </p>
        </div>
        
        <Button>
          <Upload className="me-2 h-4 w-4" />
          העלה מסמך
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
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getFileIcon(doc.type)}</span>
                  <div>
                    <CardTitle className="text-sm font-medium line-clamp-1">
                      {doc.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {doc.type.toUpperCase()} • {formatFileSize(doc.size)}
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm text-muted-foreground">
                {doc.buildingName && (
                  <div className="flex items-center gap-2">
                    <Building className="h-3 w-3" />
                    <span>{doc.buildingName}</span>
                    {doc.unitNumber && <span>יחידה {doc.unitNumber}</span>}
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  <span>{doc.uploadedBy}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(doc.uploadedAt).toLocaleDateString('he-IL')}</span>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="me-2 h-3 w-3" />
                  הורד
                </Button>
                <Button variant="outline" size="sm">
                  צפה
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
