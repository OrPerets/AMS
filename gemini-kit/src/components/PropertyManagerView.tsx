import React from 'react';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  ChevronRight,
  MapPin,
  MoreHorizontal,
  Plus
} from 'lucide-react';
import { Card, Button, Badge } from './UI';
import { cn } from '@/src/lib/utils';

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
          <h1 className="text-2xl font-bold">Properties</h1>
          <p className="text-neutral-500 text-sm">Manage your portfolio</p>
        </div>
        <Button variant="gold" size="icon">
          <Plus className="w-5 h-5" />
        </Button>
      </header>

      {/* Portfolio Summary */}
      <section className="grid grid-cols-2 gap-4">
        <Card className="p-4 space-y-2">
          <div className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Total Units</div>
          <div className="text-2xl font-bold">205</div>
          <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold">
            <TrendingUp className="w-3 h-3" />
            <span>+4 this month</span>
          </div>
        </Card>
        <Card className="p-4 space-y-2">
          <div className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Avg Occupancy</div>
          <div className="text-2xl font-bold">95.4%</div>
          <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold">
            <TrendingUp className="w-3 h-3" />
            <span>+1.2%</span>
          </div>
        </Card>
      </section>

      {/* Property List */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">Active Properties</h2>
          <Button variant="ghost" size="sm" className="text-neutral-500">Filter</Button>
        </div>
        <div className="space-y-4">
          {PROPERTIES.map((property) => (
            <Card key={property.id} className="p-0 overflow-hidden group">
              <div className="h-48 relative">
                <img src={property.image} alt={property.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <div>
                    <h3 className="text-white font-bold text-lg">{property.name}</h3>
                    <div className="flex items-center gap-1 text-white/70 text-xs">
                      <MapPin className="w-3 h-3" />
                      <span>{property.address}</span>
                    </div>
                  </div>
                  <Badge variant={property.status === 'Healthy' ? 'success' : 'warning'} className="bg-white/20 backdrop-blur-md text-white border-none">
                    {property.status}
                  </Badge>
                </div>
              </div>
              <div className="p-4 grid grid-cols-3 gap-4 border-b border-neutral-100">
                <div className="text-center">
                  <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-1">Occupancy</div>
                  <div className="font-bold">{property.occupancy}%</div>
                </div>
                <div className="text-center border-x border-neutral-100">
                  <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-1">Units</div>
                  <div className="font-bold">{property.units}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-1">Revenue</div>
                  <div className="font-bold text-gold">{property.revenue}</div>
                </div>
              </div>
              <div className="p-3 flex justify-between items-center">
                <Button variant="ghost" size="sm" className="text-neutral-500">View Details</Button>
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-neutral-200 overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${property.id}${i}`} alt="Tenant" />
                    </div>
                  ))}
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-neutral-100 flex items-center justify-center text-[8px] font-bold">
                    +{property.units - 3}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};
