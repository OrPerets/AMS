import Link from 'next/link';
import { AlertTriangle, ArrowUpRight, CircleAlert, Info } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { DashboardResponse } from './types';

const attentionToneClasses = {
  danger: 'border-rose-200 bg-rose-50/90 text-rose-950',
  warning: 'border-amber-200 bg-amber-50/90 text-amber-950',
  calm: 'border-subtle-border bg-card text-foreground',
};

const attentionToneIcons = {
  danger: AlertTriangle,
  warning: CircleAlert,
  calm: Info,
};

export function AttentionGrid({ data }: { data: DashboardResponse }) {
  return (
    <section className="space-y-3 sm:space-y-4">
      <div>
        <h2 className="text-lg sm:text-xl font-black tracking-tight text-foreground">דורש תשומת לב</h2>
        <p className="mt-0.5 hidden sm:block text-sm text-muted-foreground">
          מוקדי פעולה מיידיים שנועדו לקצר חיפוש והקלקות.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
        {data.attentionItems.map((item) => {
          const ToneIcon = attentionToneIcons[item.tone];
          return (
            <Card
              key={item.id}
              className={`group rounded-xl sm:rounded-[22px] border ${attentionToneClasses[item.tone]} transition-transform hover:-translate-y-0.5 ${item.tone === 'danger' ? 'ring-1 ring-rose-300/50' : ''}`}
            >
              <CardHeader className="space-y-1.5 sm:space-y-3 pb-1.5 sm:pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm sm:text-base">{item.title}</CardTitle>
                  <ToneIcon className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 ${item.tone === 'danger' ? 'text-rose-600' : item.tone === 'warning' ? 'text-amber-600' : 'text-muted-foreground'}`} />
                </div>
                <div className="text-xl sm:text-2xl font-black">{item.value}</div>
                <CardDescription className="text-current/70 hidden sm:block">{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild size="sm" variant="outline" className="w-full border-current/20 bg-background/70 text-xs sm:text-sm transition-colors hover:bg-background">
                  <Link href={item.ctaHref}>
                    {item.ctaLabel}
                    <ArrowUpRight className="ms-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
