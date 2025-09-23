// /Users/orperetz/Documents/AMS/apps/frontend/components/layout/Breadcrumbs.tsx
"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDirection, useLocale } from '../../lib/providers';

interface BreadcrumbItem {
  title: string;
  href: string;
}

export default function Breadcrumbs() {
  const router = useRouter();
  const { direction } = useDirection();
  const { t } = useLocale();

  const breadcrumbs = useMemo(() => {
    const pathWithoutQuery = router.asPath.split('?')[0].split('#')[0];
    const segments = pathWithoutQuery.split('/').filter(Boolean);
    if (segments.length === 0) {
      return [] as BreadcrumbItem[];
    }

    const labelMap: Record<string, string> = {
      home: 'בית',
      admin: t('nav.admin'),
      dashboard: t('nav.dashboard'),
      tickets: t('nav.tickets'),
      tech: t('nav.tech-jobs'),
      jobs: 'משימות שטח',
      buildings: t('nav.buildings'),
      payments: t('nav.payments'),
      maintenance: 'תחזוקה',
      finance: 'פיננסים',
      budgets: 'תקציבים',
      documents: 'מסמכים',
      assets: 'נכסים',
      communications: 'תקשורת',
      notifications: t('nav.notifications'),
      'unpaid-invoices': 'חשבוניות שלא שולמו',
    };

    const items: BreadcrumbItem[] = [{ title: t('nav.home'), href: '/' }];
    segments.forEach((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join('/')}`;
      const isNumeric = /^\d+$/.test(segment);
      const title = labelMap[segment] || (isNumeric ? 'פרטים' : decodeURIComponent(segment).replace(/-/g, ' '));
      items.push({ title, href });
    });

    return items;
  }, [router.asPath, t]);

  // Don't show breadcrumbs on home page or if only one item
  if (breadcrumbs.length <= 1) {
    return null;
  }

  const ChevronIcon = direction === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <nav
      className="flex items-center space-x-1 text-sm text-muted-foreground"
      aria-label="breadcrumb"
    >
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <li key={item.href} className="flex items-center">
              {index > 0 && (
                <ChevronIcon className="mx-2 h-4 w-4 shrink-0" />
              )}
              
              {index === 0 && (
                <Home className="me-1 h-4 w-4" />
              )}
              
              {!isLast ? (
                <Link
                  href={item.href}
                  className="font-medium transition-colors hover:text-foreground"
                >
                  {item.title}
                </Link>
              ) : (
                <span 
                  className="font-medium text-foreground"
                  aria-current="page"
                >
                  {item.title}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
