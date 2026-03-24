import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { EmptyRestricted } from '../../components/ui/empty-state';
import { MobileCardSkeleton } from '../../components/ui/page-states';
import { GardensManagerHome } from '../../components/gardens/GardensManagerHome';
import { GardensWorkerWorkspace } from '../../components/gardens/GardensWorkerWorkspace';
import { canAccessGardens } from '../../gardens/lib/ams-auth';
import { getAuthSnapshot } from '../../lib/auth';
import { setLastModule, addRecentAction } from '../../lib/engagement';

export default function GardensIndexPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    const authSnapshot = getAuthSnapshot();
    if (!authSnapshot.isAuthenticated) {
      const next = encodeURIComponent(router.asPath || '/gardens');
      void router.replace(`/login?next=${next}`);
      return;
    }

    setRole(authSnapshot.role);
    setReady(true);
    setLastModule('gardens', authSnapshot.userId, authSnapshot.role);
    addRecentAction({ id: 'gardens-visit', label: 'מודול הגינון', href: '/gardens', screen: 'gardens', role: authSnapshot.role || 'unknown' }, authSnapshot.userId);
  }, [router, router.isReady]);

  if (!ready) {
    return <MobileCardSkeleton cards={2} />;
  }

  if (!canAccessGardens(role)) {
    return (
      <EmptyRestricted
        action={{
          label: 'חזרה למסך הבית',
          onClick: () => {
            void router.push('/home');
          },
          variant: 'outline',
        }}
      />
    );
  }

  if (role === 'TECH') {
    return <GardensWorkerWorkspace />;
  }

  return <GardensManagerHome />;
}
