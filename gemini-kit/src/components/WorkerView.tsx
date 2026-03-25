import React from 'react';
import { 
  Wrench, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Play,
  Pause,
  Zap,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Card, Button, Badge, Progress } from './UI';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

const TASKS = [
  { id: '1', title: 'Fix Leaking Pipe', location: 'Unit 402, Tower A', time: '09:00 AM', priority: 'High', status: 'In Progress', progress: 65 },
  { id: '2', title: 'Elevator B Inspection', location: 'Lobby, Grand Residence', time: '11:30 AM', priority: 'Medium', status: 'Pending', progress: 0 },
  { id: '3', title: 'AC Filter Replacement', location: 'Unit 105, Tower A', time: '02:00 PM', priority: 'Low', status: 'Pending', progress: 0 },
];

export const WorkerView = () => {
  return (
    <div className="p-6 space-y-8 pb-24">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <p className="text-neutral-500 text-sm">You have 3 tasks today</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold shadow-lg shadow-gold/10">
          <Wrench className="w-5 h-5" />
        </div>
      </header>

      {/* Quick Actions */}
      <section className="grid grid-cols-2 gap-3">
        <Button variant="gold" className="h-20 flex-col gap-1 rounded-2xl shadow-lg shadow-gold/20">
          <Zap className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Clock In</span>
        </Button>
        <Button variant="secondary" className="h-20 flex-col gap-1 rounded-2xl bg-white border border-neutral-100">
          <Calendar className="w-5 h-5 text-neutral-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">Schedule</span>
        </Button>
      </section>

      {/* Today's Schedule */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Today's Schedule</h2>
          <Badge variant="gold">3 Tasks</Badge>
        </div>
        <div className="space-y-4">
          {TASKS.map((task, idx) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className={cn(
                "p-5 border-l-4 transition-all duration-300",
                task.status === 'In Progress' ? "border-l-gold bg-white shadow-xl shadow-gold/5" : "border-l-neutral-200"
              )}>
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-neutral-900">{task.title}</h3>
                      <Badge variant={task.priority === 'High' ? 'error' : 'default'}>{task.priority}</Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-500 text-xs">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{task.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-neutral-900">{task.time}</div>
                    <div className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider mt-0.5">{task.status}</div>
                  </div>
                </div>
                
                {task.status === 'In Progress' && (
                  <div className="mb-5 space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      <span>Progress</span>
                      <span className="text-gold">{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} color="gold" />
                  </div>
                )}

                <div className="flex gap-2">
                  {task.status === 'In Progress' ? (
                    <>
                      <Button variant="primary" size="sm" className="flex-1 gap-2 py-3 rounded-xl">
                        <CheckCircle2 className="w-4 h-4" />
                        Complete
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2 py-3 rounded-xl">
                        <Pause className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button variant="gold" size="sm" className="w-full gap-2 py-3 rounded-xl">
                      <Play className="w-4 h-4" />
                      Start Task
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Urgent Alerts */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Urgent Alerts</h2>
        <Card className="p-4 bg-rose-50 border-rose-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm text-rose-900">Fire Alarm Test</div>
            <div className="text-xs text-rose-600">Scheduled for 3:00 PM today</div>
          </div>
          <Button variant="ghost" size="sm" className="text-rose-600 font-bold">Dismiss</Button>
        </Card>
      </section>
    </div>
  );
};
