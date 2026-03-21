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
      "border-t bg-muted/30 px-4 py-3 sm:px-6 sm:py-4",
      className
    )}>
      <div className="container flex flex-col items-center justify-between gap-2.5 sm:flex-row sm:gap-4">
        <p className="text-xs sm:text-sm text-muted-foreground">
          © {currentYear} {t('app.company')}
        </p>

        <div className="flex items-center gap-4 sm:gap-6">
          <Link 
            href="/privacy" 
            className="text-xs sm:text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('footer.privacy')}
          </Link>
          <Link 
            href="/terms" 
            className="text-xs sm:text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('footer.terms')}
          </Link>
          <Link 
            href="/support" 
            className="text-xs sm:text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('footer.support')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
