import { EmptyRestricted } from '../../components/ui/empty-state';
import { MobileCardSkeleton } from '../../components/ui/page-states';
import { GardensManagerHome } from '../../components/gardens/GardensManagerHome';
import { GardensWorkerWorkspace } from '../../components/gardens/GardensWorkerWorkspace';
import { canAccessGardens } from '../../gardens/lib/ams-auth';
import { getEffectiveRole, isAuthenticated } from '../../lib/auth';

export default function GardensIndexPage() {
  const role = getEffectiveRole();

  if (!isAuthenticated()) {
    return <MobileCardSkeleton cards={2} />;
  }

  if (!canAccessGardens(role)) {
    return (
      <EmptyRestricted
        action={{
          label: 'חזרה למסך הבית',
          onClick: () => {
            window.location.href = '/home';
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
