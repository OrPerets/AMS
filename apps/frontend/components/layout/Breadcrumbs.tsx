// /Users/orperetz/Documents/AMS/apps/frontend/components/layout/Breadcrumbs.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDirection, useLocale } from '../../lib/providers';

// Breadcrumb configuration for different routes
const getBreadcrumbConfig = (t: (key: string) => string) => ({
  '/': [{ title: t('nav.home'), href: '/' }],
  '/home': [
    { title: t('nav.home'), href: '/' },
    { title: 'בית', href: '/home' }
  ],
  '/admin/dashboard': [
    { title: t('nav.home'), href: '/' },
    { title: t('nav.dashboard'), href: '/admin/dashboard' }
  ],
  '/tickets': [
    { title: t('nav.home'), href: '/' },
    { title: t('nav.tickets'), href: '/tickets' }
  ],
  '/tech/jobs': [
    { title: t('nav.home'), href: '/' },
    { title: t('nav.tech-jobs'), href: '/tech/jobs' }
  ],
  '/buildings': [
    { title: t('nav.home'), href: '/' },
    { title: t('nav.buildings'), href: '/buildings' }
  ],
  '/payments': [
    { title: t('nav.home'), href: '/' },
    { title: t('nav.payments'), href: '/payments' }
  ],
  '/admin/unpaid-invoices': [
    { title: t('nav.home'), href: '/' },
    { title: t('nav.admin'), href: '/admin/dashboard' },
    { title: 'חשבוניות שלא שולמו', href: '/admin/unpaid-invoices' }
  ],
});

interface BreadcrumbItem {
  title: string;
  href: string;
}

export default function Breadcrumbs() {
  const router = useRouter();
  const { direction } = useDirection();
  const { t } = useLocale();

  const breadcrumbConfig = getBreadcrumbConfig(t);
  const currentPath = router.pathname;
  
  // Get breadcrumb items for current path
  const breadcrumbItems: BreadcrumbItem[] = breadcrumbConfig[currentPath as keyof typeof breadcrumbConfig] || [
    { title: t('nav.home'), href: '/' },
    { title: 'עמוד לא מוכר', href: currentPath }
  ];

  // Don't show breadcrumbs on home page or if only one item
  if (breadcrumbItems.length <= 1) {
    return null;
  }

  const ChevronIcon = direction === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <nav 
      className="flex items-center space-x-1 text-sm text-muted-foreground"
      aria-label="breadcrumb"
    >
      <ol className="flex items-center space-x-1">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          
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
