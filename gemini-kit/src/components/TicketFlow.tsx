import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  MapPin, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  X,
  Droplets,
  Zap,
  Wind,
  Shield,
  Settings
} from 'lucide-react';
import { Button, Card, Badge } from './UI';
import { cn } from '@/src/lib/utils';

const CATEGORIES = [
  { id: 'plumbing', label: 'Plumbing', icon: Droplets, color: 'text-blue-500' },
  { id: 'electrical', label: 'Electrical', icon: Zap, color: 'text-amber-500' },
  { id: 'hvac', label: 'HVAC', icon: Wind, color: 'text-emerald-500' },
  { id: 'security', label: 'Security', icon: Shield, color: 'text-rose-500' },
  { id: 'general', label: 'General', icon: Settings, color: 'text-neutral-500' },
];

export const TicketFlow = ({ onComplete, onCancel }: { onComplete: () => void, onCancel: () => void }) => {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('Medium');

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-5 h-5" />
        </Button>
        <h2 className="font-bold">Report an Issue</h2>
        <div className="w-9" /> {/* Spacer */}
      </header>

      {/* Progress Bar */}
      <div className="h-1 bg-neutral-100 w-full">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(step / 3) * 100}%` }}
          className="h-full bg-gold"
        />
      </div>

      <main className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-xl font-bold">What's the problem?</h3>
                <p className="text-neutral-500 text-sm">Select a category for your request</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCategory(cat.id);
                      setStep(2);
                    }}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all",
                      category === cat.id ? "border-gold bg-gold/5" : "border-neutral-100 hover:border-neutral-200"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center", cat.color)}>
                        <cat.icon className="w-5 h-5" />
                      </div>
                      <span className="font-semibold">{cat.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-300" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-xl font-bold">Tell us more</h3>
                <p className="text-neutral-500 text-sm">Provide details and photos if possible</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Description</label>
                  <textarea 
                    className="w-full p-4 rounded-2xl border border-neutral-100 focus:border-gold focus:ring-0 min-h-[120px] outline-none"
                    placeholder="Describe the issue in detail..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Priority</label>
                  <div className="flex gap-2">
                    {['Low', 'Medium', 'High', 'Urgent'].map((p) => (
                      <button
                        key={p}
                        onClick={() => setPriority(p)}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-xs font-bold border transition-all",
                          priority === p ? "bg-neutral-900 text-white border-neutral-900" : "border-neutral-100 text-neutral-500"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <Button variant="outline" className="w-full py-8 border-dashed border-2 flex-col gap-2">
                    <Camera className="w-6 h-6 text-neutral-400" />
                    <span className="text-neutral-500">Add Photos</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center space-y-6 pt-12"
            >
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Ticket Submitted</h3>
                <p className="text-neutral-500">We've received your request. A technician will be assigned shortly.</p>
              </div>
              <Card className="w-full p-4 bg-neutral-50 border-none text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-neutral-400 uppercase">Ticket ID</span>
                  <span className="text-xs font-bold">#AE-2941</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-neutral-400 uppercase">Estimated Response</span>
                  <span className="text-xs font-bold text-emerald-600">Within 4 hours</span>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="p-6 border-t border-neutral-100 bg-white">
        {step < 3 ? (
          <div className="flex gap-3">
            {step > 1 && (
              <Button variant="outline" className="flex-1" onClick={() => setStep(step - 1)}>Back</Button>
            )}
            <Button variant="gold" className="flex-[2]" onClick={() => setStep(step + 1)}>
              {step === 2 ? 'Submit Request' : 'Next'}
            </Button>
          </div>
        ) : (
          <Button variant="primary" className="w-full" onClick={onComplete}>Back to Dashboard</Button>
        )}
      </footer>
    </div>
  );
};
