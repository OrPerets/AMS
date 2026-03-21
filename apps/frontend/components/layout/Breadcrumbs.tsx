// /Users/orperetz/Documents/AMS/apps/frontend/components/layout/Breadcrumbs.tsx
"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
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
      // Main sections
      home: t('nav.homeOverview'),
      admin: t('nav.group.admin'),
      configuration: t('nav.configuration'),
      dashboard: t('nav.dashboard'),
      // Operations
      tickets: t('nav.tickets'),
      maintenance: t('nav.maintenance'),
      tech: t('nav.techJobs'),
      jobs: t('nav.techJobs'),
      communications: t('nav.communications'),
      // Property Management
      buildings: t('nav.buildings'),
      assets: t('nav.assets'),
      documents: t('nav.documents'),
      // Financial
      payments: t('nav.payments'),
      finance: t('nav.group.finance'),
      budgets: t('nav.budgets'),
      reports: t('nav.financeReports'),
      analytics: 'ניתוח פיננסי',
      'unpaid-invoices': t('nav.unpaidInvoices'),
      // System
      notifications: t('nav.notifications'),
      settings: t('nav.settings'),
      support: t('nav.support'),
      privacy: t('nav.privacy'),
      terms: t('nav.terms'),
    };

    const items: BreadcrumbItem[] = [{ title: t('nav.home'), href: '/' }];
    segments.forEach((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join('/')}`;
      const isNumeric = /^\d+$/.test(segment);
      const title = labelMap[segment] || (isNumeric ? t('common.untitledDetails') : decodeURIComponent(segment).replace(/-/g, ' '));
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
