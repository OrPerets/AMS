import type { QueueKey } from './types';
import { queueLabels, queueTones } from './presentation';

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
    <section className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.3)] sm:rounded-[28px]">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {(Object.keys(queueLabels) as QueueKey[]).map((key) => {
          const count = queueCounts[key] ?? 0;
          const isActive = queue === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onQueueChange(key)}
              className={`inline-flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                isActive ? `${queueTones[key]} shadow-lg` : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {queueLabels[key]}
              <span
                className={`inline-flex min-w-[24px] items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : count > 0 && (key === 'SLA_RISK' || key === 'UNASSIGNED')
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-slate-200 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
