import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const inputVariants = cva(
  "flex w-full touch-manipulation rounded-xl sm:rounded-2xl border border-input bg-background text-sm ring-offset-background transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      inputSize: {
        sm: "h-9 px-3 py-2 text-xs",
        default: "h-10 px-3.5 py-2 sm:h-11 sm:px-4 sm:py-2.5",
        lg: "h-11 px-4 py-2.5 sm:h-12 sm:py-3",
      },
      state: {
        default: "",
        error: "border-destructive focus-visible:ring-destructive",
        success: "border-success focus-visible:ring-success",
      },
    },
    defaultVariants: {
      inputSize: "default",
      state: "default",
    },
  }
);

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, VariantProps<typeof inputVariants> {
  error?: boolean;
  loading?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, loading, inputSize, state, startIcon, endIcon, ...props }, ref) => {
    const inputState = error ? "error" : state;

    if (startIcon || endIcon || loading) {
      return (
        <div className="relative">
          {startIcon ? <div className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-muted-foreground">{startIcon}</div> : null}
          <input
            type={type}
            className={cn(
              inputVariants({ inputSize, state: inputState }),
              startIcon ? "ps-11" : "",
              endIcon || loading ? "pe-11" : "",
              className
            )}
            ref={ref}
            disabled={loading || props.disabled}
            aria-invalid={inputState === "error" || undefined}
            data-touch-target="true"
            {...props}
          />
          {loading ? (
            <div className="pointer-events-none absolute inset-y-0 end-4 flex items-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : null}
          {endIcon ? (loading ? null : <div className="pointer-events-none absolute inset-y-0 end-4 flex items-center text-muted-foreground">{endIcon}</div>) : null}
        </div>
      );
    }

    return <input type={type} className={cn(inputVariants({ inputSize, state: inputState }), className)} ref={ref} disabled={loading || props.disabled} aria-invalid={inputState === "error" || undefined} data-touch-target="true" {...props} />;
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
