/* Source: D:\LetsCode\UI_COMPONENTS\originui\apps\origin\registry\default\ui\input.tsx (MIT) — adapted to Q-Care clinical tokens */
import * as React from 'react';
import { cn } from '../../utils/cn';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          'flex h-10 w-full min-w-0 rounded-[8px] border border-[var(--border-input)] bg-[var(--bg-surface)] px-3 py-2 text-base sm:text-[13px] text-[var(--text-primary)] outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-[var(--text-tertiary)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
          'hover:border-[var(--border-input-hover)] focus-visible:border-[var(--accent-primary)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]',
          type === 'search' &&
            '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
