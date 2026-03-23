import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const cardVariants = cva(
  "rounded-2xl md:rounded-[24px] border text-card-foreground transition-[transform,box-shadow,border-color,background] duration-300 ease-[var(--ease-enter)] overflow-wrap-anywhere",
  {
    variants: {
      variant: {
        default: "surface-card bg-card",
        elevated: "surface-elevated bg-elevated-surface",
        metric: "surface-card bg-card/95 hover:-translate-y-0.5",
        action: "surface-action bg-card hover:-translate-y-1 hover:border-primary/30 hover:shadow-raised",
        warning: "surface-critical bg-card text-card-foreground",
        featured: "surface-elevated bg-elevated-surface",
        listRow: "surface-muted bg-muted-surface/95 rounded-2xl md:rounded-[24px]",
        muted: "surface-muted bg-muted-surface/92",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, onClick, onKeyDown, role, tabIndex, ...props }, ref) => {
    const isInteractive = typeof onClick === "function";

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant }),
          isInteractive &&
            "cursor-pointer active:scale-[0.995] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className,
        )}
        role={role ?? (isInteractive ? "button" : undefined)}
        tabIndex={tabIndex ?? (isInteractive ? 0 : undefined)}
        data-interactive-card={isInteractive ? "true" : undefined}
        onClick={onClick}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || !isInteractive) {
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick?.(event as unknown as React.MouseEvent<HTMLDivElement>);
          }
        }}
        {...props}
      />
    );
  },
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-3 sm:space-y-2 sm:p-4 lg:p-5", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-[15px] font-semibold leading-tight tracking-tight text-foreground sm:text-lg", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-[13px] leading-6 text-secondary-foreground sm:text-sm", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-3 pt-0 sm:p-4 sm:pt-0 lg:p-5 lg:pt-0", className)} {...props} />
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-3 pt-0 sm:p-4 sm:pt-0 lg:p-5 lg:pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, cardVariants };
