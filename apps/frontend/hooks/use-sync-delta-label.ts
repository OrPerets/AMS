import { useEffect, useMemo, useState } from 'react';

type SyncDeltaOptions = {
  idleLabel?: string;
};

export function formatSyncDeltaLabel(lastSyncedAt: number | null, options: SyncDeltaOptions = {}) {
  if (!lastSyncedAt) {
    return options.idleLabel ?? 'ממתין לסנכרון ראשון';
  }

  const elapsedMs = Math.max(0, Date.now() - lastSyncedAt);
  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  if (elapsedSeconds < 1) return 'עודכן עכשיו';
  if (elapsedSeconds < 60) return `עודכן לפני ${elapsedSeconds} שניות`;

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `עודכן לפני ${elapsedMinutes} דקות`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `עודכן לפני ${elapsedHours} שעות`;

  return 'עודכן לפני יותר מיום';
}

export function useSyncDeltaLabel(lastSyncedAt: number | null, options: SyncDeltaOptions = {}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!lastSyncedAt) return;
    const interval = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [lastSyncedAt]);

  return useMemo(() => formatSyncDeltaLabel(lastSyncedAt, options), [lastSyncedAt, options.idleLabel, tick]);
}
