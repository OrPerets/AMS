import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { authFetch } from '../../lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';

interface VoteOption {
  id: number;
  optionText: string;
  order: number;
}

interface Vote {
  id: number;
  title: string;
  description?: string;
  question: string;
  voteType: string;
  endDate: string;
  isActive: boolean;
  isClosed: boolean;
  userHasVoted: boolean;
  responseCount: number;
  options: VoteOption[];
}

export default function VoteDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [vote, setVote] = useState<Vote | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [yesNoResponse, setYesNoResponse] = useState<boolean | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadVote();
  }, [id]);

  const loadVote = async () => {
    try {
      const res = await authFetch(`/api/v1/votes/${id}`);
      if (res.ok) {
        const data = await res.json();
        setVote(data);
      }
    } catch (error) {
      console.error('Error loading vote:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVote = async () => {
    if (!vote) return;

    const payload: any = { comment };

    if (vote.voteType === 'YES_NO') {
      if (yesNoResponse === null) {
        toast.error('אנא בחר כן או לא');
        return;
      }
      payload.response = yesNoResponse;
    } else if (vote.voteType === 'MULTIPLE_CHOICE') {
      if (!selectedOption) {
        toast.error('אנא בחר אופציה');
        return;
      }
      payload.optionId = selectedOption;
    } else if (vote.voteType === 'RATING') {
      if (rating === 0) {
        toast.error('אנא בחר דירוג');
        return;
      }
      payload.rating = rating;
    }

    setSubmitting(true);
    try {
      const res = await authFetch(`/api/v1/votes/${id}/cast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('ההצבעה נשמרה בהצלחה!');
        router.push('/votes');
      } else {
        const error = await res.json();
        toast.error(error.message || 'שגיאה בשמירת ההצבעה');
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast.error('שגיאה בשמירת ההצבעה');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">טוען...</div>;
  if (!vote) return <div className="p-6">הצבעה לא נמצאה</div>;

  const canVote = vote.isActive && !vote.isClosed && !vote.userHasVoted && new Date(vote.endDate) > new Date();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push('/votes')}>
          חזרה
        </Button>
        <Badge className={vote.isClosed ? 'bg-gray-500' : 'bg-blue-500'}>
          {vote.isClosed ? 'סגור' : 'פעיל'}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{vote.title}</CardTitle>
          {vote.description && <p className="text-gray-600">{vote.description}</p>}
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">שאלה:</h3>
            <p className="text-lg">{vote.question}</p>
          </div>

          {vote.userHasVoted && (
            <div className="bg-green-50 p-4 rounded">
              <p className="text-green-700">✓ הצבעת בהצבעה זו</p>
            </div>
          )}

          {canVote && (
            <div className="space-y-4">
              {vote.voteType === 'YES_NO' && (
                <div className="space-y-2">
                  <Button
                    onClick={() => setYesNoResponse(true)}
                    variant={yesNoResponse === true ? 'default' : 'outline'}
                    className="w-full"
                  >
                    כן
                  </Button>
                  <Button
                    onClick={() => setYesNoResponse(false)}
                    variant={yesNoResponse === false ? 'default' : 'outline'}
                    className="w-full"
                  >
                    לא
                  </Button>
                </div>
              )}

              {vote.voteType === 'MULTIPLE_CHOICE' && (
                <RadioGroup value={selectedOption?.toString()} onValueChange={(val) => setSelectedOption(Number(val))}>
                  {vote.options.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value={option.id.toString()} id={`option-${option.id}`} />
                      <Label htmlFor={`option-${option.id}`}>{option.optionText}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {vote.voteType === 'RATING' && (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-3xl ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              )}

              <div>
                <Label>הערה (אופציונלי)</Label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="הוסף הערה..."
                />
              </div>

              <Button onClick={handleSubmitVote} disabled={submitting} className="w-full">
                {submitting ? 'שולח...' : 'שלח הצבעה'}
              </Button>
            </div>
          )}

          {!canVote && !vote.userHasVoted && (
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-700">הצבעה זו אינה פעילה עוד</p>
            </div>
          )}

          <div className="text-sm text-gray-500">
            <p>תאריך סיום: {new Date(vote.endDate).toLocaleDateString('he-IL')}</p>
            <p>{vote.responseCount} משתתפים הצביעו</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

