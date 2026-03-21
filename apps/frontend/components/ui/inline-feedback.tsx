import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Button } from "./button";

type InlineErrorPanelProps = {
  title?: string;
  description: string;
  onRetry?: () => void | Promise<void>;
  supportHref?: string;
  className?: string;
};

export function InlineErrorPanel({
  title = "אירעה שגיאה בטעינת התוכן",
  description,
  onRetry,
  supportHref = "/support",
  className,
}: InlineErrorPanelProps) {
  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-3 flex flex-col gap-3 text-destructive/90 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p>{description}</p>
          <p className="text-xs text-destructive/80">
            אם הבעיה ממשיכה, אפשר לנסות שוב או לפנות לתמיכה עם צילום מסך וזמן האירוע.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onRetry ? (
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RotateCcw className="me-2 h-4 w-4" />
              נסה שוב
            </Button>
          ) : null}
          <Button asChild size="sm" variant="outline">
            <Link href={supportHref}>פנה לתמיכה</Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
