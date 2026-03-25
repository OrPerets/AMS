import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'premium' | 'dark';
}

export const Card: React.FC<React.PropsWithChildren<CardProps>> = ({ className, variant = 'default', children, ...props }) => {
  const variants = {
    default: 'bg-white border border-neutral-200 shadow-sm rounded-2xl',
    glass: 'bg-white/70 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl',
    premium: 'bg-white border border-neutral-200 shadow-sm rounded-2xl hover:shadow-md transition-shadow',
    dark: 'bg-neutral-900 border border-neutral-800 shadow-xl rounded-2xl text-white',
  };

  return (
    <div className={cn(variants[variant], className)} {...props}>
      {children}
    </div>
  );
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button: React.FC<React.PropsWithChildren<ButtonProps>> = ({ className, variant = 'primary', size = 'md', children, ...props }) => {
  const variants = {
    primary: 'bg-neutral-900 text-white hover:bg-neutral-800',
    secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200',
    outline: 'border border-neutral-200 bg-transparent hover:bg-neutral-50',
    ghost: 'bg-transparent hover:bg-neutral-100',
    gold: 'bg-gradient-to-br from-gold-light via-gold to-gold-dark text-white shadow-lg shadow-gold/20 hover:opacity-90',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
    icon: 'p-2',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export const Badge = ({ children, className, variant = 'default' }: { children: React.ReactNode, className?: string, variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'gold' }) => {
  const variants = {
    default: 'bg-neutral-100 text-neutral-600',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-rose-100 text-rose-700',
    info: 'bg-blue-100 text-blue-700',
    gold: 'bg-gold/10 text-gold border border-gold/20',
  };

  return (
    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider', variants[variant], className)}>
      {children}
    </span>
  );
};

export const Progress = ({ value, className, color = 'gold' }: { value: number, className?: string, color?: 'gold' | 'emerald' | 'rose' | 'neutral' }) => {
  const colors = {
    gold: 'bg-gold',
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
    neutral: 'bg-neutral-900',
  };

  return (
    <div className={cn('w-full h-2 bg-neutral-100 rounded-full overflow-hidden', className)}>
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className={cn('h-full rounded-full', colors[color])}
      />
    </div>
  );
};
