import React from 'react';
import { 
  Wrench, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Play,
  Pause
} from 'lucide-react';
import { Card, Button, Badge } from './UI';
import { motion } from 'motion/react';

const TASKS = [
  { id: '1', title: 'Fix Leaking Pipe', location: 'Unit 402, Tower A', time: '09:00 AM', priority: 'High', status: 'In Progress' },
  { id: '2', title: 'Elevator B Inspection', location: 'Lobby, Grand Residence', time: '11:30 AM', priority: 'Medium', status: 'Pending' },
  { id: '3', title: 'AC Filter Replacement', location: 'Unit 105, Tower A', time: '02:00 PM', priority: 'Low', status: 'Pending' },
];

export const WorkerView = () => {
  return (
    <div className="p-6 space-y-8 pb-24">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <p className="text-neutral-500 text-sm">You have 3 tasks today</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
          <Wrench className="w-5 h-5" />
        </div>
      </header>

      {/* Today's Schedule */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Today's Schedule</h2>
        <div className="space-y-4">
          {TASKS.map((task, idx) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className={cn(
                "p-4 border-l-4",
                task.status === 'In Progress' ? "border-l-gold bg-gold/5" : "border-l-neutral-200"
              )}>
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{task.title}</h3>
                      <Badge variant={task.priority === 'High' ? 'error' : 'default'}>{task.priority}</Badge>
                    </div>
                    <div className="flex items-center gap-1 text-neutral-500 text-xs">
                      <MapPin className="w-3 h-3" />
                      <span>{task.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-neutral-900">{task.time}</div>
                    <div className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">{task.status}</div>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  {task.status === 'In Progress' ? (
                    <>
                      <Button variant="primary" size="sm" className="flex-1 gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Complete
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Pause className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button variant="gold" size="sm" className="w-full gap-2">
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

      {/* Completed Yesterday */}
      <section className="space-y-4 opacity-60">
        <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Completed Yesterday</h2>
        <Card className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-sm">Lobby Light Repair</div>
              <div className="text-xs text-neutral-400">Completed at 4:30 PM</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-300" />
        </Card>
      </section>
    </div>
  );
};

import { cn } from '@/src/lib/utils';
