import { AmsFilterTabs } from '../../ui/ams-filter-tabs';
import type { QueueKey } from './types';
import { queueLabels } from './presentation';

export function DispatchQueueTabs({
  queue,
  queueCounts,
  onQueueChange,
}: {
  queue: QueueKey;
  queueCounts: Record<QueueKey, number>;
  onQueueChange: (queue: QueueKey) => void;
}) {
  return (
    <section className="rounded-[24px] border border-subtle-border bg-background/92 p-3 shadow-elevation-1 sm:rounded-[28px]">
      <AmsFilterTabs
        ariaLabel="בחירת תור קריאות"
        selectedKey={queue}
        onSelectionChange={(value) => onQueueChange(value as QueueKey)}
        items={(Object.keys(queueLabels) as QueueKey[]).map((key) => ({
          key,
          label: queueLabels[key],
          badge: queueCounts[key] ?? 0,
        }))}
      />
    </section>
  );
}
