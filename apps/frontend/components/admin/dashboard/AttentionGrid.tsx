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
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-foreground">דורש תשומת לב עכשיו</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          הכרטיסים מציגים מוקדי פעולה מיידיים. הם לא ציון בריאות כללי, אלא תור החלטות שנועד לקצר חיפוש והקלקות.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {data.attentionItems.map((item) => {
          const ToneIcon = attentionToneIcons[item.tone];
          return (
            <Card
              key={item.id}
              className={`group rounded-[24px] border ${attentionToneClasses[item.tone]} transition-transform hover:-translate-y-0.5 ${item.tone === 'danger' ? 'ring-1 ring-rose-300/50' : ''}`}
            >
              <CardHeader className="space-y-3 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <ToneIcon className={`h-5 w-5 ${item.tone === 'danger' ? 'text-rose-600' : item.tone === 'warning' ? 'text-amber-600' : 'text-muted-foreground'}`} />
                </div>
                <div className="text-3xl font-black">{item.value}</div>
                <CardDescription className="text-current/70">{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild size="sm" variant="outline" className="w-full border-current/20 bg-background/70 transition-colors hover:bg-background">
                  <Link href={item.ctaHref}>
                    {item.ctaLabel}
                    <ArrowUpRight className="ms-2 h-4 w-4" />
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
