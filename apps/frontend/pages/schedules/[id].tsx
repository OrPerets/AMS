import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { authFetch } from '../../lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Play, Check, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  id: number;
  title: string;
  description?: string;
  taskType: string;
  priority: string;
  status: string;
  location?: string;
  estimatedTime?: number;
  assignee?: {
    id: number;
    email: string;
  };
}

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

export default function ScheduleDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadSchedule();
  }, [id]);

  const loadSchedule = async () => {
    try {
      const res = await authFetch(`/api/v1/schedules/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSchedule(data);
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = async (taskId: number) => {
    try {
      const res = await authFetch(`/api/v1/schedules/tasks/${taskId}/start`, {
        method: 'POST',
      });

      if (res.ok) {
        toast.success('המשימה התחילה');
        loadSchedule();
      } else {
        toast.error('שגיאה בהתחלת המשימה');
      }
    } catch (error) {
      console.error('Error starting task:', error);
      toast.error('שגיאה בהתחלת המשימה');
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    try {
      const res = await authFetch(`/api/v1/schedules/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: '' }),
      });

      if (res.ok) {
        toast.success('המשימה הושלמה');
        loadSchedule();
      } else {
        toast.error('שגיאה בהשלמת המשימה');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('שגיאה בהשלמת המשימה');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      PENDING: { color: 'bg-gray-500', label: 'ממתין' },
      IN_PROGRESS: { color: 'bg-blue-500', label: 'בתהליך' },
      COMPLETED: { color: 'bg-green-500', label: 'הושלם' },
      SKIPPED: { color: 'bg-yellow-500', label: 'דולג' },
      CANCELLED: { color: 'bg-red-500', label: 'בוטל' },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { color: string; label: string }> = {
      LOW: { color: 'bg-gray-400', label: 'נמוך' },
      MEDIUM: { color: 'bg-blue-400', label: 'בינוני' },
      HIGH: { color: 'bg-orange-400', label: 'גבוה' },
      URGENT: { color: 'bg-red-400', label: 'דחוף' },
    };

    const config = priorityConfig[priority] || priorityConfig.MEDIUM;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (loading) return <div className="p-6">טוען...</div>;
  if (!schedule) return <div className="p-6">לוח זמנים לא נמצא</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push('/schedules')}>
          <ArrowLeft className="h-4 w-4 mr-2 icon-directional" />
          חזרה
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {schedule.title || `לוח זמנים ${schedule.id}`}
          </CardTitle>
          {schedule.description && (
            <p className="text-gray-600">{schedule.description}</p>
          )}
          <div className="flex gap-2 mt-2">
            <span className="text-sm text-gray-500">
              תאריך: {new Date(schedule.date).toLocaleDateString('he-IL')}
            </span>
            {schedule.building && (
              <span className="text-sm text-gray-500">
                | בניין: {schedule.building.name}
              </span>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">משימות</h2>
        {schedule.tasks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-gray-500">
              אין משימות עדיין
            </CardContent>
          </Card>
        ) : (
          schedule.tasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{task.title}</h3>
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex gap-4 text-sm text-gray-500">
                      {task.location && <span>מיקום: {task.location}</span>}
                      {task.estimatedTime && (
                        <span>זמן משוער: {task.estimatedTime} דקות</span>
                      )}
                      {task.assignee && (
                        <span>מוקצה ל: {task.assignee.email}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {task.status === 'PENDING' && (
                      <Button
                        size="sm"
                        onClick={() => handleStartTask(task.id)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        התחל
                      </Button>
                    )}
                    {task.status === 'IN_PROGRESS' && (
                      <Button
                        size="sm"
                        onClick={() => handleCompleteTask(task.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        סיים
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

