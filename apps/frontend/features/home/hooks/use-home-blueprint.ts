import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Sparkles } from 'lucide-react';
import { ROLE_SELECTION_ROUTE, getAuthSnapshot, getCurrentUserId, getEffectiveRole } from '../../../lib/auth';
import { getRoleCapabilities } from '../../../lib/role-capabilities';
import { trackEvent } from '../../../lib/analytics';
import { setLastModule, addRecentAction } from '../../../lib/engagement';
import { toast } from '../../../components/ui/use-toast';
import { buildHomeBlueprint, buildFallbackBlueprint } from '../api/home-data';
import type { HomeBlueprintState, RoleKey } from '../model/types';

export function useHomeBlueprint() {
  const router = useRouter();
  const [role, setRole] = useState<RoleKey>('RESIDENT');
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [blueprint, setBlueprint] = useState<HomeBlueprintState | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const currentUserId = getCurrentUserId();

  useEffect(() => {
    setMounted(true);
    setRole((getEffectiveRole() as RoleKey) || 'RESIDENT');
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const authSnapshot = getAuthSnapshot();
    const effectiveRole = (authSnapshot.role as RoleKey | null) || 'RESIDENT';
    setRole(effectiveRole);

    if (!authSnapshot.isAuthenticated) {
      const next = encodeURIComponent(router.asPath || '/home');
      void router.replace(`/login?next=${next}`);
      return;
    }

    const capabilities = getRoleCapabilities(effectiveRole);

    if (capabilities?.role === 'RESIDENT') {
      void router.replace('/resident/account');
      return;
    }

    if (!capabilities?.canAccessAms) {
      void router.replace(ROLE_SELECTION_ROUTE);
      return;
    }

    setLastModule('ams', authSnapshot.userId, effectiveRole);
    addRecentAction({ id: 'home-visit', label: 'דף הבית', href: '/home', screen: 'home', role: effectiveRole }, authSnapshot.userId);
    void loadBlueprint(effectiveRole);
  }, [mounted, router]);

  useEffect(() => {
    if (!mounted || !currentUserId) return;
    const key = `amit-onboarding:v8:${currentUserId}:${role}`;
    const seen = window.localStorage.getItem(key);
    setOnboardingOpen(!seen);
  }, [currentUserId, mounted, role]);

  async function loadBlueprint(activeRole: RoleKey) {
    try {
      setLoading(true);
      setBlueprint(await buildHomeBlueprint(activeRole, currentUserId));
    } catch (error) {
      console.error(error);
      toast({
        title: 'טעינת דף הבית נכשלה',
        description: 'תצורת הגיבוי הופעלה כדי שתוכל להמשיך לעבוד במסלולים הראשיים.',
        variant: 'destructive',
      });
      setBlueprint(buildFallbackBlueprint(activeRole));
    } finally {
      setLoading(false);
    }
  }

  const onboardingSteps = useMemo(() => getOnboardingSteps(role), [role]);

  function completeOnboarding() {
    if (currentUserId && typeof window !== 'undefined') {
      window.localStorage.setItem(`amit-onboarding:v8:${currentUserId}:${role}`, new Date().toISOString());
    }
    setOnboardingOpen(false);
    trackEvent('onboarding_complete', { role });
    toast({
      title: 'מסלול הפתיחה נשמר',
      description: 'המסך הראשי ימשיך לפתוח עבורך את הבלופרינט המתאים לכל תפקיד.',
      variant: 'success',
    });
  }

  return {
    role,
    mounted,
    loading,
    blueprint,
    onboardingOpen,
    setOnboardingOpen,
    onboardingSteps,
    completeOnboarding,
  };
}

function getOnboardingSteps(role: RoleKey) {
  const shared = [
    {
      title: 'התחל מהכרטיס העליון',
      description: 'סטטוס קצר למעלה, פעולה ראשית אחת, ואז 2×2 קיצורים שממשיכים לזרימת העבודה שלך.',
    },
    {
      title: 'השתמש בארבעת הקיצורים',
      description: 'כל קיצור מייצג מסלול עבודה קבוע מהבלופרינט של התפקיד שלך — לא תפריט כללי.',
    },
  ];

  const roleSpecific: Record<RoleKey, { title: string; description: string }> = {
    ADMIN: { title: 'פתור SLA לפני כל דבר אחר', description: 'הבלופרינט הניהולי פותח תחילה חריגות, אישורים וחריגות תחזוקה.' },
    PM: { title: 'שייך ואז סקור בניינים', description: 'קודם משייכים קריאות חדשות, אחר כך יורדים לבניינים, ליומן ולספקים.' },
    TECH: { title: 'התחל עבודה ועדכן מהשטח', description: 'המסך מציג את המשימה הבאה ואת תור היום כדי שתוכל לזוז בלי לחפש.' },
    RESIDENT: { title: 'שלם או פתח פנייה', description: 'המסך משאיר את החשבון, הקריאות והבקשות באותה שכבת פתיחה.' },
    ACCOUNTANT: { title: 'פעל לפי גבייה ופיגורים', description: 'קודם פותחים רשימת גבייה, אחר כך בודקים חריגות תקציב ודוחות.' },
    MASTER: { title: 'התחל מהבלופרינט הניהולי', description: 'כמנהל-על, דף הבית נפתח דרך מסלול הבקרה והחריגות של ADMIN.' },
  };

  return [...shared, roleSpecific[role]];
}
