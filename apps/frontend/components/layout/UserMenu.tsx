// /Users/orperetz/Documents/AMS/apps/frontend/components/layout/UserMenu.tsx
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { User, LogOut, Settings } from 'lucide-react';
import { AmsDrawer } from '../ui/ams-drawer';
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
import { getUserRoleLabel } from '../../lib/utils';

export default function UserMenu() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const [payload, setPayload] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPayload(getTokenPayload());
    setIsMobile(window.matchMedia('(max-width: 767px)').matches);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const media = window.matchMedia('(max-width: 767px)');
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    media.addEventListener('change', onChange);
    setIsMobile(media.matches);

    return () => media.removeEventListener('change', onChange);
  }, [mounted]);

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
  const profileHref = currentRole === 'RESIDENT' ? '/resident/profile' : '/settings';
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
      : {};

  const handleLogout = () => {
    logout();
  };

  if (isMobile) {
    return (
      <>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full" onClick={() => setMobileOpen(true)} aria-label={t('bottomNav.moreMenu')}>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>

        <AmsDrawer
          isOpen={mobileOpen}
          onOpenChange={setMobileOpen}
          title={displayName}
          description={`${roleLabels[currentRole] || getUserRoleLabel(currentRole)}${isImpersonating ? ` · ${t('userMenu.impersonating')}` : ''}`}
          placement="bottom"
          size="lg"
        >
          <div className="space-y-3 pb-2">
            <Link
              href={profileHref}
              className="flex min-h-[64px] items-center gap-3 rounded-[24px] border border-white/10 bg-white/6 px-4 py-3"
              onClick={() => setMobileOpen(false)}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/16 bg-primary/16 text-primary">
                <User className="h-4 w-4" strokeWidth={1.85} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white">{t('userMenu.profile')}</span>
                <span className="mt-1 block text-xs leading-5 text-white/68">{displayName}</span>
              </span>
            </Link>

            <Link
              href="/settings"
              className="flex min-h-[64px] items-center gap-3 rounded-[24px] border border-white/10 bg-white/6 px-4 py-3"
              onClick={() => setMobileOpen(false)}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/16 bg-primary/16 text-primary">
                <Settings className="h-4 w-4" strokeWidth={1.85} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white">{t('userMenu.settings')}</span>
                <span className="mt-1 block text-xs leading-5 text-white/68">{t('shell.settings')}</span>
              </span>
            </Link>

            <div className="border-t border-white/10 pt-3">
              <Button variant="destructive" className="w-full justify-between rounded-[22px]" onClick={handleLogout}>
                <span className="inline-flex items-center gap-2">
                  <LogOut className="h-4 w-4" strokeWidth={1.8} />
                  {t('userMenu.logout')}
                </span>
              </Button>
            </div>
          </div>
        </AmsDrawer>
      </>
    );
  }

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
              {roleLabels[currentRole] || getUserRoleLabel(currentRole)}
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
