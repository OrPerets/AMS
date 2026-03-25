import React from 'react';
import { 
  LayoutDashboard, 
  Ticket, 
  CreditCard, 
  Building2, 
  UserCircle, 
  Bell,
  Plus,
  Search,
  ChevronRight,
  TrendingUp,
  Users,
  Wrench,
  DollarSign,
  Calendar,
  Shield,
  Zap,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '@/src/types';
import { Button, Card, Badge, Progress } from '@/src/components/UI';
import { cn } from '@/src/lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

// Mock Data
const REVENUE_DATA = [
  { name: 'Jan', value: 45000 },
  { name: 'Feb', value: 52000 },
  { name: 'Mar', value: 48000 },
  { name: 'Apr', value: 61000 },
  { name: 'May', value: 55000 },
  { name: 'Jun', value: 67000 },
];

const TICKETS = [
  { id: '1', title: 'Leaking pipe in 402', status: 'Open', priority: 'High', category: 'Plumbing', time: '2h ago' },
  { id: '2', title: 'Elevator B maintenance', status: 'In Progress', priority: 'Medium', category: 'General', time: '5h ago' },
  { id: '3', title: 'AC not cooling in Lobby', status: 'Open', priority: 'Urgent', category: 'HVAC', time: '10m ago' },
];

const PROPERTIES = [
  { id: '1', name: 'Excellence Tower A', units: 120, occupancy: 98, image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80' },
  { id: '2', name: 'Grand Residence', units: 85, occupancy: 92, image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80' },
];

const ANNOUNCEMENTS = [
  { id: '1', title: 'Pool Maintenance', date: 'Mar 26', type: 'Maintenance' },
  { id: '2', title: 'New Gym Equipment', date: 'Mar 28', type: 'Amenity' },
];

interface DashboardProps {
  role: UserRole;
  onAction?: (action: 'ticket' | 'payment') => void;
}

export const Dashboard = ({ role, onAction }: DashboardProps) => {
  return (
    <div className="pb-24">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex justify-between items-center sticky top-0 bg-neutral-50/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-gold-light via-gold to-gold-dark rounded-xl shadow-lg shadow-gold/20 flex items-center justify-center text-white font-display font-bold">
            A
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Amit Excellence</h1>
            <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest">{role}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-neutral-50" />
          </Button>
          <div className="w-10 h-10 rounded-full bg-neutral-200 border-2 border-white shadow-sm overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" />
          </div>
        </div>
      </header>

      <main className="px-6 space-y-8">
        {/* Role-Specific Quick Actions */}
        <section className="grid grid-cols-2 gap-3">
          {role === 'Resident' ? (
            <>
              <Button variant="gold" className="h-24 flex-col gap-2 rounded-2xl" onClick={() => onAction?.('ticket')}>
                <Plus className="w-6 h-6" />
                <span className="text-xs font-bold uppercase tracking-wider">Report Issue</span>
              </Button>
              <Button 
                variant="secondary" 
                className="h-24 flex-col gap-2 rounded-2xl bg-white border border-neutral-100"
                onClick={() => onAction?.('payment')}
              >
                <CreditCard className="w-6 h-6 text-neutral-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">Pay Rent</span>
              </Button>
            </>
          ) : role === 'Property Manager' || role === 'Admin' ? (
            <>
              <Button variant="gold" className="h-24 flex-col gap-2 rounded-2xl">
                <Building2 className="w-6 h-6" />
                <span className="text-xs font-bold uppercase tracking-wider">Add Property</span>
              </Button>
              <Button variant="secondary" className="h-24 flex-col gap-2 rounded-2xl bg-white border border-neutral-100">
                <MessageSquare className="w-6 h-6 text-neutral-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">Broadcast</span>
              </Button>
            </>
          ) : role === 'Worker' ? (
            <>
              <Button variant="gold" className="h-24 flex-col gap-2 rounded-2xl">
                <Zap className="w-6 h-6" />
                <span className="text-xs font-bold uppercase tracking-wider">Clock In</span>
              </Button>
              <Button variant="secondary" className="h-24 flex-col gap-2 rounded-2xl bg-white border border-neutral-100">
                <Calendar className="w-6 h-6 text-neutral-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">Schedule</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="gold" className="h-24 flex-col gap-2 rounded-2xl">
                <DollarSign className="w-6 h-6" />
                <span className="text-xs font-bold uppercase tracking-wider">New Invoice</span>
              </Button>
              <Button variant="secondary" className="h-24 flex-col gap-2 rounded-2xl bg-white border border-neutral-100">
                <TrendingUp className="w-6 h-6 text-neutral-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">Reports</span>
              </Button>
            </>
          )}
        </section>

        {/* Portfolio Health (Managers/Admin) */}
        {(role === 'Property Manager' || role === 'Admin') && (
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Portfolio Health</h2>
            <Card className="p-6 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-semibold">Occupancy Rate</span>
                  <span className="text-lg font-bold">96%</span>
                </div>
                <Progress value={96} color="gold" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-semibold">Collection Rate</span>
                  <span className="text-lg font-bold">88%</span>
                </div>
                <Progress value={88} color="neutral" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Net Revenue</div>
                  <div className="text-lg font-bold text-emerald-900">$142.5k</div>
                </div>
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                  <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-1">Expenses</div>
                  <div className="text-lg font-bold text-rose-900">$32.8k</div>
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* Today's Schedule (Worker) */}
        {role === 'Worker' && (
          <section className="space-y-4">
            <div className="flex justify-between items-end">
              <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Today's Schedule</h2>
              <Badge variant="gold">5 Tasks Remaining</Badge>
            </div>
            <div className="space-y-3">
              <Card className="p-4 flex items-center gap-4 border-l-4 border-l-gold">
                <div className="w-12 h-12 bg-gold/10 rounded-xl flex flex-col items-center justify-center text-gold">
                  <span className="text-xs font-bold">09:00</span>
                  <span className="text-[8px] uppercase font-bold">AM</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm">Fix Leaking Pipe</h3>
                  <p className="text-xs text-neutral-500">Unit 402, Tower A</p>
                </div>
                <Button variant="ghost" size="icon">
                  <ChevronRight className="w-4 h-4 text-neutral-300" />
                </Button>
              </Card>
              <Card className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-neutral-100 rounded-xl flex flex-col items-center justify-center text-neutral-400">
                  <span className="text-xs font-bold">11:30</span>
                  <span className="text-[8px] uppercase font-bold">AM</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm">Elevator B Inspection</h3>
                  <p className="text-xs text-neutral-500">Lobby, Grand Residence</p>
                </div>
                <Button variant="ghost" size="icon">
                  <ChevronRight className="w-4 h-4 text-neutral-300" />
                </Button>
              </Card>
            </div>
          </section>
        )}

        {/* Rent Status (Resident) */}
        {role === 'Resident' && (
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Payment Status</h2>
            <Card className="p-6 bg-neutral-900 text-white border-none relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 blur-3xl rounded-full -mr-16 -mt-16" />
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Next Payment Due</div>
                    <div className="text-3xl font-bold">$2,450.00</div>
                  </div>
                  <Badge variant="gold" className="bg-gold/20 text-gold border-none">Due Apr 01</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <Clock className="w-3 h-3" />
                  <span>Auto-pay scheduled for Mar 31</span>
                </div>
                <Button variant="gold" className="w-full py-6 text-sm font-bold" onClick={() => onAction?.('payment')}>
                  Pay Now
                </Button>
              </div>
            </Card>
          </section>
        )}

        {/* Announcements (All) */}
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Announcements</h2>
            <Button variant="ghost" size="sm" className="text-gold font-bold text-[10px] uppercase tracking-wider">View All</Button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {ANNOUNCEMENTS.map((ann) => (
              <Card key={ann.id} className="p-4 flex items-center justify-between group cursor-pointer hover:border-gold transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-400 group-hover:bg-gold/10 group-hover:text-gold transition-colors">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{ann.title}</h3>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">{ann.type} • {ann.date}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-200 group-hover:text-gold transition-colors" />
              </Card>
            ))}
          </div>
        </section>

        {/* Charts (Managers/Admin/Accountant) */}
        {(role === 'Property Manager' || role === 'Admin' || role === 'Accountant') && (
          <section className="space-y-4">
            <div className="flex justify-between items-end">
              <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Revenue Performance</h2>
              <div className="flex gap-2">
                <Badge variant="success" className="bg-emerald-500/10 text-emerald-500 border-none">+12.5%</Badge>
              </div>
            </div>
            <Card className="p-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REVENUE_DATA}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#999' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </section>
        )}

        {/* Recent Tickets (All) */}
        <section className="space-y-4 pb-8">
          <div className="flex justify-between items-end">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Recent Tickets</h2>
            <Button variant="ghost" size="sm" className="text-gold font-bold text-[10px] uppercase tracking-wider">See All</Button>
          </div>
          <div className="space-y-3">
            {TICKETS.map((ticket) => (
              <motion.div
                key={ticket.id}
                whileHover={{ x: 4 }}
                className="group"
              >
                <Card className="p-4 flex items-center justify-between cursor-pointer hover:border-gold transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      ticket.priority === 'Urgent' ? "bg-rose-100 text-rose-600" : "bg-neutral-100 text-neutral-600"
                    )}>
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{ticket.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={ticket.status === 'Open' ? 'warning' : 'info'}>{ticket.status}</Badge>
                        <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">{ticket.time}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-gold transition-colors" />
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
