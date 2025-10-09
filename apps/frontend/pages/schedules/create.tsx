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
import { Plus, X } from 'lucide-react';

interface TaskForm {
  title: string;
  description: string;
  taskType: string;
  priority: string;
  location: string;
  estimatedTime: string;
}

export default function CreateSchedulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    description: '',
    buildingId: '',
  });
  const [tasks, setTasks] = useState<TaskForm[]>([
    { title: '', description: '', taskType: 'MAINTENANCE', priority: 'MEDIUM', location: '', estimatedTime: '' },
  ]);

  const addTask = () => {
    setTasks([
      ...tasks,
      { title: '', description: '', taskType: 'MAINTENANCE', priority: 'MEDIUM', location: '', estimatedTime: '' },
    ]);
  };

  const removeTask = (index: number) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((_, i) => i !== index));
    }
  };

  const updateTask = (index: number, field: keyof TaskForm, value: string) => {
    const newTasks = [...tasks];
    newTasks[index][field] = value;
    setTasks(newTasks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        date: formData.date,
        title: formData.title,
        description: formData.description,
        buildingId: formData.buildingId ? parseInt(formData.buildingId) : undefined,
        tasks: tasks.map((task) => ({
          title: task.title,
          description: task.description || undefined,
          taskType: task.taskType,
          priority: task.priority,
          location: task.location || undefined,
          estimatedTime: task.estimatedTime ? parseInt(task.estimatedTime) : undefined,
        })),
      };

      const res = await authFetch('/api/v1/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('לוח הזמנים נוצר בהצלחה!');
        router.push('/schedules');
      } else {
        throw new Error('Failed to create schedule');
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('שגיאה ביצירת לוח הזמנים');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>יצירת לוח זמנים חדש</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">תאריך *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="buildingId">בניין (אופציונלי)</Label>
                <Input
                  id="buildingId"
                  type="number"
                  value={formData.buildingId}
                  onChange={(e) => setFormData({ ...formData, buildingId: e.target.value })}
                  placeholder="מזהה בניין"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="title">כותרת</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="למשל: סיור יומי"
              />
            </div>

            <div>
              <Label htmlFor="description">תיאור</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="תיאור כללי של לוח הזמנים"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">משימות</h3>
                <Button type="button" variant="outline" size="sm" onClick={addTask}>
                  <Plus className="h-4 w-4 mr-1" />
                  הוסף משימה
                </Button>
              </div>

              {tasks.map((task, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">משימה {index + 1}</h4>
                      {tasks.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTask(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <Input
                      value={task.title}
                      onChange={(e) => updateTask(index, 'title', e.target.value)}
                      placeholder="כותרת משימה *"
                      required
                    />

                    <Textarea
                      value={task.description}
                      onChange={(e) => updateTask(index, 'description', e.target.value)}
                      placeholder="תיאור"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={task.taskType}
                        onValueChange={(value) => updateTask(index, 'taskType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MAINTENANCE">תחזוקה</SelectItem>
                          <SelectItem value="INSPECTION">בדיקה</SelectItem>
                          <SelectItem value="REPAIR">תיקון</SelectItem>
                          <SelectItem value="CLEANING">ניקיון</SelectItem>
                          <SelectItem value="EMERGENCY">חירום</SelectItem>
                          <SelectItem value="OTHER">אחר</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={task.priority}
                        onValueChange={(value) => updateTask(index, 'priority', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">נמוך</SelectItem>
                          <SelectItem value="MEDIUM">בינוני</SelectItem>
                          <SelectItem value="HIGH">גבוה</SelectItem>
                          <SelectItem value="URGENT">דחוף</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={task.location}
                        onChange={(e) => updateTask(index, 'location', e.target.value)}
                        placeholder="מיקום"
                      />
                      <Input
                        type="number"
                        value={task.estimatedTime}
                        onChange={(e) => updateTask(index, 'estimatedTime', e.target.value)}
                        placeholder="זמן (דקות)"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/schedules')}>
                ביטול
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'יוצר...' : 'צור לוח זמנים'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

