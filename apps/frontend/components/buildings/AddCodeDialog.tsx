import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { toast } from 'sonner';

interface AddCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildingId: number;
  onSuccess: () => void;
}

const codeTypes = [
  { value: 'ENTRANCE', label: 'כניסה ראשית' },
  { value: 'SERVICE', label: 'כניסת שירות' },
  { value: 'ELEVATOR', label: 'מעלית' },
  { value: 'GATE', label: 'שער' },
  { value: 'PARKING', label: 'חניה' },
  { value: 'WIFI', label: 'WiFi' },
  { value: 'ALARM', label: 'אזעקה' },
  { value: 'OTHER', label: 'אחר' },
];

export default function AddCodeDialog({
  open,
  onOpenChange,
  buildingId,
  onSuccess,
}: AddCodeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    codeType: 'ENTRANCE',
    code: '',
    description: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000'}/api/v1/buildings/${buildingId}/codes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formData,
            buildingId,
            validUntil: formData.validUntil || undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create code');
      }

      toast.success('הקוד נוסף בהצלחה');
      onSuccess();
      onOpenChange(false);
      // Reset form
      setFormData({
        codeType: 'ENTRANCE',
        code: '',
        description: '',
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: '',
      });
    } catch (error) {
      console.error('Error creating code:', error);
      toast.error('שגיאה בהוספת הקוד');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>הוסף קוד חדש</DialogTitle>
          <DialogDescription>
            הוסף קוד גישה או סיסמה לבניין
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="codeType">סוג קוד *</Label>
            <Select
              value={formData.codeType}
              onValueChange={(value) =>
                setFormData({ ...formData, codeType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {codeTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validFrom">תוקף מתאריך</Label>
              <Input
                id="validFrom"
                type="date"
                value={formData.validFrom}
                onChange={(e) =>
                  setFormData({ ...formData, validFrom: e.target.value })
                }
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
              {loading ? 'שומר...' : 'הוסף קוד'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

