import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { authFetch } from '../../lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Plus, Vote as VoteIcon } from 'lucide-react';

interface Vote {
  id: number;
  title: string;
  question: string;
  endDate: string;
  isActive: boolean;
  isClosed: boolean;
  userHasVoted: boolean;
  responseCount: number;
  voteType: string;
  buildingId: number;
}

export default function VotesPage() {
  const router = useRouter();
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [buildingId, setBuildingId] = useState<number | null>(null);

  useEffect(() => {
    // For now, assume buildingId is 1 or get it from user context
    // In production, you'd get this from the user's profile
    const defaultBuildingId = 1;
    setBuildingId(defaultBuildingId);
    loadVotes(defaultBuildingId);
  }, []);

  const loadVotes = async (bldgId: number) => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/v1/votes/building/${bldgId}`);
      if (res.ok) {
        const data = await res.json();
        setVotes(data);
      }
    } catch (error) {
      console.error('Error loading votes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  const getStatusBadge = (vote: Vote) => {
    if (vote.isClosed) {
      return <Badge variant="secondary">סגור</Badge>;
    }
    if (new Date(vote.endDate) < new Date()) {
      return <Badge variant="destructive">פג תוקף</Badge>;
    }
    if (vote.userHasVoted) {
      return <Badge className="bg-green-500">הצבעת</Badge>;
    }
    return <Badge className="bg-blue-500">פעיל</Badge>;
  };

  if (loading) {
    return <div className="p-6">טוען...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">הצבעות</h1>
          <p className="text-gray-500">השתתף בהחלטות הבניין</p>
        </div>
        <Button onClick={() => router.push('/votes/create')}>
          <Plus className="h-4 w-4 mr-2" />
          הצבעה חדשה
        </Button>
      </div>

      {votes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <VoteIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">אין הצבעות פעילות כרגע</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {votes.map((vote) => (
            <Card key={vote.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/votes/${vote.id}`)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{vote.title}</CardTitle>
                  {getStatusBadge(vote)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{vote.question}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>עד: {formatDate(vote.endDate)}</span>
                  <span>{vote.responseCount} הצביעו</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

