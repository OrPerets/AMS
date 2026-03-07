import Link from 'next/link';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

import { Button } from '../components/ui/button';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground">404</p>
        <h1 className="mt-3 text-3xl font-bold">העמוד לא נמצא</h1>
        <p className="mt-3 text-muted-foreground">
          ייתכן שהקישור שגוי או שהעמוד הוסר. אפשר לחזור ללוח הראשי או למסך ההתחברות.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/home">
              <ArrowLeft className="h-4 w-4" />
              חזרה לאפליקציה
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">מסך התחברות</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
