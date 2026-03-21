import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, type InputProps } from './input';
import { cn } from '../../lib/utils';

export interface PasswordInputProps extends Omit<InputProps, 'type'> {
  showLabel?: string;
  hideLabel?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showLabel = 'הצג סיסמה', hideLabel = 'הסתר סיסמה', ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn('pe-11', className)}
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute inset-y-0 end-0 flex items-center pe-3.5 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? hideLabel : showLabel}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
