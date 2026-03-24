import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Building2, ExternalLink, History, Leaf, ShieldCheck, Star } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import {
  EXTERNAL_SUPERVISION_REPORT_URL,
  getAmsRouteForRole,
  getAuthSnapshot,
  getCurrentUserId,
  getStoredWorkspaceChoice,
  getWorkspaceChoiceRoute,
  isResidentRole,
  normalizeRole,
  setStoredWorkspaceChoice,
  type WorkspaceChoice,
} from '../lib/auth';
import { canAccessGardens } from '../gardens/lib/ams-auth';
import { useDirection, useLocale } from '../lib/providers';
import {
  trackRoleSelectionView,
  trackRoleSelectionChoice,
  trackRoleSelectionResume,
  trackWorkspaceEnter,
  trackRememberChoiceToggle,
} from '../lib/analytics';
import { trackDestinationUsage, setLastModule, addRecentAction } from '../lib/engagement';
import { showWorkspaceEntrySuccess } from '../lib/success-feedback';

type WorkspaceCard = {
  choice: WorkspaceChoice;
  title: string;
  description: string;
  cta: string;
  icon: typeof Building2;
  href: string | null;
  external?: boolean;
};

export default function RoleSelectionPage() {
  const router = useRouter();
  const { direction } = useDirection();
  const { t } = useLocale();
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [rememberChoice, setRememberChoice] = useState(false);
  const [lastChoice, setLastChoice] = useState<WorkspaceChoice | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    const authSnapshot = getAuthSnapshot();
    const effectiveRole = normalizeRole(authSnapshot.role);

    if (!authSnapshot.isAuthenticated) {
      const next = encodeURIComponent(router.asPath || '/role-selection');
      void router.replace(`/login?next=${next}`);
      return;
    }

    if (isResidentRole(effectiveRole)) {
      void router.replace('/resident/account');
      return;
    }

    const storedChoice = getStoredWorkspaceChoice(effectiveRole, authSnapshot.userId);
    setRole(effectiveRole);
    setLastChoice(storedChoice?.choice ?? null);
    setRememberChoice(Boolean(storedChoice?.remember));
    setReady(true);
    trackRoleSelectionView(effectiveRole);
  }, [router, router.isReady]);

  const next = typeof router.query.next === 'string' ? router.query.next : undefined;
  const amsHref = next || getAmsRouteForRole(role);
  const gardensHref = canAccessGardens(role) ? '/gardens' : null;
  const cards = useMemo<WorkspaceCard[]>(() => ([
    {
      choice: 'ams',
      title: t('roleSelection.card.amsTitle'),
      description: next ? t('roleSelection.card.amsRequestedDescription') : t('roleSelection.card.amsDescription'),
      cta: next ? t('roleSelection.card.amsContinueCta') : t('roleSelection.card.amsCta'),
      icon: Building2,
      href: amsHref,
    },
    {
      choice: 'supervision',
      title: t('roleSelection.card.supervisionTitle'),
      description: t('roleSelection.card.supervisionDescription'),
      cta: t('roleSelection.card.supervisionCta'),
      icon: ShieldCheck,
      href: EXTERNAL_SUPERVISION_REPORT_URL,
      external: true,
    },
    {
      choice: 'gardens',
      title: t('roleSelection.card.gardensTitle'),
      description: t('roleSelection.card.gardensDescription'),
      cta: t('roleSelection.card.gardensCta'),
      icon: Leaf,
      href: gardensHref,
    },
  ]), [amsHref, gardensHref, next, t]);

  const lastUsedCard = cards.find((card) => card.choice === lastChoice);
  const isUnsupportedRole = ready && !amsHref && role !== 'MASTER';

  async function handleSelection(choice: WorkspaceChoice, isResume = false) {
    const destination = choice === 'ams' && next ? next : getWorkspaceChoiceRoute(choice, role);
    if (!destination) return;

    setStoredWorkspaceChoice(choice, {
      role,
      userId: getCurrentUserId(),
      remember: rememberChoice,
    });
    setLastChoice(choice);

    trackRoleSelectionChoice(choice, role);
    trackWorkspaceEnter(choice, role);
    trackDestinationUsage(choice, getCurrentUserId(), role);
    setLastModule(choice, getCurrentUserId(), role);
    addRecentAction({ id: `workspace-${choice}`, label: choice, href: destination, screen: 'role-selection', role: role || 'unknown' }, getCurrentUserId());
    if (isResume) trackRoleSelectionResume(choice);

    showWorkspaceEntrySuccess(choice);

    if (choice === 'supervision') {
      const externalWindow = window.open(destination, '_blank', 'noopener,noreferrer');
      if (!externalWindow) {
        window.location.assign(destination);
      }
      return;
    }

    await router.push(destination);
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
          <p className="mt-4 text-sm text-muted-foreground">{t('roleSelection.loading')}</p>
        </div>
      </main>
    );
  }

  return (
    <main
      dir={direction}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(201,156,72,0.18),_transparent_30%),linear-gradient(180deg,_rgba(250,247,240,0.98),_rgba(245,240,230,0.88))] px-3 py-4 sm:px-4 sm:py-6"
    >
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center justify-center sm:min-h-[calc(100vh-3rem)]">
        <div className="w-full space-y-4 sm:space-y-5">
          <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
            <Card variant="featured" className="border-primary/18 shadow-[0_30px_90px_-60px_rgba(0,0,0,0.45)]">
              <CardHeader className="space-y-3 sm:space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="gold">{t('roleSelection.eyebrow')}</Badge>
                  {role ? <Badge variant="secondary">{t('roleSelection.activeRole', { role })}</Badge> : null}
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <CardTitle className="text-xl sm:text-[2rem]">{t('roleSelection.title')}</CardTitle>
                  <CardDescription className="max-w-2xl text-[13px] leading-6 sm:text-base sm:leading-8">
                    {t('roleSelection.description')}
                  </CardDescription>
                </div>
                <div className="rounded-2xl border border-primary/15 bg-primary/5 px-3 py-2.5 text-[13px] leading-5 text-muted-foreground sm:px-4 sm:py-3 sm:text-sm sm:leading-6">
                  {t('roleSelection.helper')}
                </div>
              </CardHeader>
            </Card>

            <Card variant="muted" className="border-border/70">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <History className="h-4 w-4 text-primary" />
                  {t('roleSelection.resumeTitle')}
                </div>
                <CardTitle className="text-xl">{lastUsedCard ? lastUsedCard.title : t('roleSelection.resumeEmptyTitle')}</CardTitle>
                <CardDescription className="text-sm leading-6">
                  {lastUsedCard ? t('roleSelection.resumeDescription') : t('roleSelection.resumeEmptyDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {lastUsedCard ? (
                  <Button onClick={() => void handleSelection(lastUsedCard.choice, true)} size="lg" className="w-full justify-between">
                    <span>{t('roleSelection.resumeCta')}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : null}
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">{t('roleSelection.rememberTitle')}</p>
                      <p className="text-sm leading-6 text-muted-foreground">{t('roleSelection.rememberDescription')}</p>
                    </div>
                    <Switch checked={rememberChoice} onCheckedChange={(v) => { setRememberChoice(v); trackRememberChoiceToggle(v); }} aria-label={t('roleSelection.rememberTitle')} />
                  </div>
                </div>
                {isUnsupportedRole ? (
                  <div className="rounded-2xl border border-warning/25 bg-warning/10 p-4 text-sm leading-6 text-warning">
                    {t('roleSelection.unsupportedRole')}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.icon;
              const isLastUsed = lastChoice === card.choice;
              const isDisabled = !card.href;

              return (
                <Card key={card.choice} variant="action" className="border-border/70 bg-card/95">
                  <CardHeader className="space-y-3 pb-3 sm:space-y-4 sm:pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-12 sm:w-12 sm:rounded-2xl">
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        {card.external ? <Badge variant="outline">{t('roleSelection.externalBadge')}</Badge> : null}
                        {isLastUsed ? (
                          <Badge variant={rememberChoice ? 'default' : 'secondary'}>
                            {rememberChoice ? t('roleSelection.recommendedBadge') : t('roleSelection.lastUsedBadge')}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <CardTitle>{card.title}</CardTitle>
                      <CardDescription className="text-sm leading-6">{card.description}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <Button
                      onClick={() => void handleSelection(card.choice)}
                      size="lg"
                      className="w-full justify-between"
                      variant={card.choice === 'ams' ? 'default' : 'outline'}
                      disabled={isDisabled}
                    >
                      <span>{card.cta}</span>
                      {card.external ? <ExternalLink className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                    </Button>
                    {isDisabled ? (
                      <p className="text-xs leading-5 text-warning">{t('roleSelection.card.amsFallbackNote')}</p>
                    ) : (
                      <p className="flex items-center gap-2 text-xs leading-5 text-muted-foreground">
                        <Star className="h-3.5 w-3.5 text-primary" />
                        {isLastUsed ? t('roleSelection.shortcutHint') : t('roleSelection.tapHint')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
            <span>{t('roleSelection.footer')}</span>
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              {t('roleSelection.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
