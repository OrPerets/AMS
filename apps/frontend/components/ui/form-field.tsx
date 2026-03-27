import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, HelpCircle } from "lucide-react"

import { cn } from "../../lib/utils"
import { Label } from "./label"

const fieldVariants = cva(
  "space-y-2",
  {
    variants: {
      state: {
        default: "",
        error: "",
        success: "",
      },
    },
    defaultVariants: {
      state: "default",
    },
  }
)

interface FormFieldProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof fieldVariants> {
  label?: string
  description?: string
  error?: string
  required?: boolean
  fieldKey?: string
  inputId?: string
  children: React.ReactNode
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, state, label, description, error, required, fieldKey, inputId, children, ...props }, ref) => {
    const generatedId = React.useId()
    const child = children as React.ReactElement<any>
    const childId = child.props.id as string | undefined
    const fieldId = inputId ?? childId ?? fieldKey ?? generatedId
    const descriptionId = React.useId() 
    const errorId = React.useId()

    return (
      <div
        ref={ref}
        className={cn(fieldVariants({ state: error ? "error" : state }), className)}
        {...props}
      >
        {label && (
          <Label 
            htmlFor={fieldId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
            {required && (
              <span className="text-destructive ms-1" aria-label="שדה חובה">*</span>
            )}
          </Label>
        )}
        
        <div className="relative">
          {React.cloneElement(child, {
            id: fieldId,
            'aria-describedby': cn(
              description ? descriptionId : undefined,
              error ? errorId : undefined
            ),
            'aria-invalid': error ? 'true' : undefined,
            className: cn(
              child.props.className,
              error && "border-destructive focus-visible:ring-destructive"
            ),
          })}
          
          {error && (
            <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none">
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
          )}
        </div>

        {description && (
          <FormDescription id={descriptionId}>
            {description}
          </FormDescription>
        )}

        {error && (
          <FormError id={errorId}>
            {error}
          </FormError>
        )}
      </div>
    )
  }
)
FormField.displayName = "FormField"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm text-muted-foreground flex items-center gap-1",
      className
    )}
    {...props}
  >
    <HelpCircle className="h-3.5 w-3.5" />
    {props.children}
  </p>
))
FormDescription.displayName = "FormDescription"

const FormError = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm font-medium text-destructive flex items-center gap-1",
      className
    )}
    role="alert"
    {...props}
  >
    <AlertCircle className="h-3.5 w-3.5" />
    {props.children}
  </p>
))
FormError.displayName = "FormError"

const FormLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement> & {
    required?: boolean
  }
>(({ className, required, children, ...props }, ref) => (
  <Label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  >
    {children}
    {required && (
      <span className="text-destructive ms-1" aria-label="שדה חובה">*</span>
    )}
  </Label>
))
FormLabel.displayName = "FormLabel"

interface FormErrorSummaryProps {
  errors: Array<{ field: string; message: string }>;
  fieldLabels?: Record<string, string>;
  title?: string;
  className?: string;
  sticky?: boolean;
  stickyClassName?: string;
}

const FormErrorSummary = React.forwardRef<HTMLDivElement, FormErrorSummaryProps>(
  ({ errors, fieldLabels, title, className, sticky = false, stickyClassName }, ref) => {
    if (errors.length === 0) return null;

    const scrollToField = (fieldName: string) => {
      const el =
        document.getElementById(fieldName) ??
        document.querySelector<HTMLElement>(`[name="${fieldName}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus({ preventScroll: true });
      }
    };

    return (
      <div
        ref={ref}
        role="alert"
        aria-live="assertive"
        className={cn(
          sticky && "sticky top-3 z-20",
          sticky && stickyClassName,
          "rounded-xl border border-destructive/20 bg-destructive/5 p-3 sm:p-4",
          className,
        )}
        data-field-error="true"
      >
        <div className="flex items-start gap-2.5">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-destructive">
              {title ?? `${errors.length > 1 ? `${errors.length} שגיאות` : 'שגיאה'} דורשות תיקון`}
            </p>
            <ul className="space-y-1">
              {errors.map((err) => (
                <li key={err.field}>
                  <a
                    href={`#${err.field}`}
                    className="text-start text-sm text-destructive/85 underline-offset-2 hover:underline"
                    onClick={() => scrollToField(err.field)}
                  >
                    {fieldLabels?.[err.field]
                      ? `${fieldLabels[err.field]}: ${err.message}`
                      : err.message}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  },
);
FormErrorSummary.displayName = "FormErrorSummary";

const FormActionHint = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-xs leading-5 text-muted-foreground",
      className,
    )}
    {...props}
  />
))
FormActionHint.displayName = "FormActionHint"

export { 
  FormField, 
  FormDescription, 
  FormError, 
  FormLabel,
  FormErrorSummary,
  FormActionHint,
  fieldVariants,
  type FormFieldProps 
}
