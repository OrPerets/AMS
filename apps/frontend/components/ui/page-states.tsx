import { Card, CardContent } from "./card";
import { Skeleton } from "./skeleton";

type TableListSkeletonProps = {
  rows?: number;
  columns?: number;
};

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64 rounded-[28px]" variant="shimmer" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-3xl" variant="shimmer" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Skeleton className="h-[440px] rounded-3xl" variant="shimmer" />
        <Skeleton className="h-[440px] rounded-3xl" variant="shimmer" />
      </div>
    </div>
  );
}

export function TableListSkeleton({ rows = 5, columns = 4 }: TableListSkeletonProps) {
  return (
    <Card variant="elevated">
      <CardContent className="space-y-4 p-6">
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-12 rounded-2xl" variant="shimmer" />
          <Skeleton className="h-12 rounded-2xl" variant="shimmer" />
          <Skeleton className="h-12 rounded-2xl" variant="shimmer" />
        </div>
        <div className="overflow-hidden rounded-[24px] border border-subtle-border">
          <div
            className="grid gap-4 border-b border-subtle-border bg-muted/50 px-4 py-4"
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
                    className={colIndex === 0 ? "h-4 w-4/5 rounded-full" : "h-4 w-3/5 rounded-full"}
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
    <Card variant="elevated">
      <CardContent className="space-y-5 p-6">
        <div className="space-y-3">
          <Skeleton className="h-7 w-2/5 rounded-full" variant="shimmer" />
          <Skeleton className="h-4 w-3/4 rounded-full" variant="shimmer" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-28 rounded-[22px]" variant="shimmer" />
          <Skeleton className="h-28 rounded-[22px]" variant="shimmer" />
        </div>
        <Skeleton className="h-40 rounded-[22px]" variant="shimmer" />
      </CardContent>
    </Card>
  );
}

export function MobileCardSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="space-y-4 md:grid md:gap-4 md:space-y-0 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: cards }).map((_, index) => (
        <Card key={index} variant="elevated">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" variant="shimmer" />
                  <Skeleton className="h-6 w-20 rounded-full" variant="shimmer" />
                </div>
                <Skeleton className="h-5 w-40 rounded-full" variant="shimmer" />
              </div>
              <Skeleton className="h-10 w-10 rounded-2xl" variant="shimmer" />
            </div>
            <Skeleton className="h-4 w-full rounded-full" variant="shimmer" />
            <Skeleton className="h-4 w-5/6 rounded-full" variant="shimmer" />
            <div className="rounded-[20px] border border-subtle-border/70 bg-muted/30 p-4">
              <div className="grid gap-3 grid-cols-2">
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
  );
}
