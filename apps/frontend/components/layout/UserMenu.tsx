// /Users/orperetz/Documents/AMS/apps/frontend/components/layout/UserMenu.tsx
"use client";

import React, { useEffect, useState } from 'react';
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
  const { t } = useLocale();
  const [payload, setPayload] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPayload(getTokenPayload());
  }, []);

  // Don't render on server or before mount to prevent hydration mismatch
  if (!mounted || !payload) {
    return null;
  }

  const userInitials = payload.email 
    ? payload.email.substring(0, 2).toUpperCase()
    : 'U';

  const currentRole = payload.actAsRole || payload.role;
  const isImpersonating = !!payload.actAsRole;

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
              {payload.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {currentRole}
              {isImpersonating && (
                <span className="ms-1 text-warning">(התחזות)</span>
              )}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="me-2 h-4 w-4" />
          <span>פרופיל</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="me-2 h-4 w-4" />
          <span>הגדרות</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="me-2 h-4 w-4" />
          <span>התנתק</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
