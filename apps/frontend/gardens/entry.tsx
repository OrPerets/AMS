'use client';

import { useEffect, useState } from 'react';
import { getEffectiveRole } from '@/lib/auth';
import { GardensManagerHome } from './manager-home';
import { GardensWorkerPlanner } from './worker-planner';
import { MobileCardSkeleton } from '@/components/ui/page-states';

export function GardensEntry() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(getEffectiveRole());
  }, []);

  if (!role) {
    return <MobileCardSkeleton cards={3} />;
  }

  return role === 'TECH' ? <GardensWorkerPlanner /> : <GardensManagerHome />;
}
