// /Users/orperetz/Documents/AMS/apps/frontend/components/layout/Header.tsx
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, Sun, Moon, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { useTheme, useDirection, useLocale } from '../../lib/providers';
import { cn } from '../../lib/utils';
import RoleSwitcher from '../RoleSwitcher';
import UserMenu from './UserMenu';

interface HeaderProps {
  className?: string;
  onMenuClick?: () => void;
  sidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Header({ 
  className, 
  onMenuClick, 
  sidebarCollapsed, 
  onToggleCollapse 
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { direction, setDirection } = useDirection();
  const { locale, setLocale } = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleDirection = () => {
    setDirection(direction === 'rtl' ? 'ltr' : 'rtl');
    setLocale(locale === 'he' ? 'en' : 'he');
  };

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm",
      className
    )}>
      <div className="container flex h-16 items-center justify-between">
        {/* Left section: Menu & Logo */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">פתח תפריט</span>
          </Button>

          {/* Desktop collapse button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="hidden md:flex"
          >
            {direction === 'rtl' ? (
              sidebarCollapsed ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />
            ) : (
              sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />
            )}
            <span className="sr-only">הסתר/הצג סיידבר</span>
          </Button>

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              A
            </div>
            <span className="hidden font-bold sm:inline-block">
              עמית אקסלנס אחזקות
            </span>
          </Link>
        </div>

        {/* Center section: Role Switcher */}
        <div className="flex-1 flex justify-center">
          <RoleSwitcher />
        </div>

        {/* Right section: Controls & User Menu */}
        <div className="flex items-center gap-2">
          {/* Theme toggle - only render after mount */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              <span className="sr-only">החלף ערכת נושא</span>
            </Button>
          )}

          {/* Direction/Language toggle - only render after mount */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDirection}
              className="h-9 w-9"
            >
              <Globe className="h-4 w-4" />
              <span className="sr-only">החלף שפה וכיוון</span>
            </Button>
          )}

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
