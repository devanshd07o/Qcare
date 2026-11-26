import React from 'react';
import { cn } from '../../utils/cn';

export type BadgeVariant = 'default' | 'neutral' | 'success' | 'warning' | 'error';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: 'bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] border-[var(--border-default)]',
  neutral: 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)]',
  success: 'bg-[var(--bg-surface-subtle)] text-[var(--status-success)] border-[var(--border-default)]',
  warning: 'bg-[var(--status-warning-bg)] text-[var(--status-warning)] border-[var(--status-warning-border)]',
  error: 'bg-[var(--danger-bg)] text-[var(--danger)] border-red-200'
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-x-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-semibold leading-[1.3] tabular-nums',
          VARIANT_CLASSES[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';
