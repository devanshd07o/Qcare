/* Source: D:\LetsCode\UI_COMPONENTS\originui\apps\origin\registry\default\ui\textarea.tsx (MIT) — adapted to Q-Care clinical tokens */
import * as React from 'react';
import { cn } from '../../utils/cn';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        className={cn(
          'flex min-h-[96px] w-full rounded-[8px] border border-[var(--border-input)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-base sm:text-[13px] text-[var(--text-primary)] leading-[1.55] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[var(--text-tertiary)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
          'hover:border-[var(--border-input-hover)] focus-visible:border-[var(--accent-primary)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
