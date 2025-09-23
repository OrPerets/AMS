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
  children: React.ReactNode
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, state, label, description, error, required, children, ...props }, ref) => {
    const fieldId = React.useId()
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
          {React.cloneElement(children as React.ReactElement<any>, {
            id: fieldId,
            'aria-describedby': cn(
              description ? descriptionId : undefined,
              error ? errorId : undefined
            ),
            'aria-invalid': error ? 'true' : undefined,
            className: cn(
              (children as React.ReactElement<any>).props.className,
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

export { 
  FormField, 
  FormDescription, 
  FormError, 
  FormLabel,
  fieldVariants,
  type FormFieldProps 
}
