import Link from 'next/link';
import { useRouter } from 'next/router';
import { AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react';

import { Button } from '../components/ui/button';

export default function NotFoundPage() {
  const router = useRouter();
  const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/home');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground sm:px-6">
      <div className="mx-auto w-full max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground">404</p>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">העמוד לא נמצא</h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          ייתכן שהקישור שגוי או שהעמוד הוסר. אפשר לחזור ללוח הראשי או למסך ההתחברות.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={handleBack} className="touch-manipulation">
            <BackArrow className="h-4 w-4" />
            חזרה לאפליקציה
          </Button>
          <Button asChild variant="outline" className="touch-manipulation">
            <Link href="/login">מסך התחברות</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
