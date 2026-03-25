import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  Apple, 
  Smartphone, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  History,
  ArrowUpRight
} from 'lucide-react';
import { Button, Card, Badge } from './UI';
import { cn } from '@/src/lib/utils';

const TRANSACTIONS = [
  { id: '1', title: 'Monthly Rent - March', amount: 2450, date: 'Mar 01, 2026', status: 'Paid' },
  { id: '2', title: 'Electricity Bill', amount: 124.50, date: 'Feb 28, 2026', status: 'Paid' },
  { id: '3', title: 'Water & Sewage', amount: 45.20, date: 'Feb 25, 2026', status: 'Paid' },
];

export const PaymentScreen = () => {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState('card');

  return (
    <div className="p-6 space-y-8 pb-24">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-neutral-500 text-sm">Manage your dues and history</p>
        </div>
        <Button variant="ghost" size="icon">
          <History className="w-5 h-5" />
        </Button>
      </header>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="payment-main"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Outstanding Balance */}
            <Card className="p-6 bg-neutral-900 text-white border-none relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/20 blur-3xl rounded-full -mr-16 -mt-16" />
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 text-xs font-bold uppercase tracking-widest">Total Balance</span>
                  <Badge variant="warning" className="bg-gold/20 text-gold border-none">Due in 5 days</Badge>
                </div>
                <div className="text-4xl font-display font-bold">$2,450.00</div>
                <div className="pt-4">
                  <Button variant="gold" className="w-full py-4 rounded-xl" onClick={() => setStep(2)}>
                    Pay Now
                  </Button>
                </div>
              </div>
            </Card>

            {/* Payment Methods */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold">Payment Methods</h2>
              <div className="space-y-3">
                <Card className="p-4 flex items-center justify-between cursor-pointer hover:border-gold transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-neutral-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">•••• 4242</div>
                      <div className="text-xs text-neutral-400">Expires 12/28</div>
                    </div>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-gold flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-gold rounded-full" />
                  </div>
                </Card>
                <Button variant="outline" className="w-full py-4 border-dashed border-2 text-neutral-500">
                  + Add New Method
                </Button>
              </div>
            </section>

            {/* Recent Transactions */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold">Recent History</h2>
              <div className="space-y-3">
                {TRANSACTIONS.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                        <ArrowUpRight className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{tx.title}</div>
                        <div className="text-xs text-neutral-400">{tx.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">-${tx.amount}</div>
                      <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">{tx.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="payment-process"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Checkout</h2>
              <p className="text-neutral-500">Confirm your payment details</p>
            </div>

            <Card className="p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Rent (March)</span>
                <span className="font-bold">$2,450.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Service Fee</span>
                <span className="font-bold">$0.00</span>
              </div>
              <div className="h-px bg-neutral-100" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-gold">$2,450.00</span>
              </div>
            </Card>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Pay with</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setMethod('apple')}
                  className={cn(
                    "p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all",
                    method === 'apple' ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-100"
                  )}
                >
                  <Apple className="w-6 h-6" />
                  <span className="text-xs font-bold">Apple Pay</span>
                </button>
                <button 
                  onClick={() => setMethod('card')}
                  className={cn(
                    "p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all",
                    method === 'card' ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-100"
                  )}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="text-xs font-bold">Card •••• 4242</span>
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <Button variant="gold" className="w-full py-4 text-lg" onClick={() => setStep(1)}>
                Confirm Payment
              </Button>
              <div className="flex items-center justify-center gap-2 text-neutral-400">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs">Secure encrypted payment</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
