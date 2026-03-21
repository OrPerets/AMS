import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { CalendarClock, Clock3, Plus, Vote as VoteIcon } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { formatDate, getVoteTypeLabel } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { EmptyState } from '../../components/ui/empty-state';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { MobileCardSkeleton } from '../../components/ui/page-states';
import { PageHero } from '../../components/ui/page-hero';
import { SectionHeader } from '../../components/ui/section-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { StatusBadge } from '../../components/ui/status-badge';

interface Vote {
  id: number;
  title: string;
  question: string;
  endDate: string;
  isActive: boolean;
  isClosed: boolean;
  userHasVoted: boolean;
  responseCount: number;
  voteType: string;
  buildingId: number;
}

interface BuildingOption {
  id: number;
  name: string;
}

type VoteSection = {
  key: string;
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDescription: string;
  votes: Vote[];
};

export default function VotesPage() {
  const router = useRouter();
  const [votes, setVotes] = useState<Vote[]>([]);
  const [buildingOptions, setBuildingOptions] = useState<BuildingOption[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [contextLoading, setContextLoading] = useState(true);
  const [votesLoading, setVotesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadBuildingContext();
  }, []);

  useEffect(() => {
    if (!selectedBuildingId) {
      return;
    }
    void loadVotes(selectedBuildingId);
  }, [selectedBuildingId]);

  async function loadBuildingContext() {
    setContextLoading(true);
    setError(null);

    try {
      const profileResponse = await authFetch('/api/v1/users/profile');
      if (!profileResponse.ok) {
        throw new Error(await profileResponse.text());
      }

      const profile = await profileResponse.json();
      const residentBuildings = Array.isArray(profile?.resident?.units)
        ? profile.resident.units
            .map((unit: any) => unit.building)
            .filter(Boolean)
            .reduce<BuildingOption[]>((acc, building) => {
              if (acc.some((item) => item.id === building.id)) {
                return acc;
              }
              acc.push({ id: building.id, name: building.name });
              return acc;
            }, [])
        : [];

      let accessibleBuildings = residentBuildings;

      if (accessibleBuildings.length === 0) {
        const buildingsResponse = await authFetch('/api/v1/buildings');
        if (!buildingsResponse.ok) {
          throw new Error(await buildingsResponse.text());
        }

        const buildings = await buildingsResponse.json();
        accessibleBuildings = Array.isArray(buildings)
          ? buildings.map((building: any) => ({ id: building.id, name: building.name }))
          : [];
      }

      setBuildingOptions(accessibleBuildings);
      setSelectedBuildingId((current) => current || (accessibleBuildings[0] ? String(accessibleBuildings[0].id) : ''));
    } catch {
      setBuildingOptions([]);
      setSelectedBuildingId('');
      setError('לא ניתן לטעון את הקשר הבנייני להצבעות כרגע.');
    } finally {
      setContextLoading(false);
    }
  }

  async function loadVotes(buildingId: string) {
    setVotesLoading(true);
    setError(null);

    try {
      const res = await authFetch('/api/v1/votes/building/' + buildingId);
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const payload = await res.json();
      setVotes(Array.isArray(payload) ? payload : []);
    } catch {
      setVotes([]);
      setError('לא ניתן לטעון כרגע את רשימת ההצבעות. נסה שוב בעוד רגע.');
    } finally {
      setVotesLoading(false);
    }
  }

  function getVoteStatus(vote: Vote) {
    const endDate = new Date(vote.endDate).getTime();

    if (vote.isClosed || endDate < Date.now()) {
      return { label: 'נסגרה', tone: 'neutral' as const };
    }
    if (vote.userHasVoted) {
      return { label: 'הצבעת', tone: 'success' as const };
    }
    if (vote.isActive) {
      return { label: 'פתוחה להצבעה', tone: 'active' as const };
    }
    return { label: 'בקרוב', tone: 'warning' as const };
  }

  const voteSections = useMemo<VoteSection[]>(() => {
    const active = votes.filter((vote) => vote.isActive && !vote.isClosed && new Date(vote.endDate).getTime() >= Date.now());
    const upcoming = votes.filter((vote) => !vote.isActive && !vote.isClosed && new Date(vote.endDate).getTime() >= Date.now());
    const closed = votes.filter((vote) => vote.isClosed || new Date(vote.endDate).getTime() < Date.now());

    return [
      {
        key: 'active',
        title: 'פתוחות להצבעה',
        subtitle: 'החלטות שדורשות תגובה עכשיו, עם סטטוס השתתפות ברור.',
        emptyTitle: 'אין הצבעות פתוחות כרגע',
        emptyDescription: 'כאשר תיפתח הצבעה חדשה לבניין הנבחר, היא תופיע כאן עם קריאה ברורה לפעולה.',
        votes: active,
      },
      {
        key: 'upcoming',
        title: 'בדרך לפרסום',
        subtitle: 'סבבים שנוצרו אבל עדיין לא נפתחו בפועל.',
        emptyTitle: 'אין הצבעות מתוזמנות',
        emptyDescription: 'אין כרגע סבבים עתידיים לבניין הנבחר.',
        votes: upcoming,
      },
      {
        key: 'closed',
        title: 'היסטוריית הצבעות',
        subtitle: 'החלטות שנסגרו או פגו, כדי לשמור על הקשר מלא של פעילות הבניין.',
        emptyTitle: 'אין היסטוריית הצבעות',
        emptyDescription: 'כאן יוצגו הצבעות סגורות לאחר השלמת הסבב.',
        votes: closed,
      },
    ];
  }, [votes]);

  const selectedBuilding = buildingOptions.find((building) => String(building.id) === selectedBuildingId);

  return (
    <div className="space-y-8">
      <PageHero
        kicker="Sprint 3 page quality pass"
        eyebrow={<StatusBadge label="Resident Governance" tone="finance" />}
        title="הצבעות בניין"
        description="המסך אוחד לשפה המשותפת: בחירת בניין אמיתית, חלוקה בין סבבים פעילים/עתידיים/סגורים, ומשובי כשלון ברורים במקום לוגיקה קשיחה."
        actions={
          <Button onClick={() => router.push('/votes/create')} variant="hero">
            <Plus className="me-2 h-4 w-4" />
            הצבעה חדשה
          </Button>
        }
        aside={
          <div className="grid gap-3 sm:grid-cols-2 text-white">
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/55">בניין נבחר</div>
              <div className="mt-2 text-xl font-black">{selectedBuilding?.name ?? 'לא נבחר'}</div>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/55">סה"כ סבבים</div>
              <div className="mt-2 text-2xl font-black">{votes.length}</div>
            </div>
          </div>
        }
      />

      <Card variant="elevated">
        <CardContent className="space-y-6 p-6">
          <SectionHeader
            title="בחירת בניין ותצוגה"
            subtitle="אין יותר הנחת ברירת מחדל קשיחה לבניין 1. המסך נטען לפי הבניינים שנגישים למשתמש."
            meta={selectedBuilding ? `בניין ${selectedBuilding.id}` : 'ללא בחירה'}
          />

          {contextLoading ? (
            <MobileCardSkeleton cards={1} />
          ) : buildingOptions.length > 0 ? (
            <div className="max-w-md space-y-2">
              <div className="text-sm font-medium text-muted-foreground">בניין</div>
              <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר בניין" />
                </SelectTrigger>
                <SelectContent>
                  {buildingOptions.map((building) => (
                    <SelectItem key={building.id} value={String(building.id)}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <EmptyState
              type="restricted"
              title="לא נמצאו בניינים זמינים להצבעות"
              description="כדי להציג הצבעות צריך שיוגדרו בניינים נגישים למשתמש או שיוטען בניין פעיל במערכת."
              action={{ label: 'טען מחדש', onClick: () => void loadBuildingContext(), variant: 'outline' }}
            />
          )}
        </CardContent>
      </Card>

      {error ? (
        <InlineErrorPanel
          title="רשימת ההצבעות לא נטענה"
          description={error}
          onRetry={() => (selectedBuildingId ? loadVotes(selectedBuildingId) : loadBuildingContext())}
        />
      ) : null}

      {votesLoading ? (
        <MobileCardSkeleton cards={3} />
      ) : buildingOptions.length === 0 && !contextLoading ? null : (
        voteSections.map((section) => (
          <section key={section.key} className="space-y-4">
            <SectionHeader title={section.title} subtitle={section.subtitle} meta={`${section.votes.length} סבבים`} />

            {section.votes.length === 0 ? (
              <Card variant="elevated">
                <CardContent className="py-12">
                  <EmptyState
                    icon={section.key === 'upcoming' ? <CalendarClock className="h-12 w-12 text-muted-foreground/40" /> : <VoteIcon className="h-12 w-12 text-muted-foreground/40" />}
                    title={section.emptyTitle}
                    description={section.emptyDescription}
                    type={section.key === 'closed' ? 'empty' : 'action'}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {section.votes.map((vote) => {
                  const status = getVoteStatus(vote);

                  return (
                    <Card
                      key={vote.id}
                      variant="action"
                      className="cursor-pointer"
                      onClick={() => router.push('/votes/' + vote.id)}
                    >
                      <CardHeader className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-tertiary">
                              {getVoteTypeLabel(vote.voteType)}
                            </div>
                            <CardTitle className="text-xl">{vote.title}</CardTitle>
                          </div>
                          <StatusBadge label={status.label} tone={status.tone} />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{vote.question}</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-[20px] border border-subtle-border bg-muted/60 p-4">
                            <div className="text-xs uppercase tracking-[0.2em] text-tertiary">מועד סיום</div>
                            <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                              <Clock3 className="h-4 w-4 text-primary" />
                              {formatDate(vote.endDate)}
                            </div>
                          </div>
                          <div className="rounded-[20px] border border-subtle-border bg-muted/60 p-4">
                            <div className="text-xs uppercase tracking-[0.2em] text-tertiary">משתתפים</div>
                            <div className="mt-2 text-2xl font-black text-foreground">{vote.responseCount}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        ))
      )}
    </div>
  );
}
