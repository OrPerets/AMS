import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { authFetch } from '../../lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Calendar, Plus, ClipboardList } from 'lucide-react';
import { Input } from '../../components/ui/input';

interface Schedule {
  id: number;
  date: string;
  title?: string;
  description?: string;
  status: string;
  tasks: Task[];
  building?: {
    id: number;
    name: string;
  };
}

interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
}

export default function SchedulesPage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    loadSchedules();
  }, [selectedDate]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/v1/schedules/date/${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      DRAFT: { color: 'bg-gray-500', label: 'טיוטה' },
      PUBLISHED: { color: 'bg-blue-500', label: 'פורסם' },
      IN_PROGRESS: { color: 'bg-yellow-500', label: 'בתהליך' },
      COMPLETED: { color: 'bg-green-500', label: 'הושלם' },
      CANCELLED: { color: 'bg-red-500', label: 'בוטל' },
    };

    const config = statusConfig[status] || statusConfig.DRAFT;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getTaskStats = (schedule: Schedule) => {
    const total = schedule.tasks.length;
    const completed = schedule.tasks.filter(t => t.status === 'COMPLETED').length;
    const inProgress = schedule.tasks.filter(t => t.status === 'IN_PROGRESS').length;
    return { total, completed, inProgress };
  };

  if (loading) {
    return <div className="p-6">טוען...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">לוחות זמנים</h1>
          <p className="text-gray-500">ניהול משימות יומיות</p>
        </div>
        <Button onClick={() => router.push('/schedules/create')}>
          <Plus className="h-4 w-4 mr-2" />
          לוח זמנים חדש
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            בחר תאריך
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="max-w-xs"
          />
        </CardContent>
      </Card>

      {schedules.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ClipboardList className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">אין לוחות זמנים לתאריך זה</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {schedules.map((schedule) => {
            const stats = getTaskStats(schedule);
            return (
              <Card
                key={schedule.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/schedules/${schedule.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {schedule.title || `לוח זמנים ${schedule.id}`}
                      </CardTitle>
                      {schedule.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {schedule.description}
                        </p>
                      )}
                      {schedule.building && (
                        <p className="text-sm text-gray-500 mt-1">
                          בניין: {schedule.building.name}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(schedule.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>סה"כ משימות: {stats.total}</span>
                    <span>הושלמו: {stats.completed}</span>
                    <span>בתהליך: {stats.inProgress}</span>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

