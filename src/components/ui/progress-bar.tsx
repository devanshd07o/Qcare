/* Source: D:\LetsCode\UI_COMPONENTS\tremor (Apache-2.0) — adapted to QCare Hue semantic tokens */
import React from 'react';
import { cn } from '../../utils/cn';

export type ProgressVariant = 'default' | 'success' | 'warning' | 'neutral';

const TRACK_CLASSES: Record<ProgressVariant, string> = {
  default: 'bg-[var(--accent-subtle)]',
  success: 'bg-[var(--status-success-bg)]',
  warning: 'bg-[var(--status-warning-bg)]',
  neutral: 'bg-[var(--bg-surface-subtle)]'
};

const BAR_CLASSES: Record<ProgressVariant, string> = {
  default: 'bg-[var(--accent-primary-bright)]',
  success: 'bg-[var(--status-success)]',
  warning: 'bg-[var(--status-warning)]',
  neutral: 'bg-[var(--text-secondary)]'
};

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: ProgressVariant;
  label?: string;
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ value = 0, max = 100, variant = 'default', label, className, ...props }, ref) => {
    const safeMax = max > 0 ? max : 100;
    const pct = Math.min(100, Math.max(0, (value / safeMax) * 100));

    return (
      <div
        ref={ref}
        className={cn('flex w-full items-center gap-2.5', className)}
        role="progressbar"
        aria-valuemin={0}
        aria-valuenow={Math.round(value)}
        aria-valuemax={safeMax}
        {...props}
      >
        <div className={cn('relative flex h-2 w-full overflow-hidden rounded-full', TRACK_CLASSES[variant])}>
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none',
              BAR_CLASSES[variant]
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        {label ? (
          <span className="shrink-0 whitespace-nowrap font-mono text-xs font-semibold text-[var(--text-primary)] tabular-nums">
            {label}
          </span>
        ) : null}
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';
