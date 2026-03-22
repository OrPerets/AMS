import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex min-h-6 items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.01em] transition-[background-color,border-color,color,box-shadow] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-primary/15 bg-primary/12 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]",
        secondary: "border-subtle-border bg-muted/80 text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
        destructive: "border-destructive/20 bg-destructive/10 text-destructive",
        outline: "border-subtle-border bg-background/82 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
        success: "border-success/18 bg-success/10 text-success",
        warning: "border-warning/20 bg-warning/12 text-warning",
        info: "border-info/20 bg-info/10 text-info",
        gold: "border-primary/22 bg-[linear-gradient(180deg,hsl(var(--primary))/0.14_0%,hsl(var(--primary))/0.08_100%)] text-primary",
        status: "border-subtle-border bg-muted-surface/88 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
        severity: "border-warning/22 bg-warning/10 text-warning",
        finance: "border-primary/18 bg-[linear-gradient(180deg,hsl(var(--surface-emphasis))/0.72_0%,transparent_100%)] text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
