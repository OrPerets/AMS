import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { FileX, Search, AlertCircle, Inbox, Plus, Lock, ClipboardList } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./button"

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center space-y-4 py-8",
  {
    variants: {
      size: {
        sm: "py-6 space-y-3",
        md: "py-8 space-y-4", 
        lg: "py-12 space-y-6",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: "default" | "outline"
  }
  type?: "empty" | "search" | "error" | "create" | "action" | "restricted"
}

// Predefined icon components for common states
const EmptyStateIcons = {
  empty: <Inbox className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground/40" />,
  search: <Search className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground/40" />,
  error: <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground/40" />,
  create: <Plus className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground/40" />,
  action: <ClipboardList className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground/40" />,
  restricted: <Lock className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground/40" />,
  default: <FileX className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground/40" />,
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, size, icon, title, description, action, type = "empty", ...props }, ref) => {
    const selectedIcon = icon || EmptyStateIcons[type] || EmptyStateIcons.default

    return (
      <div
        ref={ref}
        className={cn(emptyStateVariants({ size }), className)}
        {...props}
      >
        <div className="flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-muted/30">
          {selectedIcon}
        </div>
        
        <div className="space-y-1.5 sm:space-y-2">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">
            {title}
          </h3>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {action && (
          <Button
            variant={action.variant || "default"}
            onClick={action.onClick}
            className="mt-3 sm:mt-4"
          >
            {action.label}
          </Button>
        )}
      </div>
    )
  }
)
EmptyState.displayName = "EmptyState"

// Specific preset components for common use cases
const EmptyTickets = (props: Omit<EmptyStateProps, 'title' | 'type'>) => (
  <EmptyState
    title="אין קריאות שירות"
    description="לא נמצאו קריאות שירות המתאימות לחיפוש שלך."
    type="empty"
    {...props}
  />
)

const EmptySearchResults = (props: Omit<EmptyStateProps, 'title' | 'type'>) => (
  <EmptyState
    title="לא נמצאו תוצאות"
    description="נסה לשנות את מונחי החיפוש או לנקות את המסננים."
    type="search"
    {...props}
  />
)

const EmptyBuildings = (props: Omit<EmptyStateProps, 'title' | 'type'>) => (
  <EmptyState
    title="אין בניינים במערכת"
    description="הוסף בניין ראשון כדי להתחיל לנהל את הנכסים שלך."
    type="create"
    {...props}
  />
)

const EmptyActionRequired = (props: Omit<EmptyStateProps, 'title' | 'type'>) => (
  <EmptyState
    title="נדרשת פעולה לפני שאפשר להמשיך"
    description="בדוק את ההגדרות או את נתוני החובה במסך זה, ואז נסה שוב."
    type="action"
    {...props}
  />
)

const EmptyRestricted = (props: Omit<EmptyStateProps, 'title' | 'type'>) => (
  <EmptyState
    title="אין לך הרשאה לצפות בתוכן הזה"
    description="אם צריך גישה למסך הזה, פנה למנהל המערכת או לצוות התמיכה."
    type="restricted"
    {...props}
  />
)

export { 
  EmptyState, 
  EmptyTickets, 
  EmptySearchResults, 
  EmptyBuildings,
  EmptyActionRequired,
  EmptyRestricted,
  emptyStateVariants,
  type EmptyStateProps 
}
