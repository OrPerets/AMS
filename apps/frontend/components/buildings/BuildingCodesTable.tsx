import { useState } from 'react';
import { Copy, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';

interface BuildingCode {
  id: number;
  codeType: string;
  code: string;
  description?: string;
  isActive: boolean;
  validFrom: string;
  validUntil?: string;
  createdAt: string;
  creator?: {
    id: number;
    email: string;
  };
}

interface BuildingCodesTableProps {
  codes: BuildingCode[];
  onEdit: (code: BuildingCode) => void;
  onDelete: (codeId: number) => void;
}

const codeTypeLabels: Record<string, string> = {
  ENTRANCE: 'כניסה ראשית',
  SERVICE: 'כניסת שירות',
  ELEVATOR: 'מעלית',
  GATE: 'שער',
  PARKING: 'חניה',
  WIFI: 'WiFi',
  ALARM: 'אזעקה',
  OTHER: 'אחר',
};

export default function BuildingCodesTable({
  codes,
  onEdit,
  onDelete,
}: BuildingCodesTableProps) {
  const [visibleCodes, setVisibleCodes] = useState<Set<number>>(new Set());

  const toggleCodeVisibility = (codeId: number) => {
    const newVisible = new Set(visibleCodes);
    if (newVisible.has(codeId)) {
      newVisible.delete(codeId);
    } else {
      newVisible.add(codeId);
    }
    setVisibleCodes(newVisible);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('הקוד הועתק ללוח');
  };

  const isExpired = (validUntil?: string) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  const isExpiringSoon = (validUntil?: string) => {
    if (!validUntil) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  if (codes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        אין קודים עדיין. לחץ על &quot;הוסף קוד&quot; כדי להתחיל.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">סוג</TableHead>
            <TableHead className="text-right">קוד</TableHead>
            <TableHead className="text-right">תיאור</TableHead>
            <TableHead className="text-right">סטטוס</TableHead>
            <TableHead className="text-right">תוקף</TableHead>
            <TableHead className="text-right">פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {codes.map((code) => (
            <TableRow key={code.id}>
              <TableCell className="font-medium">
                {codeTypeLabels[code.codeType] || code.codeType}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-mono">
                    {visibleCodes.has(code.id) ? code.code : '••••••••'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCodeVisibility(code.id)}
                  >
                    {visibleCodes.has(code.id) ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(code.code)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>{code.description || '-'}</TableCell>
              <TableCell>
                {isExpired(code.validUntil) ? (
                  <Badge variant="destructive">פג תוקף</Badge>
                ) : !code.isActive ? (
                  <Badge variant="secondary">לא פעיל</Badge>
                ) : isExpiringSoon(code.validUntil) ? (
                  <Badge className="bg-yellow-500">פועל - מתקרב לתפוגה</Badge>
                ) : (
                  <Badge className="bg-green-500">פעיל</Badge>
                )}
              </TableCell>
              <TableCell>
                {code.validUntil ? (
                  <div className="text-sm">
                    <div>עד: {formatDate(code.validUntil)}</div>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">ללא הגבלה</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(code)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(code.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

