import React from 'react';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  ChevronRight,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  LayoutGrid,
  List,
  ArrowUpRight
} from 'lucide-react';
import { Card, Button, Badge, Progress } from './UI';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

const PROPERTIES = [
  { 
    id: '1', 
    name: 'Excellence Tower A', 
    address: '123 Luxury Way, Downtown',
    occupancy: 98, 
    units: 120,
    revenue: '$142.5k',
    status: 'Healthy',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80'
  },
  { 
    id: '2', 
    name: 'Grand Residence', 
    address: '456 Elite Blvd, Westside',
    occupancy: 92, 
    units: 85,
    revenue: '$89.2k',
    status: 'Attention',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80'
  },
];

export const PropertyManagerView = () => {
  return (
    <div className="p-6 space-y-8 pb-24">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-neutral-500 text-sm">Managing 2 Properties • 205 Units</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="rounded-xl">
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="gold" size="icon" className="rounded-xl shadow-lg shadow-gold/20">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Portfolio Health */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Portfolio Health</h2>
          <Badge variant="gold" className="bg-gold/10 text-gold border-none">95.4% Overall</Badge>
        </div>
        <Card className="p-5 space-y-6 bg-white border-neutral-100 shadow-xl shadow-neutral-900/5">
          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              <span>Occupancy Rate</span>
              <span className="text-emerald-600">95.4%</span>
            </div>
            <Progress value={95.4} color="emerald" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              <span>Rent Collection</span>
              <span className="text-gold">88.2%</span>
            </div>
            <Progress value={88.2} color="gold" />
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-3 bg-neutral-50 rounded-xl">
              <div className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Total Revenue</div>
              <div className="text-lg font-bold text-neutral-900">$231.7k</div>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl">
              <div className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Active Tickets</div>
              <div className="text-lg font-bold text-neutral-900">14</div>
            </div>
          </div>
        </Card>
      </section>

      {/* Property List */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Active Properties</h2>
          <div className="flex gap-1 bg-neutral-100 p-1 rounded-lg">
            <Button variant="ghost" size="icon" className="w-7 h-7 bg-white shadow-sm rounded-md">
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="w-7 h-7 text-neutral-400">
              <List className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <div className="space-y-6">
          {PROPERTIES.map((property, idx) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-0 overflow-hidden group border-neutral-100 shadow-xl shadow-neutral-900/5 hover:shadow-2xl hover:shadow-neutral-900/10 transition-all duration-500">
                <div className="h-56 relative overflow-hidden">
                  <img 
                    src={property.image} 
                    alt={property.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    referrerPolicy="no-referrer" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-4 right-4">
                    <Badge variant={property.status === 'Healthy' ? 'success' : 'warning'} className="bg-white/20 backdrop-blur-md text-white border-none px-3 py-1">
                      {property.status}
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-bold text-xl mb-1">{property.name}</h3>
                    <div className="flex items-center gap-1.5 text-white/70 text-xs">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{property.address}</span>
                    </div>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-3 gap-4 border-b border-neutral-50">
                  <div className="space-y-1">
                    <div className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">Occupancy</div>
                    <div className="font-bold text-neutral-900">{property.occupancy}%</div>
                  </div>
                  <div className="space-y-1 border-x border-neutral-100 px-4">
                    <div className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">Units</div>
                    <div className="font-bold text-neutral-900">{property.units}</div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">Revenue</div>
                    <div className="font-bold text-gold">{property.revenue}</div>
                  </div>
                </div>
                <div className="p-4 flex justify-between items-center bg-neutral-50/50">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-neutral-200 overflow-hidden shadow-sm">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${property.id}${i}`} alt="Tenant" />
                      </div>
                    ))}
                    <div className="w-7 h-7 rounded-full border-2 border-white bg-neutral-100 flex items-center justify-center text-[8px] font-bold text-neutral-500 shadow-sm">
                      +{property.units - 3}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-gold font-bold text-[10px] uppercase tracking-wider gap-1.5 group/btn">
                    Manage Property
                    <ArrowUpRight className="w-3 h-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};
