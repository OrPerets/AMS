import { useState } from 'react';
import { useRouter } from 'next/router';
import { authFetch } from '../../lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { X } from 'lucide-react';

export default function CreateVotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    buildingId: 1, // Default, should be from user context
    title: '',
    description: '',
    question: '',
    voteType: 'YES_NO',
    endDate: '',
    options: ['', ''],
  });

  const handleAddOption = () => {
    setFormData({ ...formData, options: [...formData.options, ''] });
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        buildingId: formData.buildingId,
        title: formData.title,
        description: formData.description,
        question: formData.question,
        voteType: formData.voteType,
        endDate: formData.endDate,
      };

      if (formData.voteType === 'MULTIPLE_CHOICE') {
        payload.options = formData.options.filter(o => o.trim());
      }

      const res = await authFetch('/api/v1/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('ההצבעה נוצרה בהצלחה!');
        router.push('/votes');
      } else {
        throw new Error('Failed to create vote');
      }
    } catch (error) {
      console.error('Error creating vote:', error);
      toast.error('שגיאה ביצירת ההצבעה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>יצירת הצבעה חדשה</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">כותרת *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">תיאור</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="question">שאלה *</Label>
              <Input
                id="question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="voteType">סוג הצבעה *</Label>
              <Select value={formData.voteType} onValueChange={(value) => setFormData({ ...formData, voteType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YES_NO">כן/לא</SelectItem>
                  <SelectItem value="MULTIPLE_CHOICE">בחירה מרובה</SelectItem>
                  <SelectItem value="RATING">דירוג (1-5)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.voteType === 'MULTIPLE_CHOICE' && (
              <div>
                <Label>אופציות</Label>
                {formData.options.map((option, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`אופציה ${index + 1}`}
                    />
                    {formData.options.length > 2 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveOption(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
                  הוסף אופציה
                </Button>
              </div>
            )}

            <div>
              <Label htmlFor="endDate">תאריך סיום *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/votes')}>
                ביטול
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'יוצר...' : 'צור הצבעה'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

