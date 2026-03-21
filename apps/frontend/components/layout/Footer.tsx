// /Users/orperetz/Documents/AMS/apps/frontend/components/layout/Footer.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { cn } from '../../lib/utils';
import { useLocale } from '../../lib/providers';

interface FooterProps {
  className?: string;
}

export default function Footer({ className }: FooterProps) {
  const { t } = useLocale();
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn(
      "border-t bg-muted/30 px-6 py-4",
      className
    )}>
      <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
        {/* Left side: Company info */}
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <p className="text-sm text-muted-foreground">
            © {currentYear} {t('app.company')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('footer.productLabel')}
          </p>
        </div>

        {/* Right side: Links */}
        <div className="flex items-center gap-6">
          <Link 
            href="/privacy" 
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('footer.privacy')}
          </Link>
          <Link 
            href="/terms" 
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('footer.terms')}
          </Link>
          <Link 
            href="/support" 
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('footer.support')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
