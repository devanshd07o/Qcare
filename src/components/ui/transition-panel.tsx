/* Source: D:\LetsCode\UI_COMPONENTS\motion-primitives (MIT) — adapted for React + Tailwind v3 */
import React from 'react';
import { AnimatePresence, motion, type MotionProps, type Transition, type Variants } from 'motion/react';
import { cn } from '../../utils/cn';

export type TransitionPanelProps = {
  children: React.ReactNode[];
  className?: string;
  transition?: Transition;
  activeIndex: number;
  variants?: Variants;
} & Omit<MotionProps, 'children'>;

const DEFAULT_VARIANTS: Variants = {
  enter: { opacity: 0, y: 6 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 }
};

export function TransitionPanel({
  children,
  className,
  transition = { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
  variants = DEFAULT_VARIANTS,
  activeIndex,
  ...motionProps
}: TransitionPanelProps) {
  return (
    <div className={cn('relative', className)}>
      <AnimatePresence initial={false} mode="wait" custom={motionProps.custom}>
        <motion.div
          key={activeIndex}
          variants={variants}
          transition={transition}
          initial="enter"
          animate="center"
          exit="exit"
          {...motionProps}
        >
          {children[activeIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
