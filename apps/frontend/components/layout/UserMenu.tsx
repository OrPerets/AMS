// /Users/orperetz/Documents/AMS/apps/frontend/components/layout/UserMenu.tsx
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { User, LogOut, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { getTokenPayload, logout } from '../../lib/auth';
import { useLocale } from '../../lib/providers';

export default function UserMenu() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const [payload, setPayload] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPayload(getTokenPayload());
  }, []);

  // Listen for route changes to re-read token payload (for role changes)
  useEffect(() => {
    setPayload(getTokenPayload());
  }, [router.pathname]);

  // Don't render on server or before mount to prevent hydration mismatch
  if (!mounted || !payload) {
    return null;
  }

  const displayName = payload.email || t('userMenu.userFallback', { id: String(payload.sub) });
  const userInitials = payload.email
    ? payload.email.substring(0, 2).toUpperCase()
    : `#${String(payload.sub || 'U').slice(0, 1)}`;

  const currentRole = payload.actAsRole || payload.role;
  const isImpersonating = !!payload.actAsRole;
  const profileHref = currentRole === 'RESIDENT' ? '/resident/account' : '/settings';
  const roleLabels: Record<string, string> =
    locale === 'en'
      ? {
          ADMIN: 'Admin',
          PM: 'Property manager',
          TECH: 'Field technician',
          RESIDENT: 'Resident',
          ACCOUNTANT: 'Accountant',
          MASTER: 'Master access',
        }
      : {
          ADMIN: 'מנהל מערכת',
          PM: 'מנהל בניין',
          TECH: 'טכנאי שטח',
          RESIDENT: 'דייר',
          ACCOUNTANT: 'חשבונות',
          MASTER: 'גישה ראשית',
        };

  const handleLogout = () => {
    logout();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {displayName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {roleLabels[currentRole] || currentRole}
              {isImpersonating && (
                <span className="ms-1 text-warning">({t('userMenu.impersonating')})</span>
              )}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={profileHref}>
          <User className="me-2 h-4 w-4" />
          <span>{t('userMenu.profile')}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
          <Settings className="me-2 h-4 w-4" />
          <span>{t('userMenu.settings')}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="me-2 h-4 w-4" />
          <span>{t('userMenu.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
