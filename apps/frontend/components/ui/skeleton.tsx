import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const skeletonVariants = cva(
  "animate-pulse rounded-md bg-muted",
  {
    variants: {
      variant: {
        default: "bg-muted",
        shimmer: "bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite]",
        pulse: "bg-muted animate-pulse",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

function Skeleton({ className, variant, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
    />
  )
}

// Preset skeleton components for common patterns
const SkeletonText = ({ lines = 3, className }: { lines?: number; className?: string }) => (
  <div className={cn("space-y-2", className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn(
          "h-4",
          i === lines - 1 ? "w-3/4" : "w-full" // Last line is shorter
        )}
        variant="shimmer"
      />
    ))}
  </div>
)

const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn("space-y-3 p-4", className)}>
    <div className="space-y-2">
      <Skeleton className="h-6 w-3/4" variant="shimmer" />
      <Skeleton className="h-4 w-1/2" variant="shimmer" />
    </div>
    <SkeletonText lines={2} />
  </div>
)

const SkeletonTable = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <div className="space-y-3">
    {/* Header */}
    <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={`header-${i}`} className="h-5" variant="shimmer" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="grid grid-cols-4 gap-4 p-4 border-b">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton
            key={`cell-${rowIndex}-${colIndex}`}
            className={cn("h-4", colIndex === 0 ? "w-full" : "w-3/4")}
          />
        ))}
      </div>
    ))}
  </div>
)

const SkeletonAvatar = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10", 
    lg: "h-12 w-12"
  }
  
  return (
    <Skeleton 
      className={cn("rounded-full", sizeClasses[size])} 
      variant="shimmer" 
    />
  )
}

export { 
  Skeleton, 
  SkeletonText, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonAvatar,
  skeletonVariants
}
