import * as React from 'react';
import { cn } from '../../lib/utils';

type GlassSurfaceProps = React.HTMLAttributes<HTMLDivElement> & {
  strength?: 'default' | 'strong';
  sticky?: boolean;
  interactive?: boolean;
};

export const GlassSurface = React.forwardRef<HTMLDivElement, GlassSurfaceProps>(
  ({ className, strength = 'default', sticky = false, interactive = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        sticky ? 'glass-sticky-chrome' : strength === 'strong' ? 'glass-surface-strong' : 'glass-surface',
        interactive && 'transition duration-200 hover:-translate-y-0.5 hover:border-primary/20 active:scale-[0.985]',
        className,
      )}
      {...props}
    />
  ),
);

GlassSurface.displayName = 'GlassSurface';
