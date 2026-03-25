import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Ticket, 
  CreditCard, 
  Building2, 
  UserCircle, 
  Plus,
  Settings,
  LogOut,
  ShieldCheck,
  Briefcase,
  Home,
  Wrench,
  Calculator,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '@/src/types';
import { Dashboard } from '@/src/components/Dashboard';
import { Button, Card } from '@/src/components/UI';
import { cn } from '@/src/lib/utils';
import { SplashScreen } from './SplashScreen';
import { TicketFlow } from './TicketFlow';
import { PaymentScreen } from './PaymentScreen';
import { PropertyManagerView } from './PropertyManagerView';
import { WorkerView } from './WorkerView';
import { AccountantView } from './AccountantView';
import { ResidentTicketsScreen } from './ResidentTicketsScreen';
import { LeaseScreen } from './LeaseScreen';

const AppLayout = () => {
  const [role, setRole] = useState<UserRole>('Property Manager');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [isSplashComplete, setIsSplashComplete] = useState(false);
  const [showTicketFlow, setShowTicketFlow] = useState(false);

  const roles: UserRole[] = ['Admin', 'Property Manager', 'Resident', 'Worker', 'Accountant'];

  const getRoleIcon = (r: UserRole) => {
    switch (r) {
      case 'Admin': return <ShieldCheck className="w-4 h-4" />;
      case 'Property Manager': return <Briefcase className="w-4 h-4" />;
      case 'Resident': return <Home className="w-4 h-4" />;
      case 'Worker': return <Wrench className="w-4 h-4" />;
      case 'Accountant': return <Calculator className="w-4 h-4" />;
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'tickets', label: role === 'Resident' ? 'My Tickets' : 'Tickets', icon: Ticket },
    { id: 'properties', label: role === 'Resident' ? 'Lease' : 'Properties', icon: Building2 },
    { id: 'payments', label: 'Finance', icon: CreditCard },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ];

  if (!isSplashComplete) {
    return <SplashScreen onComplete={() => setIsSplashComplete(true)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        if (role === 'Worker') return <WorkerView />;
        if (role === 'Accountant') return <AccountantView />;
        return (
          <Dashboard 
            role={role} 
            onAction={(action) => {
              if (action === 'ticket') setShowTicketFlow(true);
              if (action === 'payment') setActiveTab('payments');
            }} 
          />
        );
      case 'tickets':
        if (role === 'Resident') return <ResidentTicketsScreen onNewTicket={() => setShowTicketFlow(true)} />;
        return (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-300">
              <Ticket size={40} />
            </div>
            <h2 className="text-xl font-bold">Tickets Management</h2>
            <p className="text-neutral-500">View and manage all maintenance requests.</p>
            <Button variant="outline" onClick={() => setActiveTab('dashboard')}>Back to Home</Button>
          </div>
        );
      case 'payments':
        return <PaymentScreen />;
      case 'properties':
        if (role === 'Resident') return <LeaseScreen />;
        return <PropertyManagerView />;
      case 'profile':
        return (
          <div className="p-6 space-y-8">
            <header>
              <h1 className="text-2xl font-bold">Profile</h1>
              <p className="text-neutral-500 text-sm">Manage your account settings</p>
            </header>
            <Card className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 rounded-full border-4 border-gold p-1">
                <div className="w-full h-full rounded-full bg-neutral-200 overflow-hidden">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold">Felix Excellence</h2>
                <p className="text-neutral-500 text-sm">{role}</p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setShowRoleSwitcher(true)}>
                Switch Role / View
              </Button>
            </Card>
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-between px-4 py-6 rounded-2xl bg-white border border-neutral-100">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-neutral-400" />
                  <span className="font-semibold">Settings</span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-300" />
              </Button>
              <Button variant="ghost" className="w-full justify-between px-4 py-6 rounded-2xl bg-white border border-neutral-100 text-rose-600">
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5" />
                  <span className="font-semibold">Logout</span>
                </div>
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 max-w-md mx-auto relative shadow-2xl overflow-hidden flex flex-col">
      {/* Role Switcher Overlay */}
      <AnimatePresence>
        {showRoleSwitcher && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end"
            onClick={() => setShowRoleSwitcher(false)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full bg-white rounded-t-3xl p-8 space-y-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Switch Role</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowRoleSwitcher(false)}>Close</Button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {roles.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r);
                      setShowRoleSwitcher(false);
                    }}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl transition-all",
                      role === r ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      role === r ? "bg-white/20" : "bg-white"
                    )}>
                      {getRoleIcon(r)}
                    </div>
                    <span className="font-semibold">{r}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTicketFlow && (
          <TicketFlow 
            onComplete={() => setShowTicketFlow(false)} 
            onCancel={() => setShowTicketFlow(false)} 
          />
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + role}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          if (role === 'Resident') setShowTicketFlow(true);
          else setShowRoleSwitcher(true);
        }}
        className="absolute bottom-24 right-6 w-14 h-14 rounded-full bg-neutral-900 text-white shadow-2xl flex items-center justify-center z-40 border-4 border-white"
      >
        <Plus className="w-6 h-6" />
      </motion.button>


      {/* Bottom Navigation */}
      <nav className="bg-white/90 backdrop-blur-xl border-t border-neutral-100 px-2 py-3 flex justify-around items-center z-40 pb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex flex-col items-center gap-1.5 min-w-[64px] transition-all duration-300"
            >
              <div className={cn(
                "p-2 rounded-xl transition-all duration-300",
                isActive ? "bg-neutral-900 text-white scale-110 shadow-lg shadow-neutral-900/20" : "text-neutral-400 hover:text-neutral-600"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-widest transition-all duration-300",
                isActive ? "text-neutral-900 opacity-100" : "text-neutral-400 opacity-0"
              )}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute -bottom-1 w-1 h-1 bg-neutral-900 rounded-full"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Role Indicator (Debug/Demo) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-gold text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg z-50 pointer-events-none">
        {role} View
      </div>
    </div>
  );
};

export default AppLayout;
