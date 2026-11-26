/* Source: D:\LetsCode\UI_COMPONENTS\motion-primitives (MIT) — adapted for React + Tailwind v3 */
import React, { Children, cloneElement, ReactElement, useEffect, useId, useState } from 'react';
import { AnimatePresence, motion, type Transition } from 'motion/react';
import { cn } from '../../utils/cn';

export type AnimatedBackgroundProps = {
  children:
    | ReactElement<{ 'data-id': string; className?: string; children?: React.ReactNode }>[]
    | ReactElement<{ 'data-id': string; className?: string; children?: React.ReactNode }>;
  defaultValue?: string;
  value?: string;
  onValueChange?: (newActiveId: string | null) => void;
  className?: string;
  transition?: Transition;
  enableHover?: boolean;
};

export function AnimatedBackground({
  children,
  defaultValue,
  value,
  onValueChange,
  className,
  transition = { type: 'spring', bounce: 0.18, duration: 0.32 },
  enableHover = false
}: AnimatedBackgroundProps) {
  const [internalId, setInternalId] = useState<string | null>(defaultValue ?? null);
  const uniqueId = useId();

  const activeId = value !== undefined ? value : internalId;

  useEffect(() => {
    if (defaultValue !== undefined && value === undefined) {
      setInternalId(defaultValue);
    }
  }, [defaultValue, value]);

  const handleSetActiveId = (id: string | null) => {
    if (value === undefined) {
      setInternalId(id);
    }
    if (onValueChange) {
      onValueChange(id);
    }
  };

  return (
    <>
      {Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        const id = (child.props as { 'data-id': string })['data-id'];

        const interactionProps = enableHover
          ? {
              onMouseEnter: () => handleSetActiveId(id),
              onMouseLeave: () => handleSetActiveId(null)
            }
          : {
              onClick: () => handleSetActiveId(id)
            };

        return cloneElement(
          child as ReactElement<Record<string, unknown>>,
          {
            key: id ?? index,
            className: cn('relative inline-flex items-center justify-center', child.props.className),
            'data-checked': activeId === id ? 'true' : 'false',
            ...interactionProps
          },
          <>
            <AnimatePresence initial={false}>
              {activeId === id && (
                <motion.div
                  layoutId={`bg-${uniqueId}`}
                  className={cn('absolute inset-0 pointer-events-none', className)}
                  transition={transition}
                  initial={{ opacity: 0.85 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </AnimatePresence>
            <span className="relative z-10 inline-flex items-center justify-center gap-1.5 w-full">
              {child.props.children}
            </span>
          </>
        );
      })}
    </>
  );
}
