import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, ClipboardList, FileX, Inbox, Lock, Plus, Search } from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "./button";

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center rounded-[28px] border border-subtle-border/80 px-5 py-8 text-center shadow-card",
  {
    variants: {
      size: {
        sm: "gap-3 py-6",
        md: "gap-4 py-8",
        lg: "gap-5 py-12",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline";
  };
  type?: "empty" | "search" | "error" | "create" | "action" | "restricted";
}

const EmptyStateIcons = {
  empty: <Inbox className="h-7 w-7 text-primary sm:h-9 sm:w-9" />,
  search: <Search className="h-7 w-7 text-primary sm:h-9 sm:w-9" />,
  error: <AlertCircle className="h-7 w-7 text-destructive sm:h-9 sm:w-9" />,
  create: <Plus className="h-7 w-7 text-primary sm:h-9 sm:w-9" />,
  action: <ClipboardList className="h-7 w-7 text-warning sm:h-9 sm:w-9" />,
  restricted: <Lock className="h-7 w-7 text-muted-foreground sm:h-9 sm:w-9" />,
  default: <FileX className="h-7 w-7 text-muted-foreground sm:h-9 sm:w-9" />,
};

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, size, icon, title, description, action, type = "empty", ...props }, ref) => {
    const selectedIcon = icon || EmptyStateIcons[type] || EmptyStateIcons.default;

    return (
      <div
        ref={ref}
        className={cn(
          emptyStateVariants({ size }),
          "surface-list-row bg-[linear-gradient(180deg,hsl(var(--surface-emphasis))/0.44_0%,transparent_100%)]",
          className,
        )}
        {...props}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-[24px] border border-primary/12 bg-background/88 shadow-card">
          {selectedIcon}
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-semibold text-foreground sm:text-lg">{title}</h3>
          {description ? (
            <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
          ) : null}
        </div>

        {action ? (
          <Button variant={action.variant || "default"} onClick={action.onClick} className="mt-1">
            {action.label}
          </Button>
        ) : null}
      </div>
    );
  },
);
EmptyState.displayName = "EmptyState";

const EmptyTickets = (props: Omit<EmptyStateProps, "title" | "type">) => (
  <EmptyState
    title="אין קריאות שירות"
    description="לא נמצאו קריאות שירות שמתאימות למסננים שנבחרו."
    type="empty"
    {...props}
  />
);

const EmptySearchResults = (props: Omit<EmptyStateProps, "title" | "type">) => (
  <EmptyState
    title="לא נמצאו תוצאות"
    description="כדאי לשנות את מונחי החיפוש או לנקות מסנן אחד או יותר."
    type="search"
    {...props}
  />
);

const EmptyBuildings = (props: Omit<EmptyStateProps, "title" | "type">) => (
  <EmptyState
    title="אין בניינים במערכת"
    description="הוספת בניין ראשון תפתח את מסלולי הניהול, הקודים והיחידות."
    type="create"
    {...props}
  />
);

const EmptyActionRequired = (props: Omit<EmptyStateProps, "title" | "type">) => (
  <EmptyState
    title="נדרשת פעולה לפני שאפשר להמשיך"
    description="בדוק את שדות החובה או את ההגדרות במסך הזה ואז נסה שוב."
    type="action"
    {...props}
  />
);

const EmptyRestricted = (props: Omit<EmptyStateProps, "title" | "type">) => (
  <EmptyState
    title="אין לך הרשאה לצפות בתוכן הזה"
    description="אם צריך גישה למסך הזה, פנה למנהל המערכת או לצוות התמיכה."
    type="restricted"
    {...props}
  />
);

const EmptyNotifications = (props: Omit<EmptyStateProps, "title" | "type">) => (
  <EmptyState
    title="אין התראות חדשות"
    description="כשיתקבל עדכון, קריאת שירות או תזכורת — נראה אותם כאן מיד."
    type="empty"
    {...props}
  />
);

const EmptyPayments = (props: Omit<EmptyStateProps, "title" | "type">) => (
  <EmptyState
    title="אין חשבוניות לתשלום"
    description="כל החיובים שולמו. חשבוניות חדשות יופיעו כאן כשיווצרו."
    type="empty"
    {...props}
  />
);

const EmptyDocuments = (props: Omit<EmptyStateProps, "title" | "type">) => (
  <EmptyState
    title="אין מסמכים חדשים"
    description="מסמכי ועד, פרוטוקולים וקבצים אחרים יופיעו כאן כשצוות הניהול יעלה אותם."
    type="empty"
    {...props}
  />
);

const EmptyRequests = (props: Omit<EmptyStateProps, "title" | "type">) => (
  <EmptyState
    title="לא הוגשו בקשות עדיין"
    description="אפשר להגיש בקשת מעבר, חניה, מסמך או עדכון קשר בכל עת."
    type="create"
    {...props}
  />
);

const EmptyGardenMonths = (props: Omit<EmptyStateProps, "title" | "type">) => (
  <EmptyState
    title="עדיין לא נוצר חודש גינון"
    description="ברגע שייווצר חודש ראשון, העובדים יראו אותו במסך האישי שלהם ויוכלו להגיש תוכנית לאישור."
    type="create"
    {...props}
  />
);

const EmptyMaintenanceQueue = (props: Omit<EmptyStateProps, "title" | "type">) => (
  <EmptyState
    title="אין משימות תחזוקה ממתינות"
    description="ברגע שתפתח משימה חדשה או שתוקצה אליך עבודת שטח, היא תופיע כאן."
    type="empty"
    {...props}
  />
);

export {
  EmptyActionRequired,
  EmptyBuildings,
  EmptyDocuments,
  EmptyGardenMonths,
  EmptyMaintenanceQueue,
  EmptyNotifications,
  EmptyPayments,
  EmptyRequests,
  EmptyRestricted,
  EmptySearchResults,
  EmptyState,
  EmptyTickets,
  emptyStateVariants,
  type EmptyStateProps,
};
