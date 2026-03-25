import React from 'react';
import { 
  FileText, 
  Calendar, 
  Home, 
  Download, 
  ShieldCheck, 
  Info,
  ChevronRight,
  User
} from 'lucide-react';
import { Card, Button, Badge } from './UI';
import { motion } from 'motion/react';

export const LeaseScreen = () => {
  const leaseInfo = {
    unit: 'Unit 402, Tower A',
    type: '2 Bedroom, 2 Bath',
    startDate: 'Jan 01, 2026',
    endDate: 'Dec 31, 2026',
    rent: '$2,450.00',
    deposit: '$2,450.00',
    status: 'Active',
    documents: [
      { name: 'Lease Agreement.pdf', size: '1.2 MB', date: 'Dec 15, 2025' },
      { name: 'Building Rules.pdf', size: '0.8 MB', date: 'Dec 15, 2025' },
      { name: 'Move-in Inspection.pdf', size: '2.4 MB', date: 'Jan 02, 2026' },
    ]
  };

  return (
    <div className="p-6 space-y-8 pb-24">
      <header>
        <h1 className="text-2xl font-bold">My Lease</h1>
        <p className="text-neutral-500 text-sm">Unit & Agreement Details</p>
      </header>

      {/* Unit Overview */}
      <Card className="p-6 bg-neutral-900 text-white border-none relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 blur-3xl rounded-full -mr-16 -mt-16" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
            <Home className="w-8 h-8 text-gold" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{leaseInfo.unit}</h2>
            <p className="text-neutral-400 text-sm">{leaseInfo.type}</p>
          </div>
        </div>
      </Card>

      {/* Lease Details */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Agreement Details</h3>
        <div className="grid grid-cols-1 gap-3">
          <Card className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-neutral-400" />
              <div>
                <div className="text-xs text-neutral-400">Lease Term</div>
                <div className="font-semibold text-sm">{leaseInfo.startDate} - {leaseInfo.endDate}</div>
              </div>
            </div>
            <Badge variant="success">Active</Badge>
          </Card>
          
          <Card className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-neutral-400" />
              <div>
                <div className="text-xs text-neutral-400">Monthly Rent</div>
                <div className="font-semibold text-sm">{leaseInfo.rent}</div>
              </div>
            </div>
            <div className="text-xs font-bold text-gold">Due Monthly</div>
          </Card>

          <Card className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-neutral-400" />
              <div>
                <div className="text-xs text-neutral-400">Security Deposit</div>
                <div className="font-semibold text-sm">{leaseInfo.deposit}</div>
              </div>
            </div>
            <div className="text-xs font-bold text-neutral-400 italic">Held in Escrow</div>
          </Card>
        </div>
      </section>

      {/* Documents */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Documents</h3>
        <div className="space-y-3">
          {leaseInfo.documents.map((doc, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-neutral-100 group hover:border-gold transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-50 rounded-xl flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                  <FileText className="w-5 h-5 text-neutral-400 group-hover:text-gold" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{doc.name}</div>
                  <div className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">{doc.size} • {doc.date}</div>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <Download className="w-4 h-4 text-neutral-400" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Support */}
      <Card className="p-4 bg-gold/5 border-gold/20 flex items-start gap-4">
        <div className="p-2 bg-gold/10 rounded-lg">
          <Info className="w-5 h-5 text-gold" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-sm">Need to renew or terminate?</h4>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Lease management requests must be submitted at least 60 days prior to the end date. Contact your property manager for more info.
          </p>
          <Button variant="ghost" size="sm" className="p-0 h-auto text-gold font-bold text-xs mt-2 hover:bg-transparent">
            Contact Manager <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
