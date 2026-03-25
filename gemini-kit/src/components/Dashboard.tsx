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
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '@/src/types';
import { Button, Card, Badge } from '@/src/components/UI';
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
  Bar
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
        {/* Quick Actions (Resident) */}
        {role === 'Resident' && (
          <section className="grid grid-cols-2 gap-3">
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
          </section>
        )}
        {/* Quick Stats */}
        <section className="grid grid-cols-2 gap-4">
          {role === 'Property Manager' || role === 'Admin' ? (
            <>
              <Card className="p-4 bg-neutral-900 text-white border-none">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-gold" />
                  </div>
                  <Badge variant="success" className="bg-emerald-500/20 text-emerald-400 border-none">+12%</Badge>
                </div>
                <div className="text-2xl font-bold">$142.5k</div>
                <div className="text-xs text-neutral-400">Monthly Revenue</div>
              </Card>
              <Card className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-neutral-100 rounded-lg">
                    <Users className="w-4 h-4 text-neutral-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold">96%</div>
                <div className="text-xs text-neutral-500">Occupancy Rate</div>
              </Card>
            </>
          ) : role === 'Resident' ? (
            <>
              <Card className="p-4 bg-neutral-900 text-white border-none">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <DollarSign className="w-4 h-4 text-gold" />
                  </div>
                </div>
                <div className="text-2xl font-bold">$2,450</div>
                <div className="text-xs text-neutral-400">Next Rent Due</div>
              </Card>
              <Card className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-neutral-100 rounded-lg">
                    <Ticket className="w-4 h-4 text-neutral-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold">2</div>
                <div className="text-xs text-neutral-500">Active Tickets</div>
              </Card>
            </>
          ) : (
             <>
              <Card className="p-4 bg-neutral-900 text-white border-none">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Wrench className="w-4 h-4 text-gold" />
                  </div>
                </div>
                <div className="text-2xl font-bold">5</div>
                <div className="text-xs text-neutral-400">Tasks Today</div>
              </Card>
              <Card className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-neutral-100 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-neutral-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold">8.5</div>
                <div className="text-xs text-neutral-500">Avg Rating</div>
              </Card>
            </>
          )}
        </section>

        {/* Chart Section (Managers/Admin/Accountant) */}
        {(role === 'Property Manager' || role === 'Admin' || role === 'Accountant') && (
          <section className="space-y-4">
            <div className="flex justify-between items-end">
              <h2 className="text-lg font-bold">Revenue Overview</h2>
              <Button variant="ghost" size="sm" className="text-neutral-500">View Report</Button>
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

        {/* Recent Tickets */}
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="text-lg font-bold">Recent Tickets</h2>
            <Button variant="ghost" size="sm" className="text-neutral-500">See All</Button>
          </div>
          <div className="space-y-3">
            {TICKETS.map((ticket) => (
              <motion.div
                key={ticket.id}
                whileHover={{ x: 4 }}
                className="group"
              >
                <Card className="p-4 flex items-center justify-between cursor-pointer">
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
                  <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-900 transition-colors" />
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Properties (Managers/Admin) */}
        {(role === 'Property Manager' || role === 'Admin') && (
          <section className="space-y-4">
            <div className="flex justify-between items-end">
              <h2 className="text-lg font-bold">Your Properties</h2>
              <Button variant="ghost" size="sm" className="text-neutral-500">Manage</Button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
              {PROPERTIES.map((property) => (
                <Card key={property.id} className="min-w-[280px] p-0 overflow-hidden group">
                  <div className="h-40 relative">
                    <img src={property.image} alt={property.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                    <div className="absolute top-3 right-3">
                      <Badge variant="success" className="bg-white/90 backdrop-blur-sm shadow-sm">{property.occupancy}% Occupied</Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold">{property.name}</h3>
                    <p className="text-xs text-neutral-500 mt-1">{property.units} Units • Premium Management</p>
                  </div>
                </Card>
              ))}
              <div className="min-w-[200px] flex items-center justify-center">
                <Button variant="outline" className="w-full h-full border-dashed border-2 flex-col gap-2 py-12">
                  <Plus className="w-6 h-6" />
                  <span>Add Property</span>
                </Button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
