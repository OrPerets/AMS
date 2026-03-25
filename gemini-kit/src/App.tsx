import React, { useState } from 'react';
import { 
  Bell, 
  ChevronRight, 
  CreditCard, 
  FileText, 
  Home, 
  LayoutDashboard, 
  MessageSquare, 
  Plus, 
  Search, 
  Settings, 
  User as UserIcon,
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Role, User, MaintenanceTicket, Payment } from './types';

import { GoogleGenAI } from "@google/genai";

// Mock Data
const currentUser: User = {
  id: '1',
  name: 'Or Perets',
  role: 'Resident',
  unit: 'Penthouse 402',
  avatar: 'https://picsum.photos/seed/user1/200/200'
};

const tickets: MaintenanceTicket[] = [
  { id: '1', title: 'AC Filter Replacement', status: 'In Progress', priority: 'Medium', date: '2024-03-24', category: 'HVAC' },
  { id: '2', title: 'Leaking Faucet', status: 'Pending', priority: 'High', date: '2024-03-25', category: 'Plumbing' },
];

const payments: Payment[] = [
  { id: '1', amount: 1250.00, dueDate: '2024-04-01', status: 'Unpaid', description: 'Monthly Maintenance Fee' },
  { id: '2', amount: 50.00, dueDate: '2024-03-15', status: 'Paid', description: 'Gym Access Fee' },
  { id: '3', amount: 75.00, dueDate: '2024-03-01', status: 'Paid', description: 'Parking Slot B-12' },
  { id: '4', amount: 200.00, dueDate: '2024-02-15', status: 'Overdue', description: 'Late Utility Charge' },
];

const BUILDING_ADDRESS = "123 Luxury Ave, Tel Aviv, Israel";

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapData, setMapData] = useState<{ uri: string; title: string } | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(false);

  const fetchBuildingMap = async () => {
    if (mapData) return;
    setIsLoadingMap(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Show me the location and details for the building at ${BUILDING_ADDRESS}`,
        config: {
          tools: [{ googleMaps: {} }],
        },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks && chunks.length > 0) {
        const mapChunk = chunks.find((c: any) => c.maps);
        if (mapChunk) {
          setMapData({
            uri: mapChunk.maps.uri,
            title: mapChunk.maps.title || "Building Location"
          });
        }
      }
    } catch (error) {
      console.error("Error fetching map data:", error);
    } finally {
      setIsLoadingMap(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8 pb-8"
          >
            {/* Welcome Section */}
            <section>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1"
              >
                <h1 className="text-3xl font-display font-light tracking-tight">Good Morning,</h1>
                <p className="text-3xl font-display font-bold gold-text-gradient">Welcome Home.</p>
              </motion.div>
            </section>

            {/* Balance Card */}
            <section>
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="relative overflow-hidden rounded-[2.5rem] p-8 text-white shadow-2xl gold-gradient"
              >
                <div className="absolute top-0 right-0 p-8 opacity-20">
                  <CreditCard size={120} strokeWidth={1} />
                </div>
                <div className="relative z-10 space-y-6">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium opacity-80 uppercase tracking-widest">Total Balance</p>
                    <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                      Due in 6 days
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">₪1,250.00</span>
                  </div>
                  <div className="pt-4 flex gap-4">
                    <button 
                      onClick={() => setActiveTab('wallet')}
                      className="flex-1 bg-white text-premium-black py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-opacity-90 transition-all active:scale-95"
                    >
                      Pay Now
                    </button>
                    <button className="flex-1 bg-black/20 backdrop-blur-md border border-white/30 py-3 rounded-xl font-bold text-sm hover:bg-black/30 transition-all active:scale-95">
                      Details
                    </button>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* Quick Actions Grid */}
            <section className="grid grid-cols-2 gap-4">
              <QuickAction 
                icon={<Wrench size={24} />} 
                label="Service Request" 
                sub="Maintenance"
                delay={0.1}
                onClick={() => setIsRequestModalOpen(true)}
              />
              <QuickAction 
                icon={<FileText size={24} />} 
                label="Documents" 
                sub="Contracts & Bills"
                delay={0.2}
              />
              <QuickAction 
                icon={<MessageSquare size={24} />} 
                label="Concierge" 
                sub="Chat with us"
                delay={0.3}
              />
              <QuickAction 
                icon={<Home size={24} />} 
                label="Building" 
                sub="Amenities & Info"
                delay={0.4}
                onClick={() => {
                  setActiveTab('building');
                  fetchBuildingMap();
                }}
              />
            </section>

            {/* Active Tickets Section */}
            <section className="space-y-4">
              <div className="flex justify-between items-end">
                <h3 className="text-lg font-bold">Active Requests</h3>
                <button 
                  onClick={() => setActiveTab('tickets')}
                  className="text-xs font-bold text-gold-dark uppercase tracking-wider"
                >
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {tickets.map((ticket, idx) => (
                  <TicketCard key={ticket.id} ticket={ticket} index={idx} />
                ))}
              </div>
            </section>

            {/* Recent Activity */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold">Recent Activity</h3>
              <div className="glass-card rounded-[2.5rem] p-8 space-y-8">
                <ActivityItem 
                  icon={<CheckCircle2 className="text-green-500" size={20} />}
                  title="Payment Successful"
                  time="2 hours ago"
                  desc="₪50.00 for Gym Access"
                />
                <ActivityItem 
                  icon={<Clock className="text-gold-primary" size={20} />}
                  title="Request Updated"
                  time="Yesterday"
                  desc="AC Filter Replacement is now In Progress"
                />
                <ActivityItem 
                  icon={<AlertCircle className="text-blue-500" size={20} />}
                  title="New Document"
                  time="3 days ago"
                  desc="Annual Maintenance Report 2024"
                />
              </div>
            </section>
          </motion.div>
        );
      case 'building':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8 pb-8"
          >
            <div className="flex items-center gap-4">
              <button onClick={() => setActiveTab('home')} className="p-2 rounded-full bg-white shadow-sm">
                <ChevronRight className="rotate-180" size={20} />
              </button>
              <h1 className="text-2xl font-bold">Building Info</h1>
            </div>

            {/* Building Image */}
            <div className="relative h-64 rounded-[2.5rem] overflow-hidden shadow-xl">
              <img 
                src="https://picsum.photos/seed/building/800/600" 
                alt="Building" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                <div>
                  <h2 className="text-white text-xl font-bold">Lux Residences</h2>
                  <p className="text-white/80 text-sm">{BUILDING_ADDRESS}</p>
                </div>
              </div>
            </div>

            {/* Map Section */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold">Location</h3>
              <div className="glass-card rounded-[2.5rem] p-6 space-y-4">
                {isLoadingMap ? (
                  <div className="h-48 rounded-2xl bg-black/5 animate-pulse flex items-center justify-center">
                    <p className="text-xs font-bold text-black/20 uppercase tracking-widest">Loading Map...</p>
                  </div>
                ) : mapData ? (
                  <div className="space-y-4">
                    <div className="h-48 rounded-2xl overflow-hidden relative group">
                      <img 
                        src={`https://picsum.photos/seed/map/400/200?blur=1`} 
                        alt="Map Placeholder" 
                        className="w-full h-full object-cover opacity-50 grayscale"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <a 
                          href={mapData.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="gold-gradient px-6 py-3 rounded-xl text-white font-bold text-sm shadow-xl flex items-center gap-2 active:scale-95 transition-transform"
                        >
                          <Search size={18} />
                          View on Google Maps
                        </a>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-bold">{mapData.title}</p>
                      <p className="text-xs text-black/50 leading-relaxed">
                        Centrally located in the heart of the city, Lux Residences offers unparalleled access to major business hubs and entertainment districts.
                      </p>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={fetchBuildingMap}
                    className="w-full py-4 rounded-2xl border-2 border-dashed border-black/10 text-black/40 font-bold text-sm hover:border-gold-primary hover:text-gold-dark transition-all"
                  >
                    Load Map Information
                  </button>
                )}
              </div>
            </section>

            {/* Amenities */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold">Amenities</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold-primary/10 text-gold-dark flex items-center justify-center">
                    <CheckCircle2 size={20} />
                  </div>
                  <span className="text-xs font-bold">24/7 Gym</span>
                </div>
                <div className="glass-card p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold-primary/10 text-gold-dark flex items-center justify-center">
                    <CheckCircle2 size={20} />
                  </div>
                  <span className="text-xs font-bold">Rooftop Pool</span>
                </div>
              </div>
            </section>
          </motion.div>
        );
      case 'tickets':
// ... rest of the code ...
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6 pb-8"
          >
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Maintenance</h1>
              <button 
                onClick={() => setIsRequestModalOpen(true)}
                className="p-2 rounded-full gold-gradient text-white shadow-lg"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" size={18} />
              <input 
                type="text" 
                placeholder="Search requests..." 
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border-none shadow-sm focus:ring-2 focus:ring-gold-primary transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {['All', 'Pending', 'In Progress', 'Completed'].map((status) => (
                <button key={status} className="px-5 py-2.5 rounded-full glass-card text-xs font-bold whitespace-nowrap active:bg-gold-primary active:text-white transition-all">
                  {status}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {tickets.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase())).map((ticket, idx) => (
                <TicketCard key={ticket.id} ticket={ticket} index={idx} />
              ))}
              <div className="p-12 text-center text-black/30">
                <p className="text-sm font-medium italic">No more active requests</p>
              </div>
            </div>
          </motion.div>
        );
      case 'wallet':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8 pb-8"
          >
            <h1 className="text-2xl font-bold">My Wallet</h1>
            
            {/* Payment History */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-black/40">Recent Transactions</h3>
              <div className="glass-card rounded-[2.5rem] overflow-hidden">
                {payments.map((payment, idx) => (
                  <div key={payment.id} className={cn("p-6 flex items-center justify-between", idx !== payments.length - 1 && "border-b border-black/5", payment.status === 'Overdue' && "bg-red-50/30")}>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        payment.status === 'Paid' ? "bg-green-50 text-green-600" : 
                        payment.status === 'Overdue' ? "bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse" : 
                        "bg-gold-primary/10 text-gold-dark"
                      )}>
                        {payment.status === 'Overdue' ? <AlertCircle size={20} /> : <CreditCard size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{payment.description}</p>
                        <p className="text-[10px] text-black/40 font-medium">{payment.dueDate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">₪{payment.amount.toFixed(2)}</p>
                      <p className={cn(
                        "text-[10px] font-bold uppercase tracking-wider", 
                        payment.status === 'Paid' ? "text-green-600" : 
                        payment.status === 'Overdue' ? "text-red-600" : 
                        "text-gold-dark"
                      )}>
                        {payment.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-widest text-black/40">Payment Methods</h3>
                <button className="text-xs font-bold text-gold-dark uppercase tracking-wider">Add New</button>
              </div>
              <div className="glass-card rounded-[2rem] p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-black rounded flex items-center justify-center text-white text-[8px] font-bold">VISA</div>
                  <div>
                    <p className="text-sm font-bold">•••• 4242</p>
                    <p className="text-[10px] text-black/40 font-medium">Expires 12/26</p>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full border-2 border-gold-primary flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-gold-primary rounded-full" />
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 'profile':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <img src={currentUser.avatar} alt={currentUser.name} className="w-24 h-24 rounded-full border-4 border-white shadow-xl mx-auto" referrerPolicy="no-referrer" />
                <button className="absolute bottom-0 right-0 p-2 bg-gold-primary text-white rounded-full shadow-lg">
                  <Plus size={16} />
                </button>
              </div>
              <div>
                <h1 className="text-2xl font-bold">{currentUser.name}</h1>
                <p className="text-gold-dark font-bold uppercase tracking-widest text-xs">{currentUser.unit}</p>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-2">
              <MenuLink icon={<UserIcon />} label="Personal Information" />
              <MenuLink icon={<CreditCard />} label="Payment Methods" />
              <MenuLink icon={<Bell />} label="Notifications" />
              <MenuLink icon={<Settings />} label="App Settings" />
            </div>

            <button className="w-full py-4 rounded-2xl bg-red-50 text-red-600 font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
              Logout
            </button>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-premium-bg pb-24">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 glass-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center text-white font-bold shadow-lg">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-premium-black">{currentUser.name}</h2>
            <p className="text-[10px] uppercase tracking-widest text-gold-dark font-bold">{currentUser.unit}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-full hover:bg-black/5 transition-colors">
            <Bell size={22} className="text-premium-black" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-full hover:bg-black/5 transition-colors"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 pt-6">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass-card border-t border-black/5 px-6 py-4 flex justify-between items-center z-50">
        <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<LayoutDashboard size={24} />} label="Home" />
        <NavButton active={activeTab === 'tickets'} onClick={() => setActiveTab('tickets')} icon={<Wrench size={24} />} label="Tickets" />
        <div className="relative -top-8">
          <button 
            onClick={() => setIsRequestModalOpen(true)}
            className="w-14 h-14 rounded-full gold-gradient shadow-2xl flex items-center justify-center text-white border-4 border-premium-bg active:scale-90 transition-transform"
          >
            <Plus size={32} strokeWidth={3} />
          </button>
        </div>
        <NavButton active={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} icon={<CreditCard size={24} />} label="Wallet" />
        <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<UserIcon size={24} />} label="Profile" />
      </nav>

      {/* New Request Modal */}
      <AnimatePresence>
        {isRequestModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRequestModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white z-[110] rounded-t-[3rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">New Request</h2>
                  <button onClick={() => setIsRequestModalOpen(false)} className="p-2 rounded-full bg-premium-bg">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Category</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Plumbing', 'HVAC', 'Electrical', 'Cleaning', 'Security', 'Other'].map(cat => (
                        <button key={cat} className="py-3 rounded-xl border border-black/5 text-[10px] font-bold hover:border-gold-primary hover:text-gold-dark transition-all">
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Title</label>
                    <input type="text" placeholder="e.g. Leaking Faucet" className="w-full p-4 rounded-2xl bg-premium-bg border-none focus:ring-2 focus:ring-gold-primary transition-all" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Description</label>
                    <textarea rows={4} placeholder="Describe the issue..." className="w-full p-4 rounded-2xl bg-premium-bg border-none focus:ring-2 focus:ring-gold-primary transition-all" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Priority</label>
                    <div className="flex gap-2">
                      {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                        <button key={p} className="flex-1 py-3 rounded-xl border border-black/5 text-[10px] font-bold hover:border-gold-primary hover:text-gold-dark transition-all">
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button className="w-full py-4 rounded-2xl gold-gradient text-white font-bold shadow-xl active:scale-95 transition-transform">
                    Submit Request
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Side Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-4/5 bg-white z-[70] p-8 shadow-2xl"
            >
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold gold-text-gradient">Settings</h2>
                  <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-full bg-premium-bg">
                    <X size={24} />
                  </button>
                </div>
                <div className="space-y-4">
                  <MenuLink icon={<UserIcon />} label="Personal Information" />
                  <MenuLink icon={<CreditCard />} label="Payment Methods" />
                  <MenuLink icon={<Bell />} label="Notifications" />
                  <MenuLink icon={<Settings />} label="App Settings" />
                  <div className="pt-8 border-t border-black/5">
                    <button className="w-full py-4 rounded-2xl bg-red-50 text-red-600 font-bold flex items-center justify-center gap-2">
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuickAction({ icon, label, sub, delay, onClick }: { icon: React.ReactNode, label: string, sub: string, delay: number, onClick?: () => void }) {
  return (
    <motion.button 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="glass-card p-5 rounded-[2rem] flex flex-col items-start gap-4 text-left hover:bg-white transition-all"
    >
      <div className="p-3 rounded-2xl bg-gold-primary/10 text-gold-dark">
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold leading-tight">{label}</p>
        <p className="text-[10px] text-black/40 font-medium uppercase tracking-wider">{sub}</p>
      </div>
    </motion.button>
  );
}

const TicketCard: React.FC<{ ticket: MaintenanceTicket, index: number }> = ({ ticket, index }) => {
  const statusColors = {
    'Pending': 'bg-gold-primary/10 text-gold-dark',
    'In Progress': 'bg-blue-50 text-blue-600',
    'Completed': 'bg-green-50 text-green-600'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass-card p-5 rounded-3xl flex items-center justify-between group cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-premium-bg flex items-center justify-center text-gold-dark group-hover:gold-gradient group-hover:text-white transition-all">
          <Wrench size={20} />
        </div>
        <div>
          <h4 className="font-bold text-sm">{ticket.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider", statusColors[ticket.status])}>
              {ticket.status}
            </span>
            <span className="text-[10px] text-black/30 font-medium">{ticket.date}</span>
          </div>
        </div>
      </div>
      <ChevronRight size={20} className="text-black/20 group-hover:text-gold-primary transition-colors" />
    </motion.div>
  );
};

function ActivityItem({ icon, title, time, desc }: { icon: React.ReactNode, title: string, time: string, desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="mt-1">{icon}</div>
      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-center">
          <p className="text-sm font-bold">{title}</p>
          <p className="text-[10px] text-black/30 font-medium">{time}</p>
        </div>
        <p className="text-xs text-black/50">{desc}</p>
      </div>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all",
        active ? "text-gold-dark scale-110" : "text-black/30 hover:text-black/50"
      )}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      {active && <motion.div layoutId="nav-dot" className="w-1 h-1 bg-gold-dark rounded-full mt-1" />}
    </button>
  );
}

function MenuLink({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-premium-bg transition-colors group">
      <div className="flex items-center gap-4">
        <div className="text-black/40 group-hover:text-gold-primary transition-colors">
          {React.cloneElement(icon as React.ReactElement, { size: 20 })}
        </div>
        <span className="font-semibold text-premium-black">{label}</span>
      </div>
      <ChevronRight size={18} className="text-black/20" />
    </button>
  );
}
