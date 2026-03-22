import type { NextPageContext } from 'next';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

import { Button } from '../components/ui/button';

type ErrorPageProps = {
  statusCode?: number;
};

function ErrorPage({ statusCode }: ErrorPageProps) {
  const isServerFailure = (statusCode ?? 500) >= 500;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground sm:px-6">
      <div className="mx-auto w-full max-w-xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground">
          {statusCode ?? 500}
        </p>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
          {isServerFailure ? 'אירעה שגיאת שרת' : 'הבקשה נכשלה'}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          {isServerFailure
            ? 'המערכת נתקלה בתקלה זמנית. אפשר לרענן את העמוד או לחזור לדף הבית.'
            : 'לא ניתן היה להשלים את הפעולה. בדקו את הכתובת או נסו שוב.'}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={() => window.location.reload()} className="touch-manipulation">
            <RefreshCcw className="h-4 w-4" />
            רענון
          </Button>
          <Button asChild variant="outline" className="touch-manipulation">
            <Link href="/home">חזרה לדף הבית</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 500;
  return { statusCode };
};

export default ErrorPage;
