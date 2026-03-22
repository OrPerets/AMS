import { Card, CardContent } from './card';
import { Skeleton } from './skeleton';

type TableListSkeletonProps = {
  rows?: number;
  columns?: number;
};

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-52 rounded-[30px]" variant="shimmer" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-[26px]" variant="shimmer" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Skeleton className="h-[360px] rounded-[30px]" variant="shimmer" />
        <Skeleton className="h-[360px] rounded-[30px]" variant="shimmer" />
      </div>
    </div>
  );
}

export function TableListSkeleton({ rows = 5, columns = 4 }: TableListSkeletonProps) {
  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardContent className="space-y-4 p-4 sm:p-6">
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-11 rounded-[20px]" variant="shimmer" />
          <Skeleton className="h-11 rounded-[20px]" variant="shimmer" />
          <Skeleton className="h-11 rounded-[20px]" variant="shimmer" />
        </div>
        <div className="overflow-hidden rounded-[24px] border border-subtle-border bg-card/80">
          <div
            className="grid gap-4 border-b border-subtle-border bg-muted/35 px-4 py-4"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, index) => (
              <Skeleton key={`head-${index}`} className="h-4 rounded-full" variant="shimmer" />
            ))}
          </div>
          <div className="space-y-0">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <div
                key={`row-${rowIndex}`}
                className="grid gap-4 border-b border-subtle-border/70 px-4 py-4 last:border-b-0"
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <Skeleton
                    key={`cell-${rowIndex}-${colIndex}`}
                    className={colIndex === 0 ? 'h-4 w-4/5 rounded-full' : 'h-4 w-3/5 rounded-full'}
                    variant="shimmer"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DetailPanelSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-36 rounded-[28px]" variant="shimmer" />
      <Card variant="elevated">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="space-y-3">
            <Skeleton className="h-7 w-2/5 rounded-full" variant="shimmer" />
            <Skeleton className="h-4 w-3/4 rounded-full" variant="shimmer" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-28 rounded-[22px]" variant="shimmer" />
            <Skeleton className="h-28 rounded-[22px]" variant="shimmer" />
          </div>
          <Skeleton className="h-44 rounded-[24px]" variant="shimmer" />
        </CardContent>
      </Card>
    </div>
  );
}

export function MobileCardSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-40 rounded-[28px]" variant="shimmer" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cards }).map((_, index) => (
          <Card key={index} variant="elevated" className="overflow-hidden">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" variant="shimmer" />
                    <Skeleton className="h-6 w-20 rounded-full" variant="shimmer" />
                  </div>
                  <Skeleton className="h-5 w-40 rounded-full" variant="shimmer" />
                </div>
                <Skeleton className="h-11 w-11 rounded-[18px]" variant="shimmer" />
              </div>
              <Skeleton className="h-4 w-full rounded-full" variant="shimmer" />
              <Skeleton className="h-4 w-5/6 rounded-full" variant="shimmer" />
              <div className="rounded-[22px] border border-subtle-border/70 bg-muted/24 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-4 w-20 rounded-full" variant="shimmer" />
                  <Skeleton className="h-4 w-24 rounded-full justify-self-end" variant="shimmer" />
                  <Skeleton className="h-4 w-16 rounded-full" variant="shimmer" />
                  <Skeleton className="h-4 w-12 rounded-full justify-self-end" variant="shimmer" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-11 rounded-full" variant="shimmer" />
                <Skeleton className="h-11 rounded-full" variant="shimmer" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
