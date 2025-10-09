import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';

interface BuildingCode {
  id: number;
  codeType: string;
  code: string;
  description?: string;
  isActive: boolean;
  validFrom: string;
  validUntil?: string;
}

interface EditCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: BuildingCode | null;
  onSuccess: () => void;
}

export default function EditCodeDialog({
  open,
  onOpenChange,
  code,
  onSuccess,
}: EditCodeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    isActive: true,
    validUntil: '',
  });

  useEffect(() => {
    if (code) {
      setFormData({
        code: code.code,
        description: code.description || '',
        isActive: code.isActive,
        validUntil: code.validUntil
          ? new Date(code.validUntil).toISOString().split('T')[0]
          : '',
      });
    }
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000'}/api/v1/buildings/codes/${code.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formData,
            validUntil: formData.validUntil || null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update code');
      }

      toast.success('הקוד עודכן בהצלחה');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating code:', error);
      toast.error('שגיאה בעדכון הקוד');
    } finally {
      setLoading(false);
    }
  };

  if (!code) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>ערוך קוד</DialogTitle>
          <DialogDescription>
            עדכן את פרטי הקוד או הסיסמה
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">קוד / סיסמה *</Label>
            <Input
              id="code"
              type="text"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              placeholder="הזן קוד או סיסמה"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Input
              id="description"
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder='למשל: "כניסה ראשית קומת קרקע"'
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="validUntil">תוקף עד תאריך (אופציונלי)</Label>
            <Input
              id="validUntil"
              type="date"
              value={formData.validUntil}
              onChange={(e) =>
                setFormData({ ...formData, validUntil: e.target.value })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">קוד פעיל</Label>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked })
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              ביטול
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'שומר...' : 'שמור שינויים'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

