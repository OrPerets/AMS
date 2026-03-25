import React from 'react';
import { 
  Ticket, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Wrench
} from 'lucide-react';
import { Card, Button, Badge } from './UI';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

const MY_TICKETS = [
  { id: 'AE-2941', title: 'Leaking pipe in 402', status: 'Open', priority: 'High', category: 'Plumbing', date: 'Mar 24, 2026', updates: 2 },
  { id: 'AE-2812', title: 'AC Filter Replacement', status: 'Resolved', priority: 'Low', category: 'HVAC', date: 'Mar 15, 2026', updates: 5 },
  { id: 'AE-2755', title: 'Broken door handle', status: 'Closed', priority: 'Medium', category: 'General', date: 'Mar 02, 2026', updates: 3 },
];

export const ResidentTicketsScreen = ({ onNewTicket }: { onNewTicket: () => void }) => {
  return (
    <div className="p-6 space-y-8 pb-24">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">My Tickets</h1>
          <p className="text-neutral-500 text-sm">Track your maintenance requests</p>
        </div>
        <Button variant="gold" size="icon" onClick={onNewTicket}>
          <Plus className="w-5 h-5" />
        </Button>
      </header>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Search tickets..." 
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-neutral-100 focus:border-gold outline-none text-sm"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Ticket List */}
      <div className="space-y-4">
        {MY_TICKETS.map((ticket, idx) => (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="p-4 group hover:border-gold transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{ticket.id}</span>
                    <Badge variant={
                      ticket.status === 'Open' ? 'warning' : 
                      ticket.status === 'Resolved' ? 'success' : 'default'
                    }>
                      {ticket.status}
                    </Badge>
                  </div>
                  <h3 className="font-bold group-hover:text-gold transition-colors">{ticket.title}</h3>
                </div>
                <div className={cn(
                  "p-2 rounded-xl",
                  ticket.priority === 'High' ? "bg-rose-50 text-rose-500" : "bg-neutral-50 text-neutral-400"
                )}>
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-50">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 uppercase">
                    <Wrench className="w-3 h-3" />
                    <span>{ticket.category}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 uppercase">
                    <Clock className="w-3 h-3" />
                    <span>{ticket.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-gold font-bold text-[10px] uppercase">
                  <span>{ticket.updates} Updates</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State Helper */}
      <div className="pt-8 text-center space-y-4">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-300">
          <Ticket size={32} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold">Have a new issue?</p>
          <p className="text-xs text-neutral-500">Submit a ticket and our team will get on it.</p>
        </div>
        <Button variant="outline" size="sm" onClick={onNewTicket}>Create New Ticket</Button>
      </div>
    </div>
  );
};
