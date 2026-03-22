import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { MobileCardSkeleton } from '../components/ui/page-states';
import { getTokenPayload, shouldRouteToWorkerHub } from '../lib/auth';

export default function RoleSelectionPage() {
  const router = useRouter();

  useEffect(() => {
    const payload = getTokenPayload();
    const role = payload?.actAsRole || payload?.role;
    if (!payload) {
      router.replace('/login');
      return;
    }
    const next = typeof router.query.next === 'string' ? router.query.next : undefined;
    router.replace(next || (shouldRouteToWorkerHub(role) ? '/worker-hub' : '/home'));
  }, [router]);

  return <MobileCardSkeleton cards={3} />;
}
