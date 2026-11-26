/* Source: D:\LetsCode\UI_COMPONENTS\magicui (MIT) — adapted for Tailwind v3 + Hue bright clinical teal */
import React from 'react';
import { motion, type MotionStyle, type Transition } from 'motion/react';
import { cn } from '../../utils/cn';

interface BorderBeamProps {
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  transition?: Transition;
  className?: string;
  style?: React.CSSProperties;
  reverse?: boolean;
  initialOffset?: number;
  borderWidth?: number;
}

export const BorderBeam = ({
  className,
  size = 56,
  delay = 0,
  duration = 5,
  colorFrom = 'var(--accent-primary-bright, #0D9488)',
  colorTo = 'var(--status-success, #047857)',
  transition,
  style,
  reverse = false,
  initialOffset = 0,
  borderWidth = 1.5
}: BorderBeamProps) => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-[inherit]"
      style={{
        border: `${borderWidth}px solid transparent`,
        WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude'
      }}
    >
      <motion.div
        className={cn('absolute aspect-square', className)}
        style={
          {
            width: size,
            offsetPath: `rect(0 auto auto 0 round ${size}px)`,
            background: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
            ...style
          } as MotionStyle
        }
        initial={{ offsetDistance: `${initialOffset}%` }}
        animate={{
          offsetDistance: reverse
            ? [`${100 - initialOffset}%`, `${-initialOffset}%`]
            : [`${initialOffset}%`, `${100 + initialOffset}%`]
        }}
        transition={{
          repeat: Infinity,
          ease: 'linear',
          duration,
          delay: -delay,
          ...transition
        }}
      />
    </div>
  );
};
