// /Users/orperetz/Documents/AMS/apps/frontend/pages/index.tsx
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from '../components/ui/button';
import { Building } from 'lucide-react';
import { getDefaultRoute, isAuthenticated } from '../lib/auth';

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated()) {
      router.replace(getDefaultRoute());
    }
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
      {/* Animated background shapes */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -start-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 end-0 h-80 w-80 rounded-full bg-accent/10 blur-3xl animate-[pulse_5s_ease-in-out_infinite]" />
      </div>

      <div className="text-center p-6">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <Building className="h-10 w-10" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
          עמית אקסלנס אחזקו
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8">
          AMS — מערכת לניהול אחזקות מתקדמת
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/login">
            <Button size="lg" className="h-12 px-8 text-base">
              כניסה למערכת
            </Button>
          </Link>
          <Link href="/home">
            <Button variant="outline" size="lg" className="h-12 px-8 text-base">
              סיור מהיר
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
